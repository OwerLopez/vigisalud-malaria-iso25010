// FI-02 Disponibilidad: sondeos HTTP periódicos al sitio y a sus archivos de datos.
// Uso: node evaluacion/scripts/disponibilidad.mjs [sondeos=40] [intervalo_s=15]
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.BASE_URL || 'https://vigisalud-malaria.vercel.app').replace(/\/$/, '');
const recursos = ['/', '/data/malaria.json', '/data/departamentos.geojson', '/calidad.html'];
const n = Number(process.argv[2] || 40), intervalo = Number(process.argv[3] || 15) * 1000;
const salida = path.join(process.cwd(), 'evaluacion', 'resultados', `corrida-${process.env.CORRIDA || 'desarrollo'}`);
fs.mkdirSync(salida, { recursive: true });
const sondeos = [];
for (let i = 0; i < n; i++) {
  for (const r of recursos) {
    const t0 = performance.now();
    let estado = 0, error = null;
    try {
      const resp = await fetch(`${base}${r}?sonda=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      estado = resp.status;
      await resp.arrayBuffer();
    } catch (e) { error = e.name; }
    sondeos.push({ ronda: i + 1, recurso: r, estado, ms: Math.round(performance.now() - t0), error, hora: new Date().toISOString() });
  }
  if (i < n - 1) await new Promise((ok) => setTimeout(ok, intervalo));
}
const ok = sondeos.filter((s) => s.estado === 200).length;
const lat = sondeos.map((s) => s.ms).sort((a, b) => a - b);
const res = { base, sondeos_totales: sondeos.length, respuestas_200: ok, disponibilidad_pct: Math.round((ok / sondeos.length) * 10000) / 100,
  latencia_mediana_ms: lat[Math.floor(lat.length / 2)], latencia_p95_ms: lat[Math.floor(lat.length * 0.95)],
  inicio: sondeos[0].hora, fin: sondeos[sondeos.length - 1].hora, sondeos };
fs.writeFileSync(path.join(salida, 'disponibilidad.json'), JSON.stringify(res, null, 1));
console.log({ ...res, sondeos: undefined });
