/* Utilidades compartidas por el dashboard y el tablero de calidad: idioma, tema, formato y tooltip. */
(function () {
  const almacen = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* almacenamiento no disponible */ } },
  };
  const qp = new URLSearchParams(location.search).get("lang");
  const idioma = { actual: qp === "en" || qp === "es" ? qp : (almacen.get("vm-lang") || "es") };
  const t = (k) => window.I18N[idioma.actual][k];
  const loc = () => (idioma.actual === "es" ? "es-PE" : "en-US");
  const fmt = (v, d = 0) => (v === null || v === undefined || Number.isNaN(v) ? "—"
    : new Intl.NumberFormat(loc(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(v));
  const pct = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${fmt(v * 100, d)} %`);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function aplicarTextos() {
    document.documentElement.lang = idioma.actual;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = t(el.dataset.i18n);
      if (typeof v === "string") el.textContent = v;
    });
    document.querySelectorAll("#langSeg button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === idioma.actual)));
    const tb = document.getElementById("themeBtn");
    if (tb) tb.setAttribute("aria-label", t("temaCambiar"));
    regionesDesplazables();
  }

  // WCAG 2.1.1: los contenedores de tabla con desplazamiento deben poder enfocarse con el teclado.
  function regionesDesplazables() {
    document.querySelectorAll(".tablewrap").forEach((el) => {
      const titulo = el.closest("details")?.querySelector("summary") || el.closest(".card")?.querySelector("h3, h2");
      el.tabIndex = 0;
      el.setAttribute("role", "region");
      el.setAttribute("aria-label", titulo ? titulo.textContent.trim() : t("tabla"));
    });
  }

  const tip = () => document.getElementById("tip");
  function mostrarTip(ev, titulo, filas) {
    const el = tip();
    el.innerHTML = `<div class="t">${esc(titulo)}</div>` + filas.map(([sw, k, v]) =>
      `<div class="r"><span>${sw ? `<span class="sw" style="background:${sw}"></span>` : ""}${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
    el.classList.add("on");
    const w = el.offsetWidth, h = el.offsetHeight, pad = 14;
    let x = ev.pageX + pad, y = ev.pageY - h - pad;
    if (x + w > window.scrollX + document.documentElement.clientWidth - 8) x = ev.pageX - w - pad;
    if (y < window.scrollY + 8) y = ev.pageY + pad;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
  }
  const ocultarTip = () => tip().classList.remove("on");

  function iniciarTema(alCambiar) {
    const guardado = almacen.get("vm-theme");
    if (guardado) document.documentElement.dataset.theme = guardado;
    const btn = document.getElementById("themeBtn");
    if (btn) btn.addEventListener("click", () => {
      const act = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.dataset.theme = act === "dark" ? "light" : "dark";
      almacen.set("vm-theme", document.documentElement.dataset.theme);
      alCambiar();
    });
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", alCambiar);
  }

  function iniciarIdioma(alCambiar) {
    const seg = document.getElementById("langSeg");
    if (seg) seg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      idioma.actual = b.dataset.l;
      almacen.set("vm-lang", idioma.actual);
      const u = new URL(location.href);
      u.searchParams.set("lang", idioma.actual);
      history.replaceState(null, "", u);
      aplicarTextos();
      alCambiar();
    });
  }

  function descargar(nombre, contenido, tipo) {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = Object.assign(document.createElement("a"), { href: url, download: nombre });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function seguirSecciones() {
    const enlaces = [...document.querySelectorAll("#nav a[href^='#']")];
    const obs = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) enlaces.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === `#${en.target.id}`));
    }), { rootMargin: "-35% 0px -60% 0px" });
    document.querySelectorAll("main section[id]").forEach((s) => obs.observe(s));
  }

  window.VM = { almacen, idioma, t, loc, fmt, pct, esc, css, aplicarTextos, mostrarTip, ocultarTip, iniciarTema, iniciarIdioma, descargar, seguirSecciones };
})();
