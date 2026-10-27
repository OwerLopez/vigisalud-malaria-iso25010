// SE-01 Confidencialidad, SE-02 Integridad y SE-03 Resistencia.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const base = (process.env.BASE_URL || 'https://vigisalud-malaria.vercel.app').replace(/\/$/, '');
const raiz = process.cwd();
const salida = path.join(raiz, 'evaluacion', 'resultados', `corrida-${process.env.CORRIDA || 'desarrollo'}`);
fs.mkdirSync(salida, { recursive: true });

// SE-03: cabeceras recomendadas por OWASP Secure Headers Project.
const resp = await fetch(`${base}/`, { redirect: 'manual' });
const h = resp.headers;
const csp = h.get('content-security-policy') || '';
const cabeceras = [
  { nombre: 'Content-Security-Policy', ok: /default-src 'self'/.test(csp) && /script-src 'self'(?![^;]*unsafe)/.test(csp) && /object-src 'none'/.test(csp), valor: csp },
  { nombre: 'Strict-Transport-Security', ok: /max-age=(\d+)/.test(h.get('strict-transport-security') || '') && Number((h.get('strict-transport-security').match(/max-age=(\d+)/) || [])[1]) >= 31536000, valor: h.get('strict-transport-security') },
  { nombre: 'X-Content-Type-Options', ok: (h.get('x-content-type-options') || '').toLowerCase() === 'nosniff', valor: h.get('x-content-type-options') },
  { nombre: 'X-Frame-Options / frame-ancestors', ok: /DENY|SAMEORIGIN/i.test(h.get('x-frame-options') || '') || /frame-ancestors 'none'/.test(csp), valor: h.get('x-frame-options') },
  { nombre: 'Referrer-Policy', ok: /strict-origin|no-referrer|same-origin/.test(h.get('referrer-policy') || ''), valor: h.get('referrer-policy') },
  { nombre: 'Permissions-Policy', ok: !!h.get('permissions-policy'), valor: h.get('permissions-policy') },
  { nombre: 'Cross-Origin-Opener-Policy', ok: /same-origin/.test(h.get('cross-origin-opener-policy') || ''), valor: h.get('cross-origin-opener-policy') },
];
const html = await resp.text();
const scriptsTerceros = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).filter((s) => /^https?:/.test(s));
const scriptsEnLinea = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].filter((m) => m[1].trim()).length;

// SE-02: integridad (SHA-256 de los CSV oficiales frente al registrado y publicado) y HTTPS obligatorio.
const cal = await (await fetch(`${base}/data/calidad_datos.json`)).json();
const controlesIntegridad = cal.archivos.map((a) => {
  const local = path.join(raiz, 'datos', 'crudos', a.archivo);
  const hash = fs.existsSync(local) ? crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex') : null;
  return { control: `SHA-256 ${a.archivo}`, publicado: a.sha256, calculado: hash, ok: hash === a.sha256 };
});
const http = await fetch(base.replace('https://', 'http://') + '/', { redirect: 'manual' });
controlesIntegridad.push({ control: 'HTTP redirige a HTTPS', estado: http.status, destino: http.headers.get('location'), ok: [301, 308].includes(http.status) && (http.headers.get('location') || '').startsWith('https://') });

// SE-01: los archivos publicados solo contienen agregados (sin campos de nivel individual).
const prohibidos = ['edad', 'sexo', 'localidad', 'localcod', 'tipo_edad', 'nombre', 'dni', 'id_caso'];
const publicados = ['malaria.json', 'calidad_datos.json', 'departamentos.geojson'];
const archivos = [];
for (const f of publicados) {
  const txt = await (await fetch(`${base}/data/${f}`)).text();
  // Un dato individual es un registro (objeto dentro de un arreglo) con un campo prohibido de valor primitivo,
  // p. ej. [{"edad": 34, "sexo": "F"}]. Los conteos agregados ({"tipo_edad": {"A": 622441}} o
  // {"nulos": {"localidad": 5412}}) no son registros de personas y se admiten.
  const claves = new Set();
  const individuales = new Set();
  const recorrer = (nodo, enArreglo) => {
    if (Array.isArray(nodo)) { nodo.forEach((x) => recorrer(x, true)); return; }
    if (!nodo || typeof nodo !== 'object') return;
    for (const [k, v] of Object.entries(nodo)) {
      if (Number.isNaN(Number(k))) claves.add(k);
      if (enArreglo && prohibidos.includes(k) && (v === null || typeof v !== 'object')) individuales.add(k);
      recorrer(v, false);
    }
  };
  recorrer(JSON.parse(txt), false);
  const encontrados = [...individuales];
  archivos.push({ archivo: f, claves: [...claves].slice(0, 40), campos_prohibidos: encontrados, ok: encontrados.length === 0 });
}

const res = {
  base, fecha: new Date().toISOString(),
  SE01: { archivos, A: archivos.filter((a) => a.ok).length, B: archivos.length },
  SE02: { controles: controlesIntegridad, A: controlesIntegridad.filter((c) => c.ok).length, B: controlesIntegridad.length },
  SE03: { cabeceras, A: cabeceras.filter((c) => c.ok).length, B: cabeceras.length, scripts_de_terceros: scriptsTerceros, scripts_en_linea: scriptsEnLinea },
};
fs.writeFileSync(path.join(salida, 'seguridad.json'), JSON.stringify(res, null, 1));
console.log(JSON.stringify({ SE01: [res.SE01.A, res.SE01.B], SE02: [res.SE02.A, res.SE02.B], SE03: [res.SE03.A, res.SE03.B], terceros: scriptsTerceros }, null, 0));
