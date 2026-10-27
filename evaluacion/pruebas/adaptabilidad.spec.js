// FL-01 Adaptabilidad y FI-01 Ausencia de fallos: recorrido completo en 3 navegadores × 3 tamaños de pantalla.
const { test, expect } = require('@playwright/test');
const { abrir, registro, captura } = require('./utilidades');

const pantallas = [{ n: 'movil', w: 375, h: 812 }, { n: 'tablet', w: 768, h: 1024 }, { n: 'escritorio', w: 1440, h: 900 }];
let r;
test.beforeAll(({}, info) => { r = registro('adaptabilidad', info.project.name); });

for (const p of pantallas) {
  test(`RNF-07 RNF-13 recorrido completo en ${p.n} (${p.w}px)`, async ({ page }, info) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    await page.setViewportSize({ width: p.w, height: p.h });
    await abrir(page, { anio: '2024' });
    await page.selectOption('#fDep', 'LORETO');
    await page.locator('#fEsp button[data-v="falciparum"]').click();
    await page.selectOption('#fAnio', '2015');
    await page.locator('#langSeg button[data-l="en"]').click();
    await page.locator('#themeBtn').click();
    for (const s of ['tendencia', 'canal', 'territorio', 'poblacion', 'distritos', 'datos']) await page.locator(`#${s}`).scrollIntoViewIfNeeded();
    const medidas = await page.evaluate(() => ({
      desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      graficos: document.querySelectorAll('.chart svg').length,
    }));
    const evidencia = p.n === 'movil' || info.project.name === 'chromium' ? await captura(page, `fl01-${info.project.name}-${p.n}`) : null;
    const ok = medidas.desborde <= 1 && medidas.graficos >= 5;
    r.agregar({ navegador: info.project.name, pantalla: p.n, ancho: p.w, ...medidas, errores, ok, sin_errores: errores.length === 0, evidencia });
    expect(medidas.desborde).toBeLessThanOrEqual(1);
    expect(medidas.graficos).toBeGreaterThanOrEqual(5);
    expect(errores).toEqual([]);
  });
}
