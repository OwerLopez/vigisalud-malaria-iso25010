// IF-01 Completitud funcional: un caso de aceptación por requisito funcional (RF-01…RF-15).
// CO-01 Interoperabilidad: RF-11 valida las exportaciones CSV y JSON.
const fs = require('fs');
const { test, expect } = require('@playwright/test');
const { abrir, entero, kpi, registro, captura } = require('./utilidades');

const exportes = registro('co01-exportaciones');
test.afterAll(() => exportes.guardar());

test.describe('Requisitos funcionales', () => {
  test('RF-01 carga los datos oficiales y muestra los indicadores clave', async ({ page }) => {
    await abrir(page);
    for (const id of ['casos', 'var', 'pf', 'top', 'pico']) await expect(page.locator(`[data-testid="kpi-${id}"] .val`)).not.toHaveText('');
    expect(entero((await kpi(page, 'casos')).val)).toBeGreaterThan(0);
    await expect(page.locator('#aviso')).toContainText('MINSA');
    await captura(page, 'rf01-panorama');
  });

  test('RF-02 filtra por año y actualiza los indicadores', async ({ page }) => {
    await abrir(page);
    const antes = (await kpi(page, 'casos')).val;
    await page.selectOption('#fAnio', '2014');
    await expect(page.locator('[data-testid="kpi-casos"] .foot')).toContainText('2014');
    expect((await kpi(page, 'casos')).val).not.toBe(antes);
    expect(page.url()).toContain('anio=2014');
  });

  test('RF-03 filtra por departamento', async ({ page }) => {
    await abrir(page, { anio: '2022' });
    await page.selectOption('#fDep', 'AMAZONAS');
    await expect(page.locator('[data-testid="kpi-casos"] .foot')).toContainText('Amazonas');
    await expect(page.locator('[data-testid="kpi-top"] .lab')).toContainText('Distrito');
  });

  test('RF-04 filtra por especie', async ({ page }) => {
    await abrir(page, { anio: '2024' });
    const todas = entero((await kpi(page, 'casos')).val);
    await page.locator('#fEsp button[data-v="vivax"]').click();
    const vivax = entero((await kpi(page, 'casos')).val);
    await page.locator('#fEsp button[data-v="falciparum"]').click();
    const falci = entero((await kpi(page, 'casos')).val);
    expect(vivax + falci).toBe(todas);
  });

  test('RF-05 muestra la serie anual 2000–2025 por especie', async ({ page }) => {
    await abrir(page);
    await page.locator('#tendencia details summary').click();
    await expect(page.locator('#tbAnual tbody tr')).toHaveCount(26);
    await expect(page.locator('#chAnual svg path')).not.toHaveCount(0);
    await page.locator('#tendencia').scrollIntoViewIfNeeded();
    await captura(page, 'rf05-tendencia');
  });

  test('RF-06 muestra la curva semanal frente al canal endémico', async ({ page }) => {
    await abrir(page, { anio: '2024' });
    await expect(page.locator('#canalN')).toContainText('2019–2023');
    for (const z of ['Éxito', 'Seguridad', 'Alarma', 'Epidemia']) await expect(page.locator('#chCanal')).toContainText(z);
    await page.locator('#canal').scrollIntoViewIfNeeded();
    await captura(page, 'rf06-canal-endemico');
  });

  test('RF-07 el mapa coroplético permite seleccionar un departamento', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('#chMapa path[data-dep]')).toHaveCount(25);
    await page.locator('#chMapa path[data-dep="TUMBES"]').click({ force: true });
    await expect(page.locator('#fDep')).toHaveValue('TUMBES');
    await page.selectOption('#fDep', 'PERU');
    await page.locator('#territorio').scrollIntoViewIfNeeded();
    await captura(page, 'rf07-mapa-ranking');
  });

  test('RF-08 muestra el ranking de departamentos ordenado', async ({ page }) => {
    await abrir(page, { anio: '2014' });
    const valores = await page.locator('#chRank text.val-l').allInnerTexts();
    const n = valores.map(entero);
    expect(n.length).toBeGreaterThan(5);
    expect([...n].sort((a, b) => b - a)).toEqual(n);
  });

  test('RF-09 muestra edad y sexo desde 2009 y explica su ausencia antes', async ({ page }) => {
    await abrir(page, { anio: '2024' });
    await page.locator('#poblacion details summary').click();
    await expect(page.locator('#tbPiramide tbody tr')).toHaveCount(5);
    await page.locator('#poblacion').scrollIntoViewIfNeeded();
    await captura(page, 'rf09-piramide');
    await page.selectOption('#fAnio', '2005');
    await expect(page.locator('#chPiramide')).toContainText('2009');
  });

  test('RF-10 lista distritos con búsqueda y ordenamiento', async ({ page }) => {
    await abrir(page, { anio: '2025' });
    const filas = page.locator('#tbDist tbody tr');
    expect(await filas.count()).toBeGreaterThan(10);
    await page.fill('#q', 'iquitos');
    await expect(filas.first()).toContainText(/Iquitos/i);
    await page.fill('#q', '');
    await page.locator('#tbDist th button[data-k="dist"]').click();
    const nombres = (await page.locator('#tbDist tbody tr td:nth-child(2)').allInnerTexts()).slice(0, 10).map((s) => s.split('\n')[0]);
    expect([...nombres].sort((a, b) => a.localeCompare(b, 'es'))).toEqual(nombres);
    await page.locator('#distritos').scrollIntoViewIfNeeded();
    await captura(page, 'rf10-distritos');
  });

  test('RF-11 exporta CSV y JSON consistentes con la interfaz', async ({ page }) => {
    for (const esc of [{ anio: '2025', dep: 'PERU' }, { anio: '2014', dep: 'LORETO' }]) {
      await abrir(page, esc);
      const total = entero((await kpi(page, 'casos')).val);
      const [dCsv] = await Promise.all([page.waitForEvent('download'), page.click('#bCsv')]);
      const csv = fs.readFileSync(await dCsv.path(), 'utf-8').replace(/^﻿/, '').trim().split(/\r?\n/);
      const cab = csv[0].split(',');
      const iCasos = cab.indexOf('casos');
      const sumaCsv = csv.slice(1).reduce((s, l) => s + Number(l.match(/("[^"]*"|[^,]+)/g)[iCasos]), 0);
      exportes.agregar({ escenario: esc, formato: 'CSV', filas: csv.length - 1, suma: sumaCsv, interfaz: total, ok: sumaCsv === total && iCasos >= 0 });
      const [dJson] = await Promise.all([page.waitForEvent('download'), page.click('#bJson')]);
      let okJson = false, sumaJson = null;
      try {
        const j = JSON.parse(fs.readFileSync(await dJson.path(), 'utf-8'));
        sumaJson = j.distritos.reduce((s, d) => s + d.casos, 0);
        okJson = sumaJson === total && j.meta.fuente.includes('MINSA');
      } catch (e) { okJson = false; }
      exportes.agregar({ escenario: esc, formato: 'JSON', suma: sumaJson, interfaz: total, ok: okJson });
      expect(sumaCsv).toBe(total);
      expect(okJson).toBe(true);
    }
  });

  test('RF-12 informa la fuente, la validación y los hashes', async ({ page, request }) => {
    await abrir(page);
    const cal = await (await request.get('/data/calidad_datos.json')).json();
    const texto = await page.locator('#datosCards').innerText();
    for (const a of cal.archivos) {
      expect(texto).toContain(a.archivo);
      expect(texto).toContain(a.sha256.slice(0, 12));
    }
    await page.locator('#datos').scrollIntoViewIfNeeded();
    await captura(page, 'rf12-datos-metodo');
  });

  test('RF-13 ofrece la interfaz en español e inglés', async ({ page }) => {
    await abrir(page);
    await page.locator('#langSeg button[data-l="en"]').click();
    await expect(page.locator('h1')).toHaveText('Malaria in Peru, 2000–2025');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('#langSeg button[data-l="es"]').click();
    await expect(page.locator('h1')).toHaveText('Malaria en el Perú, 2000–2025');
  });

  test('RF-14 comparte el estado de los filtros mediante la URL', async ({ page }) => {
    await abrir(page, { anio: '2016', dep: 'JUNIN', esp: 'falciparum' });
    await expect(page.locator('#fAnio')).toHaveValue('2016');
    await expect(page.locator('#fDep')).toHaveValue('JUNIN');
    await expect(page.locator('#fEsp button[data-v="falciparum"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('RF-15 presenta el tablero de control de calidad ISO/IEC 25010', async ({ page }) => {
    await page.goto('/calidad.html?lang=es');
    await expect(page.locator('#tbMetricas tbody tr')).toHaveCount(25);
    await expect(page.locator('#caracteristicas .card')).toHaveCount(9);
    await captura(page, 'rf15-tablero-calidad');
  });
});
