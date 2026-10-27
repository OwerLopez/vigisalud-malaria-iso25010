// Capacidad de interacción (CI-01, CI-02, CI-04), seguridad operacional (SO-01, SO-03) y pertinencia (IF-03).
const { test, expect } = require('@playwright/test');
const { abrir, registro, captura } = require('./utilidades');

const r = registro('interaccion');
test.afterAll(() => r.guardar());

test('RNF-05 CI-01 todos los controles se alcanzan y operan con teclado', async ({ page }) => {
  await abrir(page);
  await page.locator('details.data summary').first().focus();
  const controles = await page.evaluate(() => {
    const sel = 'main select, main input, main button, main summary, main a[href], aside a[href]';
    return [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null).map((e) => e.id || e.dataset.v || e.dataset.l || e.dataset.k || e.textContent.trim().slice(0, 30));
  });
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('Home');
  const alcanzados = new Set();
  for (let i = 0; i < controles.length + 25; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(() => { const e = document.activeElement; return e ? (e.id || e.dataset.v || e.dataset.l || e.dataset.k || e.textContent.trim().slice(0, 30)) : null; });
    if (id) alcanzados.add(id);
  }
  const alcanzables = controles.filter((c) => alcanzados.has(c));
  // Operación con teclado: especie con Enter, departamento con flechas, idioma con Espacio.
  await page.locator('#fEsp button[data-v="vivax"]').focus();
  await page.keyboard.press('Enter');
  const op1 = await page.locator('#fEsp button[data-v="vivax"]').getAttribute('aria-pressed') === 'true';
  await page.locator('#fDep').focus();
  await page.keyboard.press('ArrowDown');
  const op2 = (await page.locator('#fDep').inputValue()) !== 'PERU';
  await page.locator('#langSeg button[data-l="en"]').focus();
  await page.keyboard.press('Space');
  const op3 = (await page.locator('html').getAttribute('lang')) === 'en';
  r.agregar({ metrica: 'CI-01', controles: controles.length, alcanzados: alcanzables.length, no_alcanzados: controles.filter((c) => !alcanzados.has(c)),
    operaciones: { enter_especie: op1, flechas_departamento: op2, espacio_idioma: op3 } });
  expect(alcanzables.length).toBe(controles.length);
  expect(op1 && op2 && op3).toBe(true);
});

const invalidos = [
  { anio: '1990' }, { anio: 'abc' }, { dep: 'ATLANTIDA' }, { esp: 'malariae' }, { anio: '2030', dep: '<script>', esp: 'x' },
];
for (const p of invalidos) {
  test(`RNF-06 CI-02 entrada inválida ${JSON.stringify(p)}`, async ({ page }) => {
    const errores = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await abrir(page, p);
    const aviso = await page.locator('#avisoTxt').innerText();
    const ok = aviso.includes('no válido') && errores.length === 0 && (await page.locator('#fAnio').inputValue()) === '2025';
    r.agregar({ metrica: 'CI-02', entrada: p, aviso_visible: aviso.includes('no válido'), errores, ok });
    expect(ok).toBe(true);
  });
}

test('RNF-05 CI-04 cada gráfico tiene descripción accesible y datos consultables', async ({ page }) => {
  await abrir(page, { anio: '2024' });
  const graficos = [
    ['chAnual', '#tbAnual'], ['chCanal', '#tbCanal'], ['chPiramide', '#tbPiramide'], ['chMapa', '#chRank'], ['chRank', '#tbDist'],
  ];
  let ok = 0;
  const detalle = [];
  for (const [g, alt] of graficos) {
    const etiqueta = await page.locator(`#${g}`).getAttribute('aria-label');
    const rol = await page.locator(`#${g}`).getAttribute('role');
    const altOk = (await page.locator(alt).count()) > 0 && (await page.locator(alt).innerHTML()).length > 50;
    const bien = !!etiqueta && etiqueta.length > 5 && rol === 'img' && altOk;
    detalle.push({ grafico: g, etiqueta, alternativa: alt, ok: bien });
    if (bien) ok++;
  }
  r.agregar({ metrica: 'CI-04', total: graficos.length, ok, detalle });
  expect(ok).toBe(graficos.length);
});

test('RNF-14 SO-01 el aviso de datos provisionales está en todas las vistas', async ({ page }) => {
  const vistas = [{ anio: '2025' }, { anio: '2010', dep: 'LORETO' }, { anio: '2003', esp: 'falciparum' }, { anio: '2025', lang: 'en' }, { anio: '2019', dep: 'TUMBES', lang: 'en' }];
  let ok = 0;
  for (const v of vistas) {
    await abrir(page, v);
    const txt = await page.locator('#aviso').innerText();
    const visible = await page.locator('#aviso').isVisible();
    const bien = visible && /provisional/i.test(txt) && txt.includes('MINSA') && /20\d\d/.test(txt);
    r.agregar({ metrica: 'SO-01', vista: v, ok: bien });
    if (bien) ok++;
  }
  expect(ok).toBe(vistas.length);
});

test('RNF-14 SO-03 se señalan las limitaciones conocidas de la fuente', async ({ page }) => {
  await abrir(page, { anio: '2005' });
  const checks = {
    cambio_fuente_2009: await page.locator('#chAnual').innerText().then((t) => t.includes('Cambio de fuente')),
    edad_no_disponible: await page.locator('#chPiramide').innerText().then((t) => t.includes('2009')),
    casos_no_son_tasas: await page.locator('#aviso').innerText().then((t) => /tasas/i.test(t)),
  };
  await abrir(page, { anio: '2002' });
  checks.canal_sin_anios = await page.locator('#canalN').innerText().then((t) => /No hay suficientes/.test(t));
  r.agregar({ metrica: 'SO-03', checks, ok: Object.values(checks).filter(Boolean).length, total: Object.keys(checks).length });
  expect(Object.values(checks).every(Boolean)).toBe(true);
});

test('RNF-02 IF-03 el dashboard cubre las dimensiones de la vigilancia', async ({ page }) => {
  await abrir(page, { anio: '2024' });
  const dims = {
    tendencia_anual: await page.locator('#chAnual svg').count() > 0,
    semana_epidemiologica: await page.locator('#tbCanal tbody tr').count() >= 52,
    canal_endemico: await page.locator('#chCanal').innerText().then((t) => t.includes('Epidemia')),
    departamento: await page.locator('#chMapa path[data-dep]').count() === 25,
    distrito: await page.locator('#tbDist tbody tr').count() > 0,
    edad: await page.locator('#tbPiramide tbody tr').count() === 5,
    sexo: await page.locator('#chPiramide').innerText().then((t) => t.includes('Mujeres') && t.includes('Hombres')),
    especie: await page.locator('#fEsp button').count() === 3,
  };
  r.agregar({ metrica: 'IF-03', dims, ok: Object.values(dims).filter(Boolean).length, total: Object.keys(dims).length });
  await captura(page, 'if03-dimensiones');
  expect(Object.values(dims).every(Boolean)).toBe(true);
});
