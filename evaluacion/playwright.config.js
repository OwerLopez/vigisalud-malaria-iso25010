// Configuración de la evaluación ISO/IEC 25010 de VigiSalud Malaria.
// CORRIDA=01|02|03 envía reportes y evidencias a evaluacion/resultados/corrida-NN.
// BASE_URL permite evaluar otra versión (por defecto, producción).
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const corrida = process.env.CORRIDA || 'desarrollo';
const salida = path.join(__dirname, 'resultados', `corrida-${corrida}`);
process.env.SALIDA_EVAL = salida;

module.exports = defineConfig({
  testDir: './pruebas',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  forbidOnly: true,
  outputDir: path.join(salida, 'artefactos'),
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(salida, 'playwright.json') }],
    ['html', { outputFolder: path.join(salida, 'reporte-html'), open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://vigisalud-malaria.vercel.app',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    acceptDownloads: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox', testMatch: /adaptabilidad\.spec\.js/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: /adaptabilidad\.spec\.js/, use: { ...devices['Desktop Safari'] } },
  ],
});
