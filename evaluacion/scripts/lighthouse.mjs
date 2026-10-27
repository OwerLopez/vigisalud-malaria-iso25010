// ED-01 y ED-03: tres ejecuciones de Lighthouse (perfil móvil por defecto: 4G lenta simulada y CPU ×4).
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const url = process.env.BASE_URL || 'https://vigisalud-malaria.vercel.app/';
const salida = path.join(process.cwd(), 'evaluacion', 'resultados', `corrida-${process.env.CORRIDA || 'desarrollo'}`);
fs.mkdirSync(salida, { recursive: true });
const ejecuciones = [];
for (let i = 1; i <= 3; i++) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  const res = await lighthouse(`${url}?lang=es`, { port: chrome.port, output: i === 3 ? ['json', 'html'] : 'json', logLevel: 'error' });
  await chrome.kill();
  const a = res.lhr.audits, c = res.lhr.categories;
  ejecuciones.push({
    ejecucion: i, fecha: res.lhr.fetchTime, version: res.lhr.lighthouseVersion,
    rendimiento: Math.round(c.performance.score * 100), accesibilidad: Math.round(c.accessibility.score * 100),
    buenas_practicas: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
    fcp_s: a['first-contentful-paint'].numericValue / 1000, lcp_s: a['largest-contentful-paint'].numericValue / 1000,
    tbt_ms: a['total-blocking-time'].numericValue, cls: a['cumulative-layout-shift'].numericValue,
    peso_kb: a['total-byte-weight'].numericValue / 1024, solicitudes: a['network-requests'].details.items.length,
  });
  if (i === 3) {
    fs.writeFileSync(path.join(salida, 'lighthouse.html'), res.report[1]);
  }
  console.log(ejecuciones[ejecuciones.length - 1]);
}
const med = (k) => { const v = ejecuciones.map((e) => e[k]).sort((x, y) => x - y); return v[1]; };
const resumen = { url, perfil: 'móvil (Moto G Power, 4G lenta simulada, CPU ×4)', ejecuciones,
  mediana: Object.fromEntries(['rendimiento', 'accesibilidad', 'buenas_practicas', 'seo', 'fcp_s', 'lcp_s', 'tbt_ms', 'cls', 'peso_kb'].map((k) => [k, med(k)])) };
fs.writeFileSync(path.join(salida, 'lighthouse.json'), JSON.stringify(resumen, null, 1));
console.log('mediana', resumen.mediana);
