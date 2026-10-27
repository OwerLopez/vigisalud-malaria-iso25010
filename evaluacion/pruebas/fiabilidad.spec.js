// FI-03 Tolerancia a fallos, FI-04 Recuperabilidad y SO-02 A prueba de fallos: se inyectan fallos de red y de datos.
const { test, expect } = require('@playwright/test');
const { registro, captura } = require('./utilidades');

const r = registro('fiabilidad');
test.afterAll(() => r.guardar());

const escenarios = [
  { id: 'datos-404', patron: '**/data/malaria.json', accion: (route) => route.fulfill({ status: 404, body: 'Not found' }) },
  { id: 'red-caida', patron: '**/data/malaria.json', accion: (route) => route.abort('internetdisconnected') },
  { id: 'json-corrupto', patron: '**/data/malaria.json', accion: (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"anual": {' }) },
  { id: 'mapa-500', patron: '**/data/departamentos.geojson', accion: (route) => route.fulfill({ status: 500, body: 'error' }) },
];

for (const e of escenarios) {
  test(`RNF-07 RNF-14 fallo inyectado: ${e.id}`, async ({ page }) => {
    const errNoControlados = [];
    page.on('pageerror', (err) => errNoControlados.push(err.message));
    await page.route(e.patron, e.accion);
    await page.goto('/?lang=es');
    const alerta = page.locator('#estadoError');
    await expect(alerta).toBeVisible();
    const controlado = (await alerta.getAttribute('role')) === 'alert' && errNoControlados.length === 0;
    const cifrasVisibles = await page.locator('.kpi:visible, #chAnual svg:visible').count();
    const evidencia = await captura(page, `fi03-${e.id}`);
    await page.unroute(e.patron);
    await page.click('#bReintentar');
    let recuperado = true;
    try { await expect(page.locator('[data-testid="kpi-casos"]')).toBeVisible({ timeout: 15000 }); } catch { recuperado = false; }
    r.agregar({ escenario: e.id, mensaje_controlado: controlado, cifras_visibles_durante_fallo: cifrasVisibles, recuperado, evidencia, errores_no_controlados: errNoControlados });
    expect(controlado).toBe(true);
    expect(cifrasVisibles).toBe(0);
    expect(recuperado).toBe(true);
  });
}
