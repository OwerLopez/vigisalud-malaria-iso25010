// Consolida las corridas en el formato de registro (evaluacion/resultados/registro.json)
// y en los datos del tablero de control (site/data/calidad.json).
import fs from 'node:fs';
import path from 'node:path';

const raiz = process.cwd();
const ev = path.join(raiz, 'evaluacion');
const leer = (f, def = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf-8')); } catch { return def; } };
const modelo = leer(path.join(ev, 'modelo.json'));
const { metricas, integrantes, nota } = leer(path.join(ev, 'metricas.json'));
const requisitos = leer(path.join(ev, 'requisitos.json'));
const incidentes = leer(path.join(ev, 'incidentes.json'), []);
const { versiones } = leer(path.join(ev, 'versiones.json'), { versiones: {} });
const etiqueta = (commit) => (versiones[commit] ? `${versiones[commit].version} (${commit})` : commit || null);
const dirRes = path.join(ev, 'resultados');
const corridas = fs.existsSync(dirRes) ? fs.readdirSync(dirRes).filter((d) => /^corrida-\d\d$/.test(d)).sort() : [];

function pruebas(pw) {
  const out = [];
  const rec = (s, archivo) => {
    for (const sp of s.specs || []) for (const t of sp.tests) out.push({ titulo: sp.title, archivo: archivo || s.file, proyecto: t.projectName, estado: t.results.at(-1)?.status });
    for (const h of s.suites || []) rec(h, archivo || s.file);
  };
  for (const s of pw?.suites || []) rec(s, s.file);
  return out;
}

function medir(dir) {
  const f = (n, def) => leer(path.join(dir, n), def);
  const pw = pruebas(f('playwright.json'));
  const inter = f('interaccion.json', []);
  const fila = (m) => inter.find((x) => x.metrica === m);
  const filas = (m) => inter.filter((x) => x.metrica === m);
  const lh = f('lighthouse.json');
  const fia = f('fiabilidad.json', []);
  const adap = ['chromium', 'firefox', 'webkit'].flatMap((p) => f(`adaptabilidad-${p}.json`, []));
  const seg = f('seguridad.json');
  const man = f('mantenibilidad.json');
  const disp = f('disponibilidad.json');
  const rf = requisitos.funcionales.map((r) => r.id);
  const rfOk = rf.filter((id) => pw.some((p) => p.proyecto === 'chromium' && p.titulo.startsWith(id) && p.estado === 'passed'));
  const rnfScripts = { 'RNF-03': !!lh, 'RNF-04': !!lh, 'RNF-08': !!disp, 'RNF-09': !!seg, 'RNF-10': !!seg, 'RNF-11': !!seg, 'RNF-12': !!man };
  const req = [...rf, ...requisitos.no_funcionales.map((r) => r.id)];
  const conPrueba = req.filter((id) => pw.some((p) => p.titulo.includes(id)) || rnfScripts[id]);
  const prop = (A, B, ev) => (B ? { A, B, X: +(A / B * 100).toFixed(2), evidencia: ev } : null);
  const valor = (v, ev) => (v === null || v === undefined ? null : { A: +(+v).toFixed(3), B: null, X: +(+v).toFixed(3), evidencia: ev });
  const cuenta = (arr, k) => arr.filter((x) => x[k]).length;
  // Denominador = casos planificados en Playwright (incluye los que no llegaron a ejecutarse o fallaron al iniciar).
  const casos = (prefijo) => pw.filter((p) => p.titulo.startsWith(prefijo));
  const aprobados = (prefijo) => casos(prefijo).filter((p) => p.estado === 'passed').length;
  return {
    'IF-01': pw.length ? prop(rfOk.length, rf.length, 'playwright.json, reporte-html/') : null,
    'IF-02': (() => { const o = f('if02-oraculo.json'); return o ? prop(cuenta(o, 'ok'), o.length, 'if02-oraculo.json') : null; })(),
    'IF-03': fila('IF-03') ? prop(fila('IF-03').ok, fila('IF-03').total, 'interaccion.json, capturas/if03-dimensiones.png') : null,
    'ED-01': lh ? valor(lh.mediana.lcp_s, 'lighthouse.json, lighthouse.html') : null,
    'ED-02': (() => { const r = f('ed02-respuesta.json'); return r ? valor(r[0].mediana_ms, 'ed02-respuesta.json') : null; })(),
    'ED-03': lh ? valor(lh.mediana.peso_kb, 'lighthouse.json') : null,
    'CO-01': (() => { const r = f('co01-exportaciones.json'); return r ? prop(cuenta(r, 'ok'), r.length, 'co01-exportaciones.json') : null; })(),
    'CI-01': fila('CI-01') ? prop(fila('CI-01').alcanzados - (Object.values(fila('CI-01').operaciones).every(Boolean) ? 0 : 1), fila('CI-01').controles, 'interaccion.json') : null,
    'CI-02': filas('CI-02').length ? prop(cuenta(filas('CI-02'), 'ok'), filas('CI-02').length, 'interaccion.json') : null,
    'CI-03': casos('RNF-05 axe-core').length ? prop(aprobados('RNF-05 axe-core'), casos('RNF-05 axe-core').length, 'ci03-axe.json, playwright.json') : null,
    'CI-04': fila('CI-04') ? prop(fila('CI-04').ok, fila('CI-04').total, 'interaccion.json') : null,
    'FI-01': casos('RNF-07 RNF-13').length ? prop(cuenta(adap, 'sin_errores'), casos('RNF-07 RNF-13').length, 'adaptabilidad-*.json, playwright.json') : null,
    'FI-02': disp ? prop(disp.respuestas_200, disp.sondeos_totales, 'disponibilidad.json') : null,
    'FI-03': fia.length ? prop(cuenta(fia, 'mensaje_controlado'), fia.length, 'fiabilidad.json, capturas/fi03-*.png') : null,
    'FI-04': fia.length ? prop(cuenta(fia, 'recuperado'), fia.length, 'fiabilidad.json') : null,
    'SE-01': seg ? prop(seg.SE01.A, seg.SE01.B, 'seguridad.json') : null,
    'SE-02': seg ? prop(seg.SE02.A, seg.SE02.B, 'seguridad.json') : null,
    'SE-03': seg ? prop(seg.SE03.A, seg.SE03.B, 'seguridad.json') : null,
    'MA-01': man ? prop(man.MA01.A, man.MA01.B, 'mantenibilidad.json') : null,
    'MA-02': man ? valor(man.MA02.densidad, 'mantenibilidad.json') : null,
    'MA-03': pw.length ? prop(conPrueba.length, req.length, 'playwright.json + scripts') : null,
    'FL-01': casos('RNF-07 RNF-13').length ? prop(aprobados('RNF-07 RNF-13'), casos('RNF-07 RNF-13').length, 'adaptabilidad-*.json, capturas/fl01-*.png') : null,
    'SO-01': filas('SO-01').length ? prop(cuenta(filas('SO-01'), 'ok'), filas('SO-01').length, 'interaccion.json') : null,
    'SO-02': fia.length ? prop(fia.filter((x) => x.cifras_visibles_durante_fallo === 0).length, fia.length, 'fiabilidad.json') : null,
    'SO-03': fila('SO-03') ? prop(fila('SO-03').ok, fila('SO-03').total, 'interaccion.json') : null,
    _requisitos: req.map((id) => ({ id, prueba: conPrueba.includes(id), aprobado: id.startsWith('RF') ? rfOk.includes(id) : null })),
    _pruebas: { total: pw.length, aprobadas: pw.filter((p) => p.estado === 'passed').length, fallidas: pw.filter((p) => p.estado === 'failed').map((p) => `${p.proyecto}: ${p.titulo}`) },
  };
}

function evaluar(m, r) {
  if (!r) return { estado: 'Pendiente', puntaje: null, categoria: null };
  const cumple = m.sentido === 'mayor' ? r.X >= m.umbral : r.X <= m.umbral;
  const puntaje = m.tipo === 'proporcion' ? r.X : Math.min(100, +(100 * m.umbral / Math.max(r.X, 1e-9)).toFixed(2));
  const cat = modelo.escala_paper.find((c) => puntaje >= c.desde && (puntaje < c.hasta || c.hasta === 100));
  return { estado: cumple ? 'Aprobado' : 'Rechazado', puntaje, categoria: cat ? cat.es : null };
}

const datosCorridas = corridas.map((c) => {
  const dir = path.join(dirRes, c);
  const meta = leer(path.join(dir, 'meta.json'), { corrida: c.slice(-2) });
  const med = medir(dir);
  return { id: c.slice(-2), meta, med };
});

const registro = [];
const resultadoMetricas = metricas.map((m) => {
  const porCorrida = datosCorridas.map((dc) => {
    const r = dc.med[m.id];
    const e = evaluar(m, r);
    const inc = incidentes.filter((i) => i.corrida === dc.id && i.metrica === m.id);
    registro.push({
      identificacion: { id: m.id, caracteristica: modelo.caracteristicas.find((c) => c.id === m.car).es, subcaracteristica: m.sub },
      trazabilidad: { requisito: m.requisito, procedimiento: m.procedimiento },
      condiciones: { corrida: dc.id, version: etiqueta(dc.meta.commit), fecha: dc.meta.fecha || null, entorno: dc.meta.entorno || null, url: dc.meta.base_url || null, datos: dc.meta.datos || null },
      medicion: { A: r ? r.A : null, B: r ? r.B : null, formula: m.tipo === 'proporcion' ? 'X = A / B × 100' : 'X = valor medido', resultado: r ? r.X : null, unidad: m.unidad },
      evaluacion: { umbral: `${m.sentido === 'mayor' ? '≥' : '≤'} ${m.umbral} ${m.unidad}`, esperado: m.pregunta, estado: e.estado, puntaje: e.puntaje, categoria: e.categoria },
      evidencia: r ? `evaluacion/resultados/corrida-${dc.id}/${r.evidencia}` : null,
      seguimiento: { responsable: integrantes[m.responsable], incidentes: inc.map((i) => i.id), decision: inc.map((i) => i.decision).join(' ') || (e.estado === 'Aprobado' ? 'Aceptar' : e.estado === 'Rechazado' ? 'Registrar incidente y corregir' : 'Ejecutar medición'), observaciones: '' },
    });
    return { corrida: dc.id, ...(r || {}), ...e, incidentes: inc.map((i) => i.id) };
  });
  return { ...m, responsable_nombre: integrantes[m.responsable], resultados: porCorrida };
});

const ultima = datosCorridas.length - 1;
const caracteristicas = modelo.caracteristicas.map((c) => {
  const ms = resultadoMetricas.filter((m) => m.car === c.id);
  const res = ms.map((m) => m.resultados[ultima] || { estado: 'Pendiente' });
  const estado = res.some((r) => r.estado === 'Rechazado') ? 'Rechazado' : res.some((r) => r.estado === 'Pendiente') ? 'Pendiente' : 'Aprobado';
  const puntajes = res.map((r) => r.puntaje).filter((x) => x !== null && x !== undefined);
  const puntaje = puntajes.length ? +(puntajes.reduce((s, x) => s + x, 0) / puntajes.length).toFixed(1) : null;
  const cat = puntaje === null ? null : modelo.escala_paper.find((k) => puntaje >= k.desde && (puntaje < k.hasta || k.hasta === 100));
  return { ...c, estado, puntaje, categoria: cat ? cat.es : null, categoria_en: cat ? cat.en : null, metricas: ms.map((m) => m.id) };
});

const resumenCorridas = datosCorridas.map((dc, i) => {
  const est = resultadoMetricas.map((m) => m.resultados[i].estado);
  return { id: dc.id, meta: { ...dc.meta, version: etiqueta(dc.meta.commit) }, aprobadas: est.filter((e) => e === 'Aprobado').length, rechazadas: est.filter((e) => e === 'Rechazado').length,
    pendientes: est.filter((e) => e === 'Pendiente').length, pruebas: dc.med._pruebas, requisitos: dc.med._requisitos };
});

const noAplicables = modelo.caracteristicas.flatMap((c) => c.sub.filter((s) => s.estado !== 'seleccionada').map((s) => ({ car: c.id, caracteristica: c.es, caracteristica_en: c.en, ...s })));
const salida = { generado: new Date().toISOString(), norma: modelo.norma, objeto: modelo.objeto, objeto_en: modelo.objeto_en, nota, escala: modelo.escala_paper,
  caracteristicas, metricas: resultadoMetricas, corridas: resumenCorridas, incidentes, no_aplicables: noAplicables, requisitos };
fs.writeFileSync(path.join(raiz, 'site', 'data', 'calidad.json'), JSON.stringify(salida));
fs.mkdirSync(dirRes, { recursive: true });
fs.writeFileSync(path.join(dirRes, 'registro.json'), JSON.stringify(registro, null, 1));
// Evidencias visuales que el tablero muestra (copias livianas dentro del sitio).
const destEv = path.join(raiz, 'site', 'evidencias');
fs.mkdirSync(destEv, { recursive: true });
const preferidas = ['rf01-panorama', 'rf06-canal-endemico', 'rf07-mapa-ranking', 'rf09-piramide', 'fi03-red-caida', 'fl01-webkit-movil', 'fl01-firefox-movil', 'rf15-tablero-calidad', 'rf10-distritos'];
salida.evidencias = [];
if (corridas.length) {
  const cap = path.join(dirRes, corridas.at(-1), 'capturas');
  if (fs.existsSync(cap)) {
    for (const f of fs.readdirSync(cap)) fs.copyFileSync(path.join(cap, f), path.join(destEv, f));
    salida.evidencias = preferidas.filter((n) => fs.existsSync(path.join(cap, `${n}.png`)));
  }
}
fs.writeFileSync(path.join(raiz, 'site', 'data', 'calidad.json'), JSON.stringify(salida));
console.log(resumenCorridas.map((c) => `corrida ${c.id}: ${c.aprobadas} aprobadas, ${c.rechazadas} rechazadas, ${c.pendientes} pendientes; pruebas ${c.pruebas.aprobadas}/${c.pruebas.total}`).join('\n') || 'sin corridas: todas las métricas en Pendiente');
for (const m of resultadoMetricas) { const r = m.resultados[ultima]; if (r) console.log(m.id, r.A, r.B, r.X, r.estado, r.categoria); }
