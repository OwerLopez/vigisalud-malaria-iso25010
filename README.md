# VigiSalud Malaria · Evaluación de calidad ISO/IEC 25010

Dashboard de vigilancia epidemiológica de malaria en el Perú, construido con los datos abiertos oficiales del MINSA – CDC Perú, y evaluación de su calidad con el modelo **ISO/IEC 25010:2023**: características adoptadas, métricas GQM, proceso ISO/IEC 25040 con formatos de recopilación y tablero de control.

**Curso:** Calidad de Software · Trabajo Parcial 6 · Escuela Profesional de Ingeniería de Sistemas, Universidad Nacional de San Agustín de Arequipa (2026-B)
**Docente:** Mg. Jesús Martín Silva Fernández
**Equipo:** Cari Quispe, Juan Manuel · Chura Monroy, Daniel Wilston · Lopez Arela, Ower Frank · Phocco Tapia, Alejandro Josue · Zegarra Puma, Mauricio Eduardo

| Recurso | Enlace |
|---|---|
| Dashboard público | https://vigisalud-malaria.vercel.app |
| Tablero de control ISO/IEC 25010 | https://vigisalud-malaria.vercel.app/calidad.html |
| Fuente de datos | https://www.datosabiertos.gob.pe/dataset/vigilancia-epidemiol%C3%B3gica-de-malaria |

## Qué contiene

```
pipeline/procesar.py        Validación y agregación de los CSV oficiales -> site/data/*.json (solo agregados)
site/                       Sitio estático publicado en Vercel
  index.html, assets/app.js   Dashboard (panorama, tendencia, canal endémico, territorio, población, distritos, datos)
  calidad.html, assets/calidad.js  Tablero de control ISO/IEC 25010
  data/calidad.json           Resultados consolidados de todas las corridas (generado)
  vercel.json                 Cabeceras de seguridad (CSP, OWASP)
evaluacion/
  modelo.json               Punto 1: características, prioridad, subcaracterísticas y exclusiones justificadas
  metricas.json             Punto 2: 25 métricas GQM (A, B, fórmula, umbral, fuente, herramienta, responsable)
  requisitos.json           RF-01…RF-15 y RNF-01…RNF-14 con su trazabilidad a métricas
  incidentes.json           Registro de incidentes clasificados por origen (producto, script, infraestructura)
  versiones.json            Versión publicada evaluada en cada corrida
  oraculo.py                Oráculo independiente: recalcula las cifras esperadas desde los CSV
  pruebas/                  Pruebas Playwright (funcionales, oráculo, interacción, fiabilidad, adaptabilidad, accesibilidad, rendimiento)
  scripts/                  Corrida, Lighthouse, seguridad, mantenibilidad, disponibilidad y consolidación
  resultados/corrida-NN/    Evidencias de cada corrida (JSON por métrica, capturas, reporte HTML, Lighthouse)
  resultados/registro.json  Punto 3: formato de recopilación (una ficha de 7 bloques por métrica y corrida)
docs/                       Diagramas, capturas del sitio publicado y recursos gráficos
entregables/                Informe, artículo IEEE, diapositivas, Excel y código comprimido
```

## Resultados

Nueve corridas sobre la versión publicada en producción. Los umbrales se fijaron antes de la corrida 01.

| Corrida | Versión | Pruebas aprobadas | Métricas aprobadas |
|---|---|---|---|
| 01 | v1.0 | 40/51 | 18/25 |
| 02 | v1.1 | 51/51 | 24/25 |
| 03 | v1.2 | 51/51 | 24/25 |
| 04 | v1.3 | 51/51 | 24/25 |
| 05 | v1.4 | 51/51 | 25/25 |
| 06 | v1.5 | 51/51 | 25/25 |
| 07 | v1.6 | 51/51 | 25/25 |
| 08 | v1.7 | 51/51 | 25/25 |
| 09 | v1.8 | 51/51 | 25/25 |

Se registraron 21 incidentes: cada uno se reprodujo, se clasificó por su origen antes de corregirlo y se volvió a medir en la corrida siguiente. El detalle está en el tablero y en `evaluacion/incidentes.json`.

## Cómo reproducir

Requisitos: Node.js 22, Python 3.12.

```bash
npm install
npx playwright install chromium firefox webkit
# Descargar los dos CSV oficiales en datos/crudos/ (no se versionan)
npm run datos          # genera site/data/*.json
npm run oraculo        # genera los valores esperados del oráculo
CORRIDA=10 npm run corrida   # mide la versión publicada y consolida
```

Para medir una copia local, sirva `site/` (por ejemplo `python -m http.server 8765 -d site`) y use `BASE_URL=http://127.0.0.1:8765`.

## Entregables

La carpeta `entregables/` contiene lo que se presenta:

| Archivo | Contenido |
|---|---|
| `00_LEEME.txt` | Enlaces, contenido y reparto de la exposición |
| `01_Informe_TP6_ISO25010_VigiSalud_Malaria.docx` / `.pdf` | Informe completo en español |
| `02_Paper_IEEE_ISO25010_VigiSalud_Malaria.pdf` | Artículo en formato IEEE (fuente LaTeX en `02_Paper_IEEE_fuente/`) |
| `03_Slides_TP6_ISO25010_VigiSalud_Malaria.pptx` / `.pdf` | Diapositivas en inglés con notas del orador |
| `04_Registro_Metricas_ISO25010_VigiSalud_Malaria.xlsx` | Registro y cálculo de métricas con fórmulas |
| `05_Codigo_VigiSalud_Malaria_ISO25010.zip` | Código, pruebas y evidencias |

## Licencias

Código: MIT. Datos: MINSA – CDC Perú, Plataforma Nacional de Datos Abiertos (ODC-By). Fuentes tipográficas IBM Plex: SIL Open Font License 1.1 (`site/assets/fonts/OFL.txt`). D3 v7.9.0: ISC.
