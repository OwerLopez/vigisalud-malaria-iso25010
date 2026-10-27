/* Tablero de control de calidad ISO/IEC 25010. Lee data/calidad.json, generado por evaluacion/scripts/consolidar.mjs. */
Object.assign(window.I18N.es, {
  qBrand: "Calidad · ISO 25010", qNavResumen: "Resumen", qNavCar: "Características", qNavMet: "Métricas", qNavReq: "Requisitos",
  qNavInc: "Incidentes", qNavEvo: "Evolución", qNavProc: "Proceso y evidencias", qNavDash: "Dashboard de malaria", qCorrida: "Corrida",
  qError: "No se pudo cargar la evaluación.", qEyebrow: "ISO/IEC 25010:2023 · GQM · ISO/IEC 25040",
  qTitulo: "Tablero de control de calidad del producto",
  qLede: (d) => `Evaluación de ${d.objeto}. Corrida ${d.corrida} del ${d.fecha}, versión ${d.version}. ${d.aprob} de ${d.total} métricas cumplen su umbral.`,
  qKMet: "Métricas aprobadas", qKCar: "Características aprobadas", qKReq: "Requisitos con prueba", qKInc: "Incidentes abiertos", qKPru: "Pruebas aprobadas",
  qEstadoT: "Estado de las métricas", qEstadoN: "Aprobado, rechazado, pendiente y no aplicable, con umbrales fijados antes de medir.",
  qPuntajeT: "Puntaje por característica", qPuntajeN: "Promedio de los puntajes de sus métricas (0–100) sobre la escala del artículo de referencia.",
  qCarT: "Características y subcaracterísticas adoptadas", qCarN: "Selección y prioridad justificadas para un sistema de vigilancia en salud pública.",
  qNaT: "Subcaracterísticas no aplicables o no evaluadas", qThCar: "Característica", qThSub: "Subcaracterística", qThEstado: "Estado", qThMotivo: "Justificación",
  qMetT: "Métricas y resultados", qMetN: (n) => `${n} métricas definidas con el enfoque GQM (objetivo, pregunta, métrica). X = A / B × 100 en las de proporción.`,
  qThMetrica: "Métrica", qThRes: "Resultado", qThUmbral: "Umbral", qThCat: "Categoría", qThEvid: "Evidencia",
  qReqT: "Cobertura de requisitos", qReqN: (a, b) => `${a} de ${b} requisitos tienen al menos una prueba automatizada.`,
  qIncT: "Incidentes y su origen", qIncN: "Cada fallo se clasifica según su origen antes de decidir: defecto del producto, error del script de prueba o problema de infraestructura.",
  qIncOrigen: "Distribución por origen y estado", qIncLista: "Registro de incidentes", qThDesc: "Descripción", qThOrigen: "Origen",
  qEvoT: "Evolución de las corridas", qEvoN: "Cada corrida ejecuta las mismas pruebas sobre la versión publicada; las correcciones entre corridas responden a incidentes registrados.",
  qEvoMet: "Métricas por estado en cada corrida", qEvoCond: "Condiciones de cada corrida", qThFecha: "Fecha", qThVersion: "Versión", qThPruebas: "Pruebas",
  qProcT: "Proceso de evaluación y evidencias", qProcN: "Proceso basado en ISO/IEC 25040; cada medición queda registrada con sus condiciones, evidencia y seguimiento.",
  qEvidT: "Evidencias de la última corrida", ver: "ver",
  estados: { Aprobado: "Aprobado", Rechazado: "Rechazado", Pendiente: "Pendiente", "No aplicable": "No aplicable", "no aplicable": "No aplicable", "no evaluada": "No evaluada", Todos: "Todos" },
  origenes: { producto: "Producto", script: "Script de prueba", infraestructura: "Infraestructura" },
  incEstados: { resuelto: "Resuelto", abierto: "Abierto", aceptado: "Aceptado" },
  prioridad: "Prioridad", sinIncidentes: "No se registraron incidentes.",
  pasos: [["1. Requisitos de la evaluación", "Objeto, propósito y características a evaluar (Punto 1)."], ["2. Especificación", "Métricas GQM con fórmula, fuente y umbral fijado antes de medir (Punto 2)."],
    ["3. Diseño", "Procedimientos, entorno, responsables y formato de registro (Punto 3)."], ["4. Ejecución", "Corridas automatizadas en producción; clasificación de fallos por origen."],
    ["5. Conclusión", "Tablero de control, decisión por característica y acciones de mejora (Punto 4)."]],
});
Object.assign(window.I18N.en, {
  qBrand: "Quality · ISO 25010", qNavResumen: "Summary", qNavCar: "Characteristics", qNavMet: "Metrics", qNavReq: "Requirements",
  qNavInc: "Incidents", qNavEvo: "Evolution", qNavProc: "Process & evidence", qNavDash: "Malaria dashboard", qCorrida: "Run",
  qError: "The evaluation could not be loaded.", qEyebrow: "ISO/IEC 25010:2023 · GQM · ISO/IEC 25040",
  qTitulo: "Product quality control board",
  qLede: (d) => `Evaluation of ${d.objeto}. Run ${d.corrida} on ${d.fecha}, version ${d.version}. ${d.aprob} of ${d.total} metrics meet their threshold.`,
  qKMet: "Metrics passed", qKCar: "Characteristics passed", qKReq: "Requirements with a test", qKInc: "Open incidents", qKPru: "Tests passed",
  qEstadoT: "Metric status", qEstadoN: "Passed, failed, pending and not applicable, with thresholds set before measuring.",
  qPuntajeT: "Score by characteristic", qPuntajeN: "Mean of its metric scores (0–100) on the reference article's scale.",
  qCarT: "Adopted characteristics and sub-characteristics", qCarN: "Selection and priority justified for a public-health surveillance system.",
  qNaT: "Sub-characteristics not applicable or not evaluated", qThCar: "Characteristic", qThSub: "Sub-characteristic", qThEstado: "Status", qThMotivo: "Rationale",
  qMetT: "Metrics and results", qMetN: (n) => `${n} metrics defined with GQM (goal, question, metric). X = A / B × 100 for ratio metrics.`,
  qThMetrica: "Metric", qThRes: "Result", qThUmbral: "Threshold", qThCat: "Category", qThEvid: "Evidence",
  qReqT: "Requirement coverage", qReqN: (a, b) => `${a} of ${b} requirements have at least one automated test.`,
  qIncT: "Incidents and their origin", qIncN: "Every failure is classified by origin before deciding: product defect, test-script error or infrastructure problem.",
  qIncOrigen: "Distribution by origin and status", qIncLista: "Incident log", qThDesc: "Description", qThOrigen: "Origin",
  qEvoT: "Evolution across runs", qEvoN: "Each run executes the same tests on the published version; fixes between runs respond to logged incidents.",
  qEvoMet: "Metrics by status in each run", qEvoCond: "Conditions of each run", qThFecha: "Date", qThVersion: "Version", qThPruebas: "Tests",
  qProcT: "Evaluation process and evidence", qProcN: "Process based on ISO/IEC 25040; every measurement is logged with its conditions, evidence and follow-up.",
  qEvidT: "Evidence from the latest run", ver: "view",
  estados: { Aprobado: "Passed", Rechazado: "Failed", Pendiente: "Pending", "No aplicable": "Not applicable", "no aplicable": "Not applicable", "no evaluada": "Not evaluated", Todos: "All" },
  origenes: { producto: "Product", script: "Test script", infraestructura: "Infrastructure" },
  incEstados: { resuelto: "Resolved", abierto: "Open", aceptado: "Accepted" },
  prioridad: "Priority", prioridades: { Alta: "High", Media: "Medium", Baja: "Low" }, sinIncidentes: "No incidents were logged.",
  pasos: [["1. Evaluation requirements", "Object, purpose and characteristics to evaluate (Point 1)."], ["2. Specification", "GQM metrics with formula, source and threshold set before measuring (Point 2)."],
    ["3. Design", "Procedures, environment, owners and logging format (Point 3)."], ["4. Execution", "Automated runs in production; failures classified by origin."],
    ["5. Conclusion", "Control board, decision per characteristic and improvement actions (Point 4)."]],
});

