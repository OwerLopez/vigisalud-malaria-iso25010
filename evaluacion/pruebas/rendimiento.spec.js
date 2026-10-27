// ED-02 Tiempo de respuesta a filtros: 20 cambios de filtro medidos hasta el siguiente cuadro pintado.
const { test, expect } = require('@playwright/test');
const { abrir, registro } = require('./utilidades');

const r = registro('ed02-respuesta');
test.afterAll(() => r.guardar());

test('RNF-03 respuesta a filtros', async ({ page }) => {
  await abrir(page);
  const tiempos = await page.evaluate(async () => {
    const cambios = [['fAnio', '2014'], ['fDep', 'LORETO'], ['fAnio', '2020'], ['fDep', 'PERU'], ['fAnio', '2005'],
      ['fDep', 'TUMBES'], ['fAnio', '2025'], ['fDep', 'JUNIN'], ['fAnio', '2010'], ['fDep', 'PERU']];
    const medir = (fn) => new Promise((ok) => {
      const t0 = performance.now();
      fn();
      requestAnimationFrame(() => requestAnimationFrame(() => ok(performance.now() - t0)));
    });
    const out = [];
    for (let i = 0; i < 2; i++) {
      for (const [id, v] of cambios) {
        out.push(await medir(() => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change')); }));
      }
    }
    return out;
  });
  const orden = [...tiempos].sort((a, b) => a - b);
  const mediana = (orden[9] + orden[10]) / 2;
  r.agregar({ muestras: tiempos.map((x) => Math.round(x * 10) / 10), mediana_ms: Math.round(mediana * 10) / 10, p90_ms: Math.round(orden[17] * 10) / 10 });
  expect(tiempos.length).toBe(20);
});
