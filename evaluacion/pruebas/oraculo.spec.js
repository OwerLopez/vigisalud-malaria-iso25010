// IF-02 Corrección funcional: compara cada cifra visible con el oráculo calculado desde los CSV oficiales.
const path = require('path');
const { test, expect } = require('@playwright/test');
const { abrir, entero, decimal, kpi, registro } = require('./utilidades');

const esperados = require(path.join(__dirname, '..', 'oraculo', 'esperados.json'));
const reg = registro('if02-oraculo');
test.afterAll(() => reg.guardar());

for (const e of esperados.escenarios) {
  test(`RNF-01 escenario ${e.anio} ${e.dep} ${e.esp}`, async ({ page }) => {
    await abrir(page, { anio: String(e.anio), dep: e.dep, esp: e.esp });
    const comparar = (campo, obtenido, esperado) => {
      const ok = obtenido === esperado;
      reg.agregar({ escenario: `${e.anio}-${e.dep}-${e.esp}`, campo, esperado, obtenido, ok });
      expect.soft(obtenido, `${campo}`).toBe(esperado);
    };
    const casos = await kpi(page, 'casos');
    comparar('casos', entero(casos.val), e.casos);
    const v = await kpi(page, 'var');
    comparar('variacion_pct', v.val === '—' ? null : decimal(v.val), e.variacion_pct);
    comparar('caso_anio_previo', e.previo ? entero(v.foot.split(':').pop()) : null, e.previo || null);
    const pf = await kpi(page, 'pf');
    comparar('pf_pct', pf.val === '—' ? null : decimal(pf.val), e.pf_pct);
    const top = await kpi(page, 'top');
    comparar('lider_casos', top.foot === '—' ? 0 : entero(top.foot.split('·')[0]), e.lider_casos);
    const pico = await kpi(page, 'pico');
    comparar('pico_semana', pico.val === '—' ? null : entero(pico.val), e.pico_semana);
    comparar('pico_casos', pico.foot === '—' ? 0 : entero(pico.foot.split('casos')[0]), e.pico_casos);
    comparar('semanas_con_casos', pico.foot === '—' ? 0 : entero(pico.foot.split('·')[1]), e.semanas_con_casos);
    const cuenta = await page.locator('#distCount').innerText();
    comparar('distritos_con_casos', entero(cuenta.split(/de|of/)[1]), e.distritos_con_casos);
    if (e.mujeres !== null) {
      const filas = await page.locator('#tbPiramide tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.cells].map((c) => c.textContent)));
      const suma = (i) => filas.reduce((s, f) => s + Number(f[i].replace(/\D/g, '')), 0);
      comparar('mujeres', filas.length ? suma(1) : 0, e.mujeres);
      comparar('hombres', filas.length ? suma(2) : 0, e.hombres);
    }
  });
}
