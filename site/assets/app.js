/* VigiSalud Malaria · dashboard epidemiologico. Todas las cifras se calculan desde data/malaria.json,
   generado por pipeline/procesar.py a partir de los CSV oficiales del MINSA – CDC Peru. */
(function () {
  const { t, fmt, pct, esc, css, mostrarTip, ocultarTip } = VM;
  let D = null, GEO = null, CAL = null;
  const E = { anio: null, dep: "PERU", esp: "todas", q: "", orden: "casos", dir: -1 };
  const ESPECIES = ["todas", "vivax", "falciparum"];
  let avisos = [];

  /* ---------- datos */
  const val = (par, esp = E.esp) => (!par ? 0 : esp === "vivax" ? par[1] : esp === "falciparum" ? par[0] : par[0] + par[1]);
  const anualDe = (dep, anio) => (dep === "PERU" ? D.anual[anio] : (D.dep_anual[dep] || {})[anio]) || [0, 0];
  const semanalDe = (dep, anio) => {
    const s = (D.semanal[dep] || {})[anio];
    if (!s) return null;
    return s.f.map((f, i) => val([f, s.v[i]]));
  };
  const nombreAmbito = (dep) => (dep === "PERU" ? t("depTodos") : titulo(dep));
  const titulo = (s) => s.toLowerCase().replace(/(^|[\s(])([a-záéíóúñ])/g, (m, a, b) => a + b.toUpperCase());

  const cargarD3 = () => (window.d3 ? Promise.resolve() : new Promise((ok, mal) => {
    const sc = Object.assign(document.createElement("script"), { src: "assets/vendor/d3.v7.9.0.min.js", async: true });
    sc.onload = ok;
    sc.onerror = () => mal(new Error("d3"));
    document.head.append(sc);
  }));

  async function cargar() {
    document.getElementById("estadoError").hidden = true;
    document.getElementById("estadoCarga").hidden = false;
    try {
      const pedir = (u) => fetch(u).then((r) => { if (!r.ok) throw new Error(`${u}: ${r.status}`); return r.json(); });
      [D, GEO, CAL] = await Promise.all([pedir("data/malaria.json"), pedir("data/departamentos.geojson"), pedir("data/calidad_datos.json"), cargarD3()]);
      if (!D.anual || !Object.keys(D.anual).length) throw new Error("datos vacíos");
    } catch (err) {
      console.error(err);
      document.getElementById("estadoCarga").hidden = true;
      document.getElementById("estadoError").hidden = false;
      return;
    }
    leerParametros();
    poblarFiltros();
    document.getElementById("estadoCarga").hidden = true;
    document.getElementById("app").hidden = false;
    render();
    VM.seguirSecciones();
  }

  function leerParametros() {
    const p = new URLSearchParams(location.search);
    const anios = Object.keys(D.anual).map(Number);
    const maxA = Math.max(...anios);
    E.anio = maxA;
    if (p.has("anio")) {
      const a = Number(p.get("anio"));
      if (Number.isInteger(a) && anios.includes(a)) E.anio = a; else avisos.push(`anio=${p.get("anio")}`);
    }
    if (p.has("dep")) {
      const d = p.get("dep").toUpperCase();
      if (d === "PERU" || D.departamentos.includes(d)) E.dep = d; else avisos.push(`dep=${p.get("dep")}`);
    }
    if (p.has("esp")) {
      if (ESPECIES.includes(p.get("esp"))) E.esp = p.get("esp"); else avisos.push(`esp=${p.get("esp")}`);
    }
  }

  function sincronizarURL() {
    const u = new URL(location.href);
    u.searchParams.set("anio", E.anio); u.searchParams.set("dep", E.dep); u.searchParams.set("esp", E.esp);
    history.replaceState(null, "", u);
  }

  function poblarFiltros() {
    const sa = document.getElementById("fAnio");
    sa.innerHTML = Object.keys(D.anual).sort((a, b) => b - a).map((a) => `<option value="${a}">${a}</option>`).join("");
    llenarDeps();
  }
  function llenarDeps() {
    const sd = document.getElementById("fDep");
    sd.innerHTML = `<option value="PERU">${esc(t("depTodos"))}</option>` + D.departamentos.map((d) => `<option value="${esc(d)}">${esc(titulo(d))}</option>`).join("");
  }

  /* El aviso de datos provisionales no depende de los datos: se pinta antes de cargarlos (LCP) y
     la fecha de descarga ocupa una línea reservada que se completa después, sin desplazar el diseño. */
  const avisoBase = () => { document.getElementById("avisoBase").innerHTML = t("aviso"); };

  /* ---------- render principal */
  function render() {
    VM.aplicarTextos();
    llenarDeps();
    document.getElementById("fAnio").value = String(E.anio);
    document.getElementById("fDep").value = E.dep;
    document.querySelectorAll("#fEsp button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === E.esp)));
    document.getElementById("q").placeholder = t("buscar");
    document.getElementById("q").setAttribute("aria-label", t("buscar"));
    avisoBase();
    document.getElementById("avisoFecha").textContent = t("avisoFecha")(new Intl.DateTimeFormat(VM.loc(), { dateStyle: "long" }).format(new Date(`${D.meta.fecha_descarga}T12:00:00`)));
    document.getElementById("avisoParam").textContent = avisos.map((a) => ` ${t("avisoParam")(a)}`).join("");
    const esp = E.esp === "todas" ? "" : `, ${E.esp === "vivax" ? "P. vivax" : "P. falciparum"}`;
    document.title = `${t("titulo")} · ${nombreAmbito(E.dep)} ${E.anio}${esp}`;
    leyendas();
    kpis();
    anual();
    canal();
    mapa();
    ranking();
    piramide();
    distritos();
    tarjetasDatos();
    sincronizarURL();
  }

  function leyendas() {
    const lg = (id, items) => { document.getElementById(id).innerHTML = items.map(([c, l]) => `<span><i style="background:${c}"></i>${l}</span>`).join(""); };
    const items = [];
    if (E.esp !== "falciparum") items.push([css("--vivax"), "<em>P. vivax</em>"]);
    if (E.esp !== "vivax") items.push([css("--falci"), "<em>P. falciparum</em>"]);
    lg("lgEspecie", items);
    lg("lgCanal", [[css("--good"), t("zExito")], [css("--warn"), t("zSeg")], [css("--serious"), t("zAlarma")], [css("--crit"), t("zEpid")], [css("--text"), String(E.anio)]]);
    lg("lgSexo", [[css("--fem"), t("mujeres")], [css("--masc"), t("hombres")]]);
  }

  /** Departamento (en Perú) o distrito (en un departamento) con más casos en el año. */
  function principal() {
    if (E.dep === "PERU") {
      const [d, v] = D.departamentos.map((x) => [x, val(anualDe(x, E.anio))]).sort((p, q) => q[1] - p[1])[0] || [];
      return { lab: t("kTop"), nombre: v ? titulo(d) : "—", v: v || 0 };
    }
    const ds = filasDistritos().sort((p, q) => q.casos - p.casos);
    return { lab: t("kTopDist"), nombre: ds[0] ? titulo(ds[0].dist) : "—", v: ds[0] ? ds[0].casos : 0 };
  }

  /** Semana epidemiológica pico, sus casos y cuántas semanas tuvieron casos. */
  function pico() {
    const sem = semanalDe(E.dep, E.anio) || [];
    const max = Math.max(0, ...sem);
    return { se: max > 0 ? sem.indexOf(max) + 1 : null, max, semanas: sem.filter((x) => x > 0).length };
  }

  const conSigno = (x) => `${x > 0 ? "+" : ""}${pct(x)}`;

  function tarjetasKpi(actual, previo, var_) {
    const par = anualDe(E.dep, E.anio);
    const total = par[0] + par[1];
    const top = principal();
    const pk = pico();
    return [
      { id: "kpi-casos", lab: t("kCasos"), val: fmt(actual), foot: `${nombreAmbito(E.dep)} · ${E.anio}` },
      { id: "kpi-var", lab: t("kVar"), val: var_ === null ? "—" : conSigno(var_),
        foot: previo === null ? t("kSinAnt") : `${t("kVs")(E.anio - 1)}: ${fmt(previo)}` },
      { id: "kpi-pf", lab: t("kPf"), val: total ? pct(par[0] / total) : "—", foot: `${fmt(par[0])} / ${fmt(total)}` },
      { id: "kpi-top", lab: top.lab, val: top.nombre, sm: true, foot: actual ? `${fmt(top.v)} · ${pct(top.v / actual)} ${t("kDelTotal")}` : "—" },
      { id: "kpi-pico", lab: t("kPico"), val: pk.se ? `${t("kSE")} ${pk.se}` : "—", foot: pk.se ? `${fmt(pk.max)} ${t("casos")} · ${pk.semanas} ${t("kSemanas")}` : "—" },
    ];
  }

  function fraseTendencia(actual, previo, var_) {
    if (!previo) return "";
    if (actual > previo) return t("ledeSube")(pct(var_));
    return actual < previo ? t("ledeBaja")(pct(-var_)) : t("ledeIgual");
  }

  const nombreEspecie = () => ({ vivax: t("espV"), falciparum: t("espF") })[E.esp] || "";

  function kpis() {
    const actual = val(anualDe(E.dep, E.anio));
    const previo = D.anual[E.anio - 1] ? val(anualDe(E.dep, E.anio - 1)) : null;
    const var_ = previo ? (actual - previo) / previo : null;
    document.getElementById("kpis").innerHTML = tarjetasKpi(actual, previo, var_).map((k) => `<div class="card kpi" data-testid="${k.id}">
      <div class="lab">${esc(k.lab)}</div><div class="val num${k.sm ? " sm" : ""}">${esc(k.val)}</div><div class="foot">${esc(k.foot)}</div></div>`).join("");
    document.getElementById("lede").textContent = t("lede")({
      anio: E.anio, ambito: E.dep === "PERU" ? t("ambitoPeru") : titulo(E.dep), casos: fmt(actual),
      esp: nombreEspecie(), frase: fraseTendencia(actual, previo, var_),
    });
  }

  /* ---------- graficos */
  const ancho = (id) => Math.max(300, document.getElementById(id).clientWidth);
  function svgEn(id, w, h, etiqueta) {
    const box = document.getElementById(id);
    box.innerHTML = "";
    box.setAttribute("aria-label", etiqueta);
    return d3.select(box).append("svg").attr("viewBox", `0 0 ${w} ${h}`).attr("aria-hidden", "true");
  }
  const tabla = (id, cab, filas) => {
    document.getElementById(id).innerHTML = `<table><thead><tr>${cab.map((c, i) => `<th scope="col"${i ? ' class="n"' : ""}>${esc(c)}</th>`).join("")}</tr></thead><tbody>${
      filas.map((f) => `<tr>${f.map((c, i) => `<td${i ? ' class="n"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  };

  function anual() {
    const W = ancho("chAnual"), H = Math.round(Math.min(330, Math.max(240, W * 0.36))), m = { t: 26, r: 8, b: 26, l: 52 };
    const anios = Object.keys(D.anual).map(Number).sort((a, b) => a - b);
    const filas = anios.map((a) => { const p = anualDe(E.dep, a); return { a, f: E.esp === "vivax" ? 0 : p[0], v: E.esp === "falciparum" ? 0 : p[1] }; });
    const svg = svgEn("chAnual", W, H, `${t("tendT")}: ${nombreAmbito(E.dep)}`);
    const x = d3.scaleBand(anios, [m.l, W - m.r]).padding(0.22);
    const y = d3.scaleLinear([0, d3.max(filas, (r) => r.f + r.v) || 1], [H - m.b, m.t]).nice();
    y.ticks(5).forEach((v) => {
      svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(v)).attr("y2", y(v)).attr("stroke", css("--grid"));
      svg.append("text").attr("x", m.l - 8).attr("y", y(v)).attr("dy", "0.35em").attr("text-anchor", "end").text(fmt(v));
    });
    anios.filter((a) => a % 5 === 0 || a === anios[anios.length - 1]).forEach((a) =>
      svg.append("text").attr("x", x(a) + x.bandwidth() / 2).attr("y", H - 8).attr("text-anchor", "middle").text(a));
    const x09 = x(2009) - (x.step() * x.paddingInner()) / 2;
    svg.append("line").attr("x1", x09).attr("x2", x09).attr("y1", m.t - 14).attr("y2", H - m.b).attr("stroke", css("--text-3")).attr("stroke-dasharray", "3 3");
    svg.append("text").attr("x", x09 + 5).attr("y", m.t - 6).text(t("cambioFuente")).style("font-size", "11px");
    filas.forEach((r) => {
      const sel = r.a === E.anio, op = sel ? 1 : 0.42;
      const partes = [["f", "--falci", r.f, 0], ["v", "--vivax", r.v, r.f]];
      partes.forEach(([k, col, v, base], i) => {
        if (!v) return;
        const y0 = y(base), y1 = y(base + v), arriba = (k === "v" || !r.v);
        const g = svg.append("path").attr("fill", css(col)).attr("opacity", op)
          .attr("d", barra(x(r.a), y1, x.bandwidth(), Math.max(1, y0 - y1 - (i === 1 && r.f ? 1 : 0)), arriba ? 3 : 0));
        g.append("title").text(`${r.a} · ${k === "v" ? "P. vivax" : "P. falciparum"}: ${fmt(v)}`);
      });
      svg.append("rect").attr("x", x(r.a)).attr("y", m.t).attr("width", x.bandwidth()).attr("height", H - m.t - m.b).attr("fill", "transparent")
        .style("cursor", "pointer")
        .on("mousemove", (e) => mostrarTip(e, String(r.a), [[css("--vivax"), "P. vivax", fmt(r.v)], [css("--falci"), "P. falciparum", fmt(r.f)], [null, t("thTotal"), fmt(r.f + r.v)]]))
        .on("mouseleave", ocultarTip).on("click", () => { E.anio = r.a; render(); });
      if (sel) svg.append("text").attr("class", "val-l").attr("x", x(r.a) + x.bandwidth() / 2).attr("y", y(r.f + r.v) - 6).attr("text-anchor", "middle").text(fmt(r.f + r.v));
    });
    tabla("tbAnual", [t("thAnio"), t("thVivax"), t("thFalci"), t("thTotal")], filas.map((r) => [r.a, fmt(r.v), fmt(r.f), fmt(r.f + r.v)]));
  }
  function barra(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  function canal() {
    const W = ancho("chCanal"), H = Math.round(Math.min(360, Math.max(260, W * 0.38))), m = { t: 14, r: 82, b: 34, l: 48 };
    const actual = semanalDe(E.dep, E.anio);
    const base = d3.range(E.anio - 5, E.anio).filter((a) => semanalDe(E.dep, a));
    const ok = base.length >= 3;
    document.getElementById("canalN").textContent = t("canalN")({ ok, anio: E.anio, base: ok ? `${base[0]}–${base[base.length - 1]}` : "" });
    const svg = svgEn("chCanal", W, H, `${t("canalT")} ${E.anio}`);
    const nSem = actual && actual[52] > 0 ? 53 : 52;
    const semanas = d3.range(1, nSem + 1);
    const serie = semanas.map((w) => (actual ? actual[w - 1] : 0));
    const cuart = semanas.map((w) => {
      if (!ok) return null;
      const vals = base.map((a) => semanalDe(E.dep, a)[w - 1]).sort(d3.ascending);
      return { q1: d3.quantileSorted(vals, 0.25), me: d3.quantileSorted(vals, 0.5), q3: d3.quantileSorted(vals, 0.75) };
    });
    const ymax = d3.max([...serie, ...(ok ? cuart.map((c) => c.q3) : [])]) || 1;
    const x = d3.scaleLinear([1, nSem], [m.l, W - m.r]);
    const y = d3.scaleLinear([0, ymax * 1.12], [H - m.b, m.t]).nice();
    y.ticks(5).forEach((v) => {
      svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(v)).attr("y2", y(v)).attr("stroke", css("--grid"));
      svg.append("text").attr("x", m.l - 8).attr("y", y(v)).attr("dy", "0.35em").attr("text-anchor", "end").text(fmt(v));
    });
    [1, 10, 20, 30, 40, 50].forEach((w) => svg.append("text").attr("x", x(w)).attr("y", H - m.b + 18).attr("text-anchor", "middle").text(w));
    svg.append("text").attr("x", W - m.r).attr("y", H - 2).attr("text-anchor", "end").text(t("semanaEpi"));
    if (ok) {
      const top = y.domain()[1];
      const bandas = [["--good", () => 0, (c) => c.q1, t("zExito")], ["--warn", (c) => c.q1, (c) => c.me, t("zSeg")],
        ["--serious", (c) => c.me, (c) => c.q3, t("zAlarma")], ["--crit", (c) => c.q3, () => top, t("zEpid")]];
      const etiquetas = bandas.map(([col, lo, hi, lab]) => {
        const area = d3.area((_, i) => x(semanas[i]), (c) => y(lo(c)), (c) => y(hi(c)));
        svg.append("path").attr("d", area(cuart)).attr("fill", css(col)).attr("opacity", 0.2);
        const ult = cuart[cuart.length - 1];
        return { lab, y: (y(lo(ult)) + y(Math.min(hi(ult), top))) / 2 };
      });
      // Las bandas pueden ser muy delgadas al final del año: se separan las etiquetas para que no se superpongan.
      const SEP = 14;
      etiquetas.sort((p, q) => q.y - p.y);
      etiquetas.forEach((e, i) => { if (i && etiquetas[i - 1].y - e.y < SEP) e.y = etiquetas[i - 1].y - SEP; });
      const exceso = (H - m.b) - etiquetas[0].y;
      if (exceso < 0) etiquetas.forEach((e) => { e.y += exceso; });
      etiquetas.forEach((e) => svg.append("text").attr("class", "zone-l").attr("x", W - m.r + 6).attr("y", e.y).attr("dy", "0.35em").text(e.lab));
    }
    const linea = d3.line((v, i) => x(semanas[i]), (v) => y(v));
    svg.append("path").attr("d", linea(serie)).attr("fill", "none").attr("stroke", css("--text")).attr("stroke-width", 2).attr("stroke-linejoin", "round").attr("stroke-linecap", "round");
    const cruz = svg.append("line").attr("y1", m.t).attr("y2", H - m.b).attr("stroke", css("--text-3")).attr("stroke-dasharray", "3 3").style("opacity", 0);
    const punto = svg.append("circle").attr("r", 4.5).attr("fill", css("--text")).attr("stroke", css("--surface")).attr("stroke-width", 2).style("opacity", 0);
    svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b).attr("fill", "transparent")
      .on("mousemove", (e) => {
        const [px] = d3.pointer(e);
        const w = Math.max(1, Math.min(nSem, Math.round(x.invert(px))));
        const v = serie[w - 1], c = cuart[w - 1];
        cruz.attr("x1", x(w)).attr("x2", x(w)).style("opacity", 1);
        punto.attr("cx", x(w)).attr("cy", y(v)).style("opacity", 1);
        const filas = [[css("--text"), String(E.anio), fmt(v)]];
        if (c) filas.push([null, t("q1"), fmt(c.q1, 1)], [null, t("mediana"), fmt(c.me, 1)], [null, t("q3"), fmt(c.q3, 1)],
          [null, "→", v <= c.q1 ? t("zExito") : v <= c.me ? t("zSeg") : v <= c.q3 ? t("zAlarma") : t("zEpid")]);
        mostrarTip(e, `${t("kSE")} ${w}`, filas);
      })
      .on("mouseleave", () => { cruz.style("opacity", 0); punto.style("opacity", 0); ocultarTip(); });
    tabla("tbCanal", [t("thSemana"), String(E.anio), t("q1"), t("mediana"), t("q3")],
      semanas.map((w, i) => [w, fmt(serie[i]), cuart[i] ? fmt(cuart[i].q1, 1) : "—", cuart[i] ? fmt(cuart[i].me, 1) : "—", cuart[i] ? fmt(cuart[i].q3, 1) : "—"]));
  }

  const CORTES = [1, 10, 100, 1000, 10000];
  const claseDe = (v) => (v <= 0 ? 0 : d3.bisectRight(CORTES, v));
  function mapa() {
    const W = ancho("chMapa"), H = Math.round(W * 1.18);
    document.getElementById("terrN").textContent = t("terrN")(E.anio);
    const svg = svgEn("chMapa", W, H, `${t("mapaT")} ${E.anio}`);
    const proj = d3.geoMercator().fitSize([W, H], GEO);
    const path = d3.geoPath(proj);
    GEO.features.forEach((f) => {
      const dep = f.properties.NOMBDEP, v = val(anualDe(dep, E.anio));
      const sel = E.dep === dep;
      svg.append("path").attr("d", path(f)).attr("fill", css(`--seq-${claseDe(v)}`))
        .attr("stroke", sel ? css("--text") : css("--surface")).attr("stroke-width", sel ? 2.2 : 0.8)
        .style("cursor", "pointer").attr("data-dep", dep)
        .on("mousemove", (e) => mostrarTip(e, titulo(dep), [[null, t("thCasos"), v ? fmt(v) : t("sinCasos")]]))
        .on("mouseleave", ocultarTip)
        .on("click", () => { E.dep = sel ? "PERU" : dep; render(); });
    });
    const etiquetas = [t("sinCasos"), "1–9", "10–99", "100–999", "1 000–9 999", "≥ 10 000"];
    document.getElementById("lgMapa").innerHTML = etiquetas.map((l, i) => `<span><i style="background:${css(`--seq-${i}`)}"></i>${l}</span>`).join("");
  }

  function ranking() {
    const filas = D.departamentos.map((d) => ({ d, v: val(anualDe(d, E.anio)) })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v);
    const W = ancho("chRank"), fila = 24, H = Math.max(60, filas.length * fila + 4);
    const svg = svgEn("chRank", W, H, `${t("rankT")} ${E.anio}`);
    if (!filas.length) { svg.append("text").attr("class", "empty").attr("x", 0).attr("y", 30).text(t("sinCasos")); return; }
    const L = Math.min(150, W * 0.36), x = d3.scaleLinear([0, filas[0].v], [L, W - 64]);
    const total = d3.sum(filas, (r) => r.v);
    filas.forEach((r, i) => {
      const y = i * fila, sel = E.dep === r.d;
      svg.append("text").attr("x", L - 8).attr("y", y + fila / 2).attr("dy", "0.35em").attr("text-anchor", "end")
        .style("font-weight", sel ? 700 : 400).text(titulo(r.d));
      svg.append("path").attr("d", barraH(x(0), y + 5, Math.max(2, x(r.v) - x(0)), fila - 10)).attr("fill", css(sel ? "--brand" : "--vivax"));
      svg.append("text").attr("class", "val-l").attr("x", x(r.v) + 6).attr("y", y + fila / 2).attr("dy", "0.35em").text(fmt(r.v));
      svg.append("rect").attr("x", 0).attr("y", y).attr("width", W).attr("height", fila).attr("fill", "transparent").style("cursor", "pointer")
        .on("mousemove", (e) => mostrarTip(e, titulo(r.d), [[null, t("thCasos"), fmt(r.v)], [null, t("thShare"), pct(r.v / total)]]))
        .on("mouseleave", ocultarTip).on("click", () => { E.dep = sel ? "PERU" : r.d; render(); });
    });
  }
  function barraH(x, y, w, h) { const r = Math.min(3, h / 2, w); return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`; }

  function piramide() {
    const W = ancho("chPiramide");
    const datos = (D.edad_sexo[E.dep] || {})[E.anio];
    document.getElementById("pobN").textContent = t("pobN")(`${nombreAmbito(E.dep)} · ${E.anio}`);
    if (E.anio < D.meta.anio_nominal_desde || !datos) {
      const svg = svgEn("chPiramide", W, 70, t("pobNoDisp"));
      svg.append("text").attr("class", "empty").attr("x", W / 2).attr("y", 38).attr("text-anchor", "middle").text(E.anio < D.meta.anio_nominal_desde ? t("pobNoDisp") : t("sinCasos"));
      document.getElementById("tbPiramide").innerHTML = "";
      return;
    }
    const grupos = D.meta.grupos_edad.slice().reverse();
    const filas = grupos.map((g) => {
      const c = datos[g] || [0, 0, 0, 0];
      const F = E.esp === "vivax" ? c[2] : E.esp === "falciparum" ? c[0] : c[0] + c[2];
      const M = E.esp === "vivax" ? c[3] : E.esp === "falciparum" ? c[1] : c[1] + c[3];
      return { g, F, M };
    });
    const fila = 34, H = filas.length * fila + 30, mid = W / 2, gap = 34;
    const svg = svgEn("chPiramide", W, H, `${t("pobT")} ${E.anio}`);
    const max = d3.max(filas, (r) => Math.max(r.F, r.M)) || 1;
    const x = d3.scaleLinear([0, max], [0, mid - gap - 60]);
    svg.append("text").attr("x", mid - gap).attr("y", 12).attr("text-anchor", "end").attr("class", "val-l").text(t("mujeres"));
    svg.append("text").attr("x", mid + gap).attr("y", 12).attr("class", "val-l").text(t("hombres"));
    filas.forEach((r, i) => {
      const y = 22 + i * fila;
      svg.append("text").attr("x", mid).attr("y", y + fila / 2).attr("dy", "0.35em").attr("text-anchor", "middle").text(r.g);
      svg.append("rect").attr("x", mid - gap - x(r.F)).attr("y", y + 6).attr("width", x(r.F)).attr("height", fila - 12).attr("rx", 3).attr("fill", css("--fem"));
      svg.append("rect").attr("x", mid + gap).attr("y", y + 6).attr("width", x(r.M)).attr("height", fila - 12).attr("rx", 3).attr("fill", css("--masc"));
      svg.append("text").attr("class", "val-l").attr("x", mid - gap - x(r.F) - 6).attr("y", y + fila / 2).attr("dy", "0.35em").attr("text-anchor", "end").text(fmt(r.F));
      svg.append("text").attr("class", "val-l").attr("x", mid + gap + x(r.M) + 6).attr("y", y + fila / 2).attr("dy", "0.35em").text(fmt(r.M));
    });
    tabla("tbPiramide", [t("thGrupo"), t("mujeres"), t("hombres"), t("thTotal")], filas.slice().reverse().map((r) => [r.g, fmt(r.F), fmt(r.M), fmt(r.F + r.M)]));
  }

  /* ---------- tabla de distritos */
  function filasDistritos() {
    const anio = String(E.anio);
    return D.distritos.filter((d) => (E.dep === "PERU" || d.d === E.dep) && d.a[anio])
      .map((d) => { const p = d.a[anio]; return { ubigeo: d.u, dep: d.d, prov: d.p, dist: d.n, casos: val(p), f: p[0], v: p[1], pf: p[0] + p[1] ? p[0] / (p[0] + p[1]) : 0 }; })
      .filter((r) => r.casos > 0);
  }
  let filasActuales = [];
  function distritos() {
    document.getElementById("distN").textContent = t("distN")(`${nombreAmbito(E.dep)} · ${E.anio}`);
    const todas = filasDistritos();
    const total = d3.sum(todas, (r) => r.casos);
    todas.forEach((r) => { r.share = total ? r.casos / total : 0; });
    const q = E.q.trim().toLowerCase();
    filasActuales = todas.filter((r) => !q || `${r.dist} ${r.prov} ${r.dep} ${r.ubigeo}`.toLowerCase().includes(q))
      .sort((a, b) => { const k = E.orden; const av = a[k], bv = b[k]; return (av > bv ? 1 : av < bv ? -1 : 0) * E.dir; });
    const max = d3.max(todas, (r) => r.casos) || 1;
    document.querySelector("#tbDist tbody").innerHTML = filasActuales.slice(0, 200).map((r, i) => `<tr>
      <td class="num">${i + 1}</td><td>${esc(titulo(r.dist))}<span class="sub mono">${esc(r.ubigeo)}</span></td>
      <td class="hide-sm">${esc(titulo(r.prov))}</td><td class="hide-sm">${esc(titulo(r.dep))}</td>
      <td class="n"><span class="bar-in" style="width:${Math.max(2, (r.casos / max) * 60)}px"></span>${fmt(r.casos)}</td>
      <td class="n hide-sm">${pct(r.pf)}</td><td class="n hide-sm">${pct(r.share)}</td></tr>`).join("");
    document.getElementById("distCount").textContent = t("mostrando")(Math.min(filasActuales.length, 200), todas.length);
    document.querySelectorAll("#tbDist th button").forEach((b) => b.closest("th").setAttribute("aria-sort", b.dataset.k === E.orden ? (E.dir > 0 ? "ascending" : "descending") : "none"));
  }

  function exportar(formato) {
    const meta = { fuente: D.meta.fuente, url: D.meta.url, licencia: D.meta.licencia, fecha_descarga: D.meta.fecha_descarga,
      anio: E.anio, departamento: E.dep, especie: E.esp };
    const nombre = `malaria_distritos_${E.dep.toLowerCase().replace(/\s+/g, "-")}_${E.anio}_${E.esp}`;
    if (formato === "json") {
      VM.descargar(`${nombre}.json`, JSON.stringify({ meta, distritos: filasActuales }, null, 1), "application/json");
      return;
    }
    const cab = ["ubigeo", "departamento", "provincia", "distrito", "casos", "p_falciparum", "p_vivax", "proporcion_falciparum"];
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const lineas = [cab.join(","), ...filasActuales.map((r) => [q(r.ubigeo), q(r.dep), q(r.prov), q(r.dist), r.casos, r.f, r.v, r.pf.toFixed(4)].join(","))];
    VM.descargar(`${nombre}.csv`, "﻿" + lineas.join("\r\n"), "text/csv;charset=utf-8");
  }

  function tarjetasDatos() {
    const archivos = CAL.archivos;
    const h = (s) => `${s.slice(0, 12)}…${s.slice(-6)}`;
    const recup = Object.entries(CAL.departamento_recuperado_por_ubigeo || {}).map(([u, n]) => `${u}: ${fmt(n)}`).join(" · ") || "—";
    const enie = (CAL.nombres_con_enie_restituida || {}).nombres || [];
    const tarj = [
      [t("dFuente"), `<dl class="kv"><dt>MINSA</dt><dd>${esc(D.meta.fuente)}</dd><dt>URL</dt><dd><a href="${esc(D.meta.url)}" target="_blank" rel="noopener">datosabiertos.gob.pe</a></dd>
        <dt>${t("dLicencia")}</dt><dd>${esc(D.meta.licencia)}</dd><dt>${t("dDescarga")}</dt><dd>${esc(D.meta.fecha_descarga)}</dd>
        <dt>${t("dUltimaSemana")}</dt><dd>${D.meta.anios[1]} · ${t("kSE")} ${D.meta.ultima_semana}</dd></dl>`],
      [t("dArchivos"), archivos.map((a) => `<dl class="kv"><dt>${esc(a.periodo)}</dt><dd class="mono">${esc(a.archivo)}</dd>
        <dt>${t("dFilas")}</dt><dd class="num">${fmt(a.filas)} · ${fmt(a.casos)} ${t("dCasos")}</dd><dt>${t("dHash")}</dt><dd class="mono" title="${a.sha256}">${h(a.sha256)}</dd></dl>`).join("<hr style='border:0;border-top:1px solid var(--line)'>")],
      [t("dValid"), `<dl class="kv apilado">${archivos.map((a) => `<dt>${esc(a.periodo)}</dt><dd>${fmt(a.filas_invalidas)} ${t("dInvalidas")}${a.motivos_invalidez && Object.keys(a.motivos_invalidez).length ? ` (${Object.entries(a.motivos_invalidez).map(([k, v]) => `${(t("motivos")[k] || k.replace(/_/g, " "))}: ${v}`).join(", ")})` : ""}</dd>`).join("")}
        <dt>${t("dRecup")}</dt><dd class="mono">${esc(recup)}</dd>
        <dt>${t("dEnie")}</dt><dd>${esc(t("dEnieTxt")(enie))}</dd></dl>`],
      [t("dMetodo"), `<p style="margin:0;font-size:13.5px;color:var(--text-2)">${esc(t("dMetodoTxt"))}</p>`],
    ];
    document.getElementById("datosCards").innerHTML = tarj.map(([h3, body]) => `<div class="card"><h3>${esc(h3)}</h3>${body}</div>`).join("");
  }

  /* ---------- eventos */
  function eventos() {
    document.getElementById("fAnio").addEventListener("change", (e) => { E.anio = Number(e.target.value); render(); });
    document.getElementById("fDep").addEventListener("change", (e) => { E.dep = e.target.value; render(); });
    document.getElementById("fEsp").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { E.esp = b.dataset.v; render(); } });
    document.getElementById("bReset").addEventListener("click", () => {
      E.anio = Math.max(...Object.keys(D.anual).map(Number)); E.dep = "PERU"; E.esp = "todas"; E.q = ""; avisos = [];
      document.getElementById("q").value = ""; render();
    });
    document.getElementById("q").addEventListener("input", (e) => { E.q = e.target.value; distritos(); });
    document.querySelectorAll("#tbDist th button").forEach((b) => b.addEventListener("click", () => {
      E.dir = E.orden === b.dataset.k ? -E.dir : (b.dataset.k === "casos" || b.dataset.k === "pf" || b.dataset.k === "share" ? -1 : 1);
      E.orden = b.dataset.k; distritos();
    }));
    document.getElementById("bCsv").addEventListener("click", () => exportar("csv"));
    document.getElementById("bJson").addEventListener("click", () => exportar("json"));
    document.getElementById("bReintentar").addEventListener("click", cargar);
    let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => D && render(), 160); });
    VM.iniciarTema(() => D && render());
    VM.iniciarIdioma(() => D && render());
  }

  // Los datos (~110 KB) y D3 (~93 KB), comprimidos, solo hacen falta para los gráficos: se piden después del
  // primer pintado con contenido, para que el marco estático y el aviso no compitan por el ancho de banda (LCP móvil).
  function trasPrimerPintado(fn) {
    let hecho = false;
    const ir = () => { if (!hecho) { hecho = true; fn(); } };
    try {
      new PerformanceObserver((lista, obs) => {
        if (lista.getEntriesByName("first-contentful-paint").length) { obs.disconnect(); ir(); }
      }).observe({ type: "paint", buffered: true });
    } catch { /* navegador sin PerformanceObserver de pintado */ }
    setTimeout(ir, 500);
  }
  document.addEventListener("DOMContentLoaded", () => {
    VM.aplicarTextos(); avisoBase(); eventos();
    trasPrimerPintado(cargar);
  });
})();
