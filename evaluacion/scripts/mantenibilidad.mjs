// MA-01 Analizabilidad (complejidad ciclomática) y MA-02 Modificabilidad (densidad de problemas ESLint).
// Código del producto: site/assets/*.js (sin la librería d3) y pipeline/procesar.py.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ESLint } from 'eslint';
import js from '@eslint/js';
import globals from 'globals';

const raiz = process.cwd();
const salida = path.join(raiz, 'evaluacion', 'resultados', `corrida-${process.env.CORRIDA || 'desarrollo'}`);
fs.mkdirSync(salida, { recursive: true });
const archivosJs = fs.readdirSync(path.join(raiz, 'site', 'assets')).filter((f) => f.endsWith('.js')).map((f) => path.join('site', 'assets', f));
const base = { languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: { ...globals.browser, d3: 'readonly', VM: 'readonly' } } };

// Problemas de análisis estático (reglas recomendadas de ESLint).
const lint = new ESLint({ cwd: raiz, overrideConfigFile: true, overrideConfig: [js.configs.recommended, base] });
const resLint = await lint.lintFiles(archivosJs);
const problemas = resLint.flatMap((r) => r.messages.map((m) => ({ archivo: path.relative(raiz, r.filePath), linea: m.line, regla: m.ruleId, mensaje: m.message })));

// Complejidad de cada función: la regla complexity con máximo 0 informa el valor de todas.
const cc = new ESLint({ cwd: raiz, overrideConfigFile: true, overrideConfig: [base, { rules: { complexity: ['warn', 0] } }] });
const resCc = await cc.lintFiles(archivosJs);
const funcionesJs = resCc.flatMap((r) => r.messages.filter((m) => m.ruleId === 'complexity').map((m) => ({
  archivo: path.relative(raiz, r.filePath), linea: m.line, nombre: (m.message.match(/^(.*?) has a complexity/) || [])[1], cc: Number((m.message.match(/complexity of (\d+)/) || [])[1]) })));

// Python: radon (reutiliza el entorno del proyecto si existe).
let funcionesPy = [];
const pyRadon = process.env.RADON_PY || path.join(raiz, '..', 'VigiSalud_TP5', '.venv', 'Scripts', 'python.exe');
try {
  const out = execFileSync(pyRadon, ['-m', 'radon', 'cc', '-j', 'pipeline'], { cwd: raiz, encoding: 'utf-8' });
  for (const [archivo, bloques] of Object.entries(JSON.parse(out))) {
    for (const b of bloques) {
      funcionesPy.push({ archivo, linea: b.lineno, nombre: b.name, cc: b.complexity });
      for (const m of b.methods || []) funcionesPy.push({ archivo, linea: m.lineno, nombre: `${b.name}.${m.name}`, cc: m.complexity });
    }
  }
} catch (e) { console.warn('radon no disponible:', e.message); }

const lineasCodigo = (f) => fs.readFileSync(path.join(raiz, f), 'utf-8').split(/\r?\n/).filter((l) => l.trim() && !/^\s*(\/\/|\*|\/\*|#)/.test(l)).length;
const loc = [...archivosJs, path.join('pipeline', 'procesar.py')].reduce((s, f) => s + lineasCodigo(f), 0);
const funciones = [...funcionesJs, ...funcionesPy];
const aceptables = funciones.filter((f) => f.cc <= 10);
const res = {
  fecha: new Date().toISOString(), archivos: [...archivosJs, 'pipeline/procesar.py'], lineas_codigo: loc,
  MA01: { A: aceptables.length, B: funciones.length, mayores_a_10: funciones.filter((f) => f.cc > 10), cc_media: +(funciones.reduce((s, f) => s + f.cc, 0) / funciones.length).toFixed(2) },
  MA02: { problemas: problemas.length, kloc: +(loc / 1000).toFixed(3), densidad: +(problemas.length / (loc / 1000)).toFixed(2), detalle: problemas },
  funciones,
};
fs.writeFileSync(path.join(salida, 'mantenibilidad.json'), JSON.stringify(res, null, 1));
console.log({ loc, funciones: funciones.length, cc_ok: aceptables.length, mayores: res.MA01.mayores_a_10.map((f) => `${f.nombre}=${f.cc}`), problemas: problemas.length, densidad: res.MA02.densidad });
