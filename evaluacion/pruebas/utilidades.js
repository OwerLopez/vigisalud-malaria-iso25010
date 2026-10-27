// Utilidades comunes de las pruebas: abrir el dashboard, leer cifras y guardar mediciones.
const fs = require('fs');
const path = require('path');
const { expect } = require('@playwright/test');

const SALIDA = () => process.env.SALIDA_EVAL || path.join(__dirname, '..', 'resultados', 'corrida-desarrollo');

async function abrir(page, params = {}) {
  const q = new URLSearchParams({ lang: 'es', ...params });
  await page.goto(`/?${q}`);
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('[data-testid="kpi-casos"]')).toBeVisible();
}

const entero = (s) => Number(String(s).replace(/[^\d-]/g, ''));
const decimal = (s) => {
  const t = String(s).replace(/[^\d.,+-]/g, '');
  return t ? Number(t.replace(/,(?=\d{3}\b)/g, '').replace(',', '.')) : null;
};

async function kpi(page, id) {
  const card = page.locator(`[data-testid="kpi-${id}"]`);
  return { val: (await card.locator('.val').innerText()).trim(), foot: (await card.locator('.foot').innerText()).trim() };
}

/**
 * Registra mediciones de una métrica escribiendo cada fila en el momento (lectura-modificación-escritura).
 * Así no se pierden filas cuando Playwright reinicia el worker tras una prueba fallida.
 */
function registro(nombre, proyecto = '') {
  const archivo = () => path.join(SALIDA(), `${nombre}${proyecto ? `-${proyecto}` : ''}.json`);
  const leer = () => (fs.existsSync(archivo()) ? JSON.parse(fs.readFileSync(archivo(), 'utf8')) : []);
  return {
    agregar: (fila) => {
      fs.mkdirSync(SALIDA(), { recursive: true });
      const filas = leer();
      filas.push({ ...fila, hora: new Date().toISOString() });
      fs.writeFileSync(archivo(), JSON.stringify(filas, null, 1));
    },
    guardar: () => {},
    leer,
  };
}

async function captura(page, nombre) {
  const dir = path.join(SALIDA(), 'capturas');
  fs.mkdirSync(dir, { recursive: true });
  const ruta = path.join(dir, `${nombre}.png`);
  await page.screenshot({ path: ruta, fullPage: false });
  return path.relative(path.join(__dirname, '..', '..'), ruta).replace(/\\/g, '/');
}

module.exports = { abrir, entero, decimal, kpi, registro, captura, SALIDA };
