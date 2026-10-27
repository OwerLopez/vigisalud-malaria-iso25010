// Ejecuta una corrida completa de evaluación ISO/IEC 25010 y consolida los resultados.
// Uso: CORRIDA=01 node evaluacion/scripts/corrida.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';

const corrida = process.env.CORRIDA;
if (!/^\d\d$/.test(corrida || '')) { console.error('Defina CORRIDA=01, 02 o 03'); process.exit(1); }
const raiz = process.cwd();
const dir = path.join(raiz, 'evaluacion', 'resultados', `corrida-${corrida}`);
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const base = process.env.BASE_URL || 'https://vigisalud-malaria.vercel.app';
const sh = (c) => { try { return execSync(c, { cwd: raiz, encoding: 'utf-8' }).trim(); } catch { return null; } };
const datos = JSON.parse(fs.readFileSync(path.join(raiz, 'site', 'data', 'calidad_datos.json'), 'utf-8'));
const meta = {
  corrida, fecha: new Date().toISOString(), base_url: base, commit: sh('git rev-parse --short HEAD'),
  entorno: `${os.type()} ${os.release()} · Node ${process.version} · Playwright ${sh('npx playwright --version')} · Lighthouse 12.8.2`,
  navegadores: 'Chromium, Firefox, WebKit (Playwright); Chrome estable (Lighthouse)',
  datos: datos.archivos.map((a) => `${a.archivo} sha256:${a.sha256.slice(0, 16)}`).join('; '),
};
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
const env = { ...process.env, CORRIDA: corrida, BASE_URL: base };
const paso = (nombre, cmd, args) => {
  console.log(`\n=== ${nombre}`);
  const r = spawnSync(cmd, args, { cwd: raiz, env, stdio: 'inherit', shell: true });
  meta[`salida_${nombre}`] = r.status;
};
paso('pruebas', 'npx', ['playwright', 'test', '-c', 'evaluacion/playwright.config.js']);
paso('lighthouse', 'node', ['evaluacion/scripts/lighthouse.mjs']);
paso('seguridad', 'node', ['evaluacion/scripts/seguridad.mjs']);
paso('mantenibilidad', 'node', ['evaluacion/scripts/mantenibilidad.mjs']);
paso('disponibilidad', 'node', ['evaluacion/scripts/disponibilidad.mjs', process.env.SONDEOS || '20', process.env.INTERVALO || '15']);
meta.fin = new Date().toISOString();
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
paso('consolidar', 'node', ['evaluacion/scripts/consolidar.mjs']);
