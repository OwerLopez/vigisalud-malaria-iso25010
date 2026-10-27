// CI-03 Inclusividad: auditoría WCAG 2.2 A/AA con axe-core en cuatro vistas.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { abrir, registro } = require('./utilidades');

const r = registro('ci03-axe');
test.afterAll(() => r.guardar());

const vistas = [
  { id: 'dashboard-es', abrir: (p) => abrir(p, {}) },
  { id: 'dashboard-en', abrir: (p) => abrir(p, { lang: 'en' }) },
  { id: 'dashboard-filtrado', abrir: (p) => abrir(p, { anio: '2014', dep: 'LORETO', esp: 'vivax' }) },
  { id: 'tablero-calidad', abrir: async (p) => { await p.goto('/calidad.html?lang=es'); await p.locator('#tbMetricas tbody tr').first().waitFor(); } },
];

for (const v of vistas) {
  test(`RNF-05 axe-core en ${v.id}`, async ({ page }) => {
    await v.abrir(page);
    await page.locator('details.data').evaluateAll((ds) => ds.forEach((d) => { d.open = true; }));
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const porImpacto = res.violations.reduce((acc, x) => { acc[x.impact] = (acc[x.impact] || 0) + x.nodes.length; return acc; }, {});
    const graves = (porImpacto.critical || 0) + (porImpacto.serious || 0);
    r.agregar({ vista: v.id, reglas_evaluadas: res.passes.length + res.violations.length, violaciones: res.violations.map((x) => ({ id: x.id, impacto: x.impact, nodos: x.nodes.length, ayuda: x.help })), por_impacto: porImpacto, graves, ok: graves === 0 });
    expect(graves).toBe(0);
  });
}
