// Capturas de pantalla del sistema publicado para el informe (ES) y las diapositivas (EN).
// Uso: node docs/capturas.mjs  ->  docs/capturas/*.png
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL || 'https://vigisalud-malaria.vercel.app';
const dir = path.join(process.cwd(), 'docs', 'capturas');
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();

async function pagina(lang, url, ancho = 1440, alto = 900) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2, colorScheme: 'light', locale: lang === 'es' ? 'es-PE' : 'en-US' });
  const p = await ctx.newPage();
  await p.goto(`${base}${url}${url.includes('?') ? '&' : '?'}lang=${lang}`);
  await p.waitForLoadState('networkidle');
  // Segunda carga con las fuentes ya en caché (font-display: optional).
  await p.reload();
  await p.waitForLoadState('networkidle');
  await p.evaluate(() => document.fonts.ready);
  // La barra superior es fija (sticky): en capturas de secciones largas quedaría superpuesta al contenido.
  await p.addStyleTag({ content: '.top { position: static !important; }' });
  return { p, ctx };
}
async function seccion(p, sel, nombre) {
  const el = p.locator(sel);
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await el.screenshot({ path: path.join(dir, `${nombre}.png`) });
}

for (const lang of ['es', 'en']) {
  let { p, ctx } = await pagina(lang, '/?anio=2024');
  await p.screenshot({ path: path.join(dir, `${lang}-dashboard-inicio.png`) });
  await seccion(p, '#panorama', `${lang}-panorama`);
  await seccion(p, '#tendencia', `${lang}-tendencia`);
  await seccion(p, '#canal', `${lang}-canal`);
  await seccion(p, '#territorio', `${lang}-territorio`);
  await seccion(p, '#poblacion', `${lang}-poblacion`);
  await p.fill('#q', '');
  await seccion(p, '#distritos', `${lang}-distritos`);
  await seccion(p, '#datos', `${lang}-datos`);
  await p.locator('#aviso').screenshot({ path: path.join(dir, `${lang}-aviso.png`) });
  await ctx.close();
  ({ p, ctx } = await pagina(lang, '/?anio=2014&dep=LORETO&esp=vivax'));
  await p.screenshot({ path: path.join(dir, `${lang}-dashboard-loreto-2014.png`) });
  await ctx.close();
  ({ p, ctx } = await pagina(lang, '/calidad.html'));
  await p.screenshot({ path: path.join(dir, `${lang}-calidad-inicio.png`) });
  for (const s of ['resumen', 'caracteristicas-sec', 'metricas', 'requisitos', 'incidentes', 'evolucion', 'proceso']) await seccion(p, `#${s}`, `${lang}-calidad-${s}`);
  await ctx.close();
  ({ p, ctx } = await pagina(lang, '/?anio=2025', 390, 844));
  await p.screenshot({ path: path.join(dir, `${lang}-movil.png`) });
  await ctx.close();
}
// Estado de error controlado (tolerancia a fallos).
const ctx = await browser.newContext({ viewport: { width: 1440, height: 700 }, deviceScaleFactor: 2, colorScheme: 'light' });
const p = await ctx.newPage();
await p.route('**/data/malaria.json', (r) => r.abort('internetdisconnected'));
await p.goto(`${base}/?lang=es`);
await p.locator('#estadoError').waitFor();
await p.screenshot({ path: path.join(dir, 'es-error-controlado.png') });
await ctx.close();
// Diagramas del informe (ES) y de las diapositivas (EN).
const dctx = await browser.newContext({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 2 });
const dp = await dctx.newPage();
for (const [lang, archivo] of [['es', 'diagramas.html'], ['en', 'diagramas_en.html']]) {
  await dp.goto(pathToFileURL(path.join(process.cwd(), 'docs', archivo)).href);
  await dp.evaluate(() => document.fonts.ready);
  for (const id of ['arquitectura', 'proceso', 'formato', 'origen']) await dp.locator(`#d-${id}`).screenshot({ path: path.join(dir, `${lang}-diag-${id}.png`) });
}
await browser.close();
console.log(fs.readdirSync(dir).length, 'capturas en', dir);