(function () {
  const { t, fmt, esc, css, mostrarTip, ocultarTip } = VM;
  const REPO = "https://github.com/OwerLopez/vigisalud-malaria-iso25010/blob/main/";
  let C = null, idx = 0, filtro = "Todos";
  const CLASE = { Aprobado: "good", Rechazado: "critical", Pendiente: "pending", "No aplicable": "na", "no aplicable": "na", "no evaluada": "na" };
  const ICONO = { good: "✓", critical: "✕", pending: "…", na: "–", warning: "!" };
  const badge = (estado) => { const c = CLASE[estado] || "na"; return `<span class="badge ${c}"><i aria-hidden="true">${ICONO[c]}</i>${esc(t("estados")[estado] || estado)}</span>`; };
  const en = () => VM.idioma.actual === "en";
  const nom = (o, k = "es") => (en() && o[`${k === "es" ? "" : k}en`] ? o.en : o.es);

  async function cargar() {
    document.getElementById("estadoError").hidden = true;
    try {
      const r = await fetch("data/calidad.json");
      if (!r.ok) throw new Error(r.status);
      C = await r.json();
    } catch {
      document.getElementById("estadoCarga").hidden = true;
      document.getElementById("estadoError").hidden = false;
      return;
    }
    idx = Math.max(0, C.corridas.length - 1);
    const p = new URLSearchParams(location.search).get("corrida");
    const i = C.corridas.findIndex((c) => c.id === p);
    if (i >= 0) idx = i;
    document.getElementById("estadoCarga").hidden = true;
    document.getElementById("app").hidden = false;
    render();
    VM.seguirSecciones();
  }

  const res = (m) => m.resultados[idx] || { estado: "Pendiente" };
  function render() {
    VM.aplicarTextos();
    const corr = C.corridas[idx] || { id: "—", meta: {}, aprobadas: 0, rechazadas: 0, pendientes: C.metricas.length, pruebas: { total: 0, aprobadas: 0 }, requisitos: [] };
    document.getElementById("segCorrida").innerHTML = C.corridas.length
      ? C.corridas.map((c, i) => `<button type="button" data-i="${i}" aria-pressed="${i === idx}">${c.id}</button>`).join("")
      : `<button type="button" aria-pressed="true" disabled>—</button>`;
    const fecha = corr.meta.fecha ? new Intl.DateTimeFormat(VM.loc(), { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(corr.meta.fecha)) : "—";
    document.getElementById("qLede").textContent = t("qLede")({ objeto: en() && C.objeto_en ? C.objeto_en : C.objeto, corrida: corr.id, fecha, version: corr.meta.version || corr.meta.commit || "—", aprob: corr.aprobadas, total: C.metricas.length });
    kpis(corr); estados(corr); puntajes(); caracteristicas(); noAplicables(); metricas(); requisitosCob(corr); incidentes(); evolucion(); proceso(); galeria();
    const u = new URL(location.href); if (corr.id !== "—") u.searchParams.set("corrida", corr.id); history.replaceState(null, "", u);
  }

  function kpis(corr) {
    const carOk = C.caracteristicas.filter((c) => estadoCar(c) === "Aprobado").length;
    const reqCon = corr.requisitos.filter((r) => r.prueba).length;
    const abiertos = C.incidentes.filter((i) => i.estado === "abierto" && i.corrida <= corr.id).length;
    const k = [[t("qKMet"), `${corr.aprobadas} / ${C.metricas.length}`, corr.rechazadas ? badge("Rechazado") : corr.pendientes ? badge("Pendiente") : badge("Aprobado")],
      [t("qKCar"), `${carOk} / ${C.caracteristicas.length}`, ""], [t("qKReq"), `${reqCon} / ${corr.requisitos.length || "—"}`, ""],
      [t("qKPru"), `${corr.pruebas.aprobadas} / ${corr.pruebas.total}`, ""], [t("qKInc"), String(abiertos), abiertos ? badge("Rechazado") : C.corridas.length ? badge("Aprobado") : badge("Pendiente")]];
    document.getElementById("qKpis").innerHTML = k.map(([l, v, b]) => `<div class="card kpi"><div class="lab">${esc(l)}</div><div class="val num">${esc(v)}</div><div class="foot">${b}</div></div>`).join("");
  }

  function estadoCar(c) {
    const est = c.metricas.map((id) => res(C.metricas.find((m) => m.id === id)).estado);
    return est.includes("Rechazado") ? "Rechazado" : est.includes("Pendiente") ? "Pendiente" : "Aprobado";
  }
  function puntajeCar(c) {
    const p = c.metricas.map((id) => res(C.metricas.find((m) => m.id === id)).puntaje).filter((x) => x !== null && x !== undefined);
    return p.length ? p.reduce((s, x) => s + x, 0) / p.length : null;
  }
  const categoria = (p) => { if (p === null) return "—"; const c = C.escala.find((k) => p >= k.desde && (p < k.hasta || k.hasta === 100)); return c ? (en() ? c.en : c.es) : "—"; };

  function svgEn(id, w, h, lab) { const b = document.getElementById(id); b.innerHTML = ""; b.setAttribute("aria-label", lab); return d3.select(b).append("svg").attr("viewBox", `0 0 ${w} ${h}`).attr("aria-hidden", "true"); }
  const ancho = (id) => Math.max(300, document.getElementById(id).clientWidth);

  function estados(corr) {
    const na = C.no_aplicables.length;
    const partes = [["Aprobado", corr.aprobadas, "--good"], ["Rechazado", corr.rechazadas, "--crit"], ["Pendiente", corr.pendientes, "--vivax"], ["No aplicable", na, "--na"]];
    const total = d3.sum(partes, (p) => p[1]);
    const W = ancho("chEstados"), H = 64;
    const svg = svgEn("chEstados", W, H, `${t("qEstadoT")}: ${partes.map((p) => `${t("estados")[p[0]]} ${p[1]}`).join(", ")}`);
    const x = d3.scaleLinear([0, total], [0, W]);
    let acc = 0;
    partes.forEach(([e, n, col]) => {
      if (!n) return;
      const x0 = x(acc), x1 = x(acc + n);
      svg.append("rect").attr("x", x0 + 1).attr("y", 8).attr("width", Math.max(0, x1 - x0 - 2)).attr("height", 34).attr("rx", 4).attr("fill", css(col))
        .on("mousemove", (ev) => mostrarTip(ev, t("estados")[e], [[css(col), t("qThMetrica"), n]])).on("mouseleave", ocultarTip);
      svg.append("text").attr("x", (x0 + x1) / 2).attr("y", 25).attr("dy", "0.35em").attr("text-anchor", "middle").attr("class", "val-l").style("fill", "#fff").text(n);
      acc += n;
    });
    document.getElementById("lgEstados").innerHTML = partes.map(([e, n, c]) => `<span><i style="background:${css(c)}"></i>${esc(t("estados")[e])} (${n})</span>`).join("");
  }

  function puntajes() {
    const filas = C.caracteristicas.map((c) => ({ c, p: puntajeCar(c), e: estadoCar(c) }));
    const W = ancho("chPuntaje"), fila = 26, L = Math.min(190, W * 0.42), H = filas.length * fila + 26;
    const svg = svgEn("chPuntaje", W, H, t("qPuntajeT"));
    const x = d3.scaleLinear([0, 100], [L, W - 40]);
    [40, 60, 90].forEach((v) => { svg.append("line").attr("x1", x(v)).attr("x2", x(v)).attr("y1", 0).attr("y2", H - 20).attr("stroke", css("--line")).attr("stroke-dasharray", "3 3");
      svg.append("text").attr("x", x(v)).attr("y", H - 6).attr("text-anchor", "middle").text(v); });
    filas.forEach((r, i) => {
      const y = i * fila;
      svg.append("text").attr("x", L - 8).attr("y", y + fila / 2).attr("dy", "0.35em").attr("text-anchor", "end").text(nom(r.c));
      if (r.p === null) { svg.append("text").attr("x", x(0) + 4).attr("y", y + fila / 2).attr("dy", "0.35em").text(t("estados").Pendiente); return; }
      const col = r.e === "Aprobado" ? "--good" : r.e === "Rechazado" ? "--crit" : "--vivax";
      svg.append("rect").attr("x", x(0)).attr("y", y + 6).attr("width", Math.max(2, x(r.p) - x(0))).attr("height", fila - 12).attr("rx", 3).attr("fill", css(col))
        .on("mousemove", (ev) => mostrarTip(ev, nom(r.c), [[null, "Puntaje", fmt(r.p, 1)], [null, t("qThCat"), categoria(r.p)], [null, t("qThEstado"), t("estados")[r.e]]])).on("mouseleave", ocultarTip);
      svg.append("text").attr("class", "val-l").attr("x", x(r.p) + 5).attr("y", y + fila / 2).attr("dy", "0.35em").text(fmt(r.p, 0));
    });
  }

  function caracteristicas() {
    document.getElementById("caracteristicas").innerHTML = C.caracteristicas.map((c) => {
      const e = estadoCar(c), p = puntajeCar(c);
      const subs = c.sub.filter((s) => s.estado === "seleccionada").map((s) => `<span class="pill">${esc(en() ? s.en : s.es)}</span>`).join(" ");
      return `<div class="card" data-car="${c.id}"><div class="toolbar"><h3>${esc(nom(c))}</h3>${badge(e)}</div>
        <div class="foot count">${esc(t("prioridad"))}: <b>${esc((t("prioridades") || {})[c.prioridad] || c.prioridad)}</b> · ${p === null ? "—" : `${fmt(p, 1)} · ${esc(categoria(p))}`}</div>
        <p class="note" style="margin:0">${esc(en() && c.justificacion_en ? c.justificacion_en : c.justificacion)}</p><div>${subs}</div>
        <div class="count mono">${c.metricas.join(" · ")}</div></div>`;
    }).join("");
  }

  function noAplicables() {
    document.querySelector("#tbNa tbody").innerHTML = C.no_aplicables.map((s) => `<tr><td>${esc(en() && s.caracteristica_en ? s.caracteristica_en : s.caracteristica)}</td><td>${esc(en() ? s.en : s.es)}</td><td>${badge(s.estado)}</td><td>${esc(en() && s.motivo_en ? s.motivo_en : s.motivo)}</td></tr>`).join("");
  }

  function metricas() {
    document.getElementById("qMetN").textContent = t("qMetN")(C.metricas.length);
    document.getElementById("segEstado").innerHTML = ["Todos", "Aprobado", "Rechazado", "Pendiente"].map((e) => `<button type="button" data-e="${e}" aria-pressed="${filtro === e}">${esc(t("estados")[e])}</button>`).join("");
    const filas = C.metricas.filter((m) => filtro === "Todos" || res(m).estado === filtro);
    document.querySelector("#tbMetricas tbody").innerHTML = filas.map((m) => {
      const r = res(m);
      return `<tr data-metrica="${m.id}"><td><span class="pill">${m.id}</span></td>
        <td>${esc(en() ? m.nombre_en : m.nombre)}<span class="sub">${esc(en() ? m.sub_en : m.sub)} · ${esc(m.responsable_nombre)}</span></td>
        <td class="n">${r.A ?? "—"}</td><td class="n">${r.B ?? "—"}</td><td class="n">${valorX(m, r)}</td>
        <td class="n">${m.sentido === "mayor" ? "≥" : "≤"} ${fmt(m.umbral, m.umbral % 1 ? 1 : 0)}${unidadDe(m)}</td>
        <td class="hide-sm">${esc(r.puntaje == null ? "—" : categoria(r.puntaje))}</td><td>${badge(r.estado)}</td><td class="hide-sm">${enlaceEvidencia(r)}</td></tr>`;
    }).join("");
  }

  const unidadDe = (m) => (m.unidad === "%" ? " %" : ` ${m.unidad}`);
  const valorX = (m, r) => (r.X == null ? "—" : fmt(r.X, m.tipo === "proporcion" ? 1 : 2) + unidadDe(m));
  const enlaceEvidencia = (r) => (r.evidencia
    ? `<a href="${REPO}evaluacion/resultados/corrida-${r.corrida}/${esc(r.evidencia.split(",")[0].trim())}" target="_blank" rel="noopener">${t("ver")}</a>`
    : "—");

  function requisitosCob(corr) {
    const lista = [...C.requisitos.funcionales, ...C.requisitos.no_funcionales];
    const estado = (id) => corr.requisitos.find((r) => r.id === id) || {};
    const con = corr.requisitos.filter((r) => r.prueba).length;
    document.getElementById("qReqN").textContent = t("qReqN")(con, lista.length);
    document.getElementById("reqGrid").innerHTML = lista.map((r) => {
      const e = estado(r.id);
      const b = e.aprobado === true ? badge("Aprobado") : e.aprobado === false ? badge("Rechazado") : e.prueba ? badge("Aprobado") : badge("Pendiente");
      return `<div class="toolbar" style="border-bottom:1px solid var(--line);padding-bottom:6px"><span><span class="pill">${r.id}</span> ${esc(en() && r.en ? r.en : r.es)}</span>${b}</div>`;
    }).join("");
  }

  function incidentes() {
    const lista = C.incidentes;
    const origenes = ["producto", "script", "infraestructura"];
    const W = ancho("chIncidentes"), fila = 34, L = 140, H = origenes.length * fila + 6;
    const svg = svgEn("chIncidentes", W, H, t("qIncOrigen"));
    const max = Math.max(1, ...origenes.map((o) => lista.filter((i) => i.origen === o).length));
    const x = d3.scaleLinear([0, max], [L, W - 30]);
    const cols = { resuelto: "--good", aceptado: "--warn", abierto: "--crit" };
    origenes.forEach((o, i) => {
      const y = i * fila;
      svg.append("text").attr("x", L - 8).attr("y", y + fila / 2).attr("dy", "0.35em").attr("text-anchor", "end").text(t("origenes")[o]);
      let acc = 0;
      ["resuelto", "aceptado", "abierto"].forEach((e) => {
        const n = lista.filter((x) => x.origen === o && x.estado === e).length;
        if (!n) return;
        svg.append("rect").attr("x", x(acc) + 1).attr("y", y + 7).attr("width", Math.max(2, x(acc + n) - x(acc) - 2)).attr("height", fila - 14).attr("rx", 3).attr("fill", css(cols[e]))
          .on("mousemove", (ev) => mostrarTip(ev, t("origenes")[o], [[css(cols[e]), t("incEstados")[e], n]])).on("mouseleave", ocultarTip);
        acc += n;
      });
      svg.append("text").attr("class", "val-l").attr("x", x(acc) + 6).attr("y", y + fila / 2).attr("dy", "0.35em").text(acc);
    });
    document.getElementById("lgInc").innerHTML = Object.entries(cols).map(([e, c]) => `<span><i style="background:${css(c)}"></i>${esc(t("incEstados")[e])}</span>`).join("");
    document.querySelector("#tbInc tbody").innerHTML = lista.length ? lista.map((i) => `<tr><td class="mono">${esc(i.id)}<span class="sub">${esc(i.metrica)} · ${esc(i.corrida)}</span></td>
      <td>${esc(en() && i.descripcion_en ? i.descripcion_en : i.descripcion)}<span class="sub">${esc((en() && i.decision_en) || i.decision || "")}</span></td><td>${esc(t("origenes")[i.origen] || i.origen)}</td>
      <td>${badge(i.estado === "resuelto" ? "Aprobado" : i.estado === "abierto" ? "Rechazado" : "Pendiente").replace(/>[^<>]*<\/span>$/, `>${esc(t("incEstados")[i.estado])}</span>`)}</td></tr>`).join("")
      : `<tr><td colspan="4">${esc(t("sinIncidentes"))}</td></tr>`;
  }

  function evolucion() {
    const W = ancho("chEvo"), H = 220, m = { t: 10, r: 10, b: 30, l: 34 };
    const svg = svgEn("chEvo", W, H, t("qEvoMet"));
    if (!C.corridas.length) return;
    const x = d3.scaleBand(C.corridas.map((c) => c.id), [m.l, W - m.r]).padding(0.35);
    const y = d3.scaleLinear([0, C.metricas.length], [H - m.b, m.t]);
    y.ticks(5).forEach((v) => { svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(v)).attr("y2", y(v)).attr("stroke", css("--grid"));
      svg.append("text").attr("x", m.l - 6).attr("y", y(v)).attr("dy", "0.35em").attr("text-anchor", "end").text(v); });
    C.corridas.forEach((c) => {
      let acc = 0;
      [["aprobadas", "--good", "Aprobado"], ["rechazadas", "--crit", "Rechazado"], ["pendientes", "--vivax", "Pendiente"]].forEach(([k, col, e]) => {
        const n = c[k]; if (!n) return;
        svg.append("rect").attr("x", x(c.id)).attr("y", y(acc + n) + 1).attr("width", x.bandwidth()).attr("height", Math.max(1, y(acc) - y(acc + n) - 2)).attr("rx", 3).attr("fill", css(col))
          .on("mousemove", (ev) => mostrarTip(ev, `${t("qCorrida")} ${c.id}`, [[css(col), t("estados")[e], n]])).on("mouseleave", ocultarTip);
        if (n > 1) svg.append("text").attr("x", x(c.id) + x.bandwidth() / 2).attr("y", (y(acc) + y(acc + n)) / 2).attr("dy", "0.35em").attr("text-anchor", "middle").attr("class", "val-l").style("fill", "#fff").text(n);
        acc += n;
      });
      svg.append("text").attr("x", x(c.id) + x.bandwidth() / 2).attr("y", H - 10).attr("text-anchor", "middle").text(`${t("qCorrida")} ${c.id}`);
    });
    document.querySelector("#tbCorridas tbody").innerHTML = C.corridas.map((c) => `<tr><td>${c.id}</td>
      <td>${c.meta.fecha ? new Intl.DateTimeFormat(VM.loc(), { dateStyle: "short", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(c.meta.fecha)) : "—"}<span class="sub">${esc(c.meta.entorno || "")}</span></td>
      <td class="mono">${esc(c.meta.version || c.meta.commit || "—")}</td><td class="n">${c.pruebas.aprobadas}/${c.pruebas.total}</td></tr>`).join("");
  }

  function proceso() {
    document.getElementById("pasos").innerHTML = t("pasos").map(([a, b]) => `<div class="card"><h3>${esc(a)}</h3><p class="note" style="margin:0">${esc(b)}</p></div>`).join("");
  }
  function galeria() {
    const imgs = C.evidencias || [];
    document.getElementById("galeria").innerHTML = imgs.map((n) => `<figure style="margin:0"><a href="evidencias/${n}.png" target="_blank" rel="noopener"><img src="evidencias/${n}.png" alt="${esc(n)}" loading="lazy" style="width:100%;border:1px solid var(--line);border-radius:8px"></a><figcaption class="count mono">${esc(n)}</figcaption></figure>`).join("");
  }

  function eventos() {
    document.getElementById("segCorrida").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) { idx = Number(b.dataset.i); render(); } });
    document.getElementById("segEstado").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { filtro = b.dataset.e; metricas(); } });
    document.getElementById("bReintentar").addEventListener("click", cargar);
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => C && render(), 160); });
    VM.iniciarTema(() => C && render());
    VM.iniciarIdioma(() => C && render());
  }
  document.addEventListener("DOMContentLoaded", () => { VM.aplicarTextos(); eventos(); cargar(); });
})();
