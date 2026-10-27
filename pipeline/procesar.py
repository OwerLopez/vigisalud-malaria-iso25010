"""Procesa los datos abiertos oficiales de vigilancia de malaria (MINSA / CDC Peru).

Fuentes (Plataforma Nacional de Datos Abiertos, licencia ODC-By):
  datos_abiertos_vigilancia_malaria_2000_2008.csv  casos agregados por semana y distrito
  datos_abiertos_vigilancia_malaria_2009_2025.csv  un registro por caso notificado

Uso: python pipeline/procesar.py
Genera site/data/malaria.json (agregados que consume el dashboard) y
site/data/calidad_datos.json (validacion de los archivos de origen).
Solo se publican agregados: ningun registro individual sale del pipeline.
"""

import csv
import hashlib
import json
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CRUDOS = RAIZ / "datos" / "crudos"
SALIDA = RAIZ / "site" / "data"
ARCHIVO_A = "datos_abiertos_vigilancia_malaria_2000_2008.csv"
ARCHIVO_B = "datos_abiertos_vigilancia_malaria_2009_2025.csv"
URL_DATASET = "https://www.datosabiertos.gob.pe/dataset/vigilancia-epidemiol%C3%B3gica-de-malaria"
SEMANAS = 53
ESPECIES = ("falciparum", "vivax")
CODIGO_ESPECIE = {"B50": "falciparum", "B51": "vivax"}
GEOJSON = RAIZ / "datos" / "geo" / "peru_departamental_simple.geojson"
# Los CSV oficiales llegan con la letra Ñ sustituida por U+FFFD (fallo de codificación en la fuente).
# En departamento, provincia y distrito es el único carácter no ASCII, y las 31 palabras afectadas son
# topónimos con Ñ (CAÑETE, FERREÑAFE, DATEM DEL MARAÑON, IÑAPARI...): se restituye y se informa.
REEMPLAZO = "�"
GRUPOS_EDAD = ((0, 11, "0-11"), (12, 17, "12-17"), (18, 29, "18-29"), (30, 59, "30-59"), (60, 200, "60+"))


def sha256(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def fecha_descarga():
    """Fecha en que se descargaron los CSV (su fecha de modificación), no la del procesamiento."""
    return min(datetime.fromtimestamp((CRUDOS / a).stat().st_mtime).date() for a in (ARCHIVO_A, ARCHIVO_B)).isoformat()


def grupo_edad(edad, tipo):
    """Edad en anios; los registros en meses (M) o dias (D) corresponden a menores de 1 anio."""
    anios = edad if tipo == "A" else 0
    for minimo, maximo, etiqueta in GRUPOS_EDAD:
        if minimo <= anios <= maximo:
            return etiqueta
    return None


def codigos_departamento():
    """Codigo INEI de 2 digitos -> nombre de departamento (limites INEI, campo FIRST_IDDP)."""
    geo = json.loads(GEOJSON.read_text(encoding="utf-8"))
    return {f["properties"]["FIRST_IDDP"]: f["properties"]["NOMBDEP"] for f in geo["features"]}


class Acumulador:
    def __init__(self):
        self.codigos = codigos_departamento()
        self.recuperados = Counter()
        self.restituidos = set()
        self.anual = defaultdict(lambda: [0, 0])                       # anio -> [f, v]
        self.semanal = defaultdict(lambda: [[0] * SEMANAS, [0] * SEMANAS])  # (dep, anio) -> [f[], v[]]
        self.dep_anual = defaultdict(lambda: [0, 0])                   # (dep, anio)
        self.distrito = {}                                              # ubigeo -> meta
        self.dist_anual = defaultdict(lambda: [0, 0])                  # (ubigeo, anio)
        self.edad_sexo = defaultdict(lambda: defaultdict(lambda: [0, 0, 0, 0]))  # (dep, anio) -> grupo -> [F_f, M_f, F_v, M_v]

    def nombre(self, valor):
        if REEMPLAZO in valor:
            valor = valor.replace(REEMPLAZO, "Ñ")
            self.restituidos.add(valor)
        return valor

    def sumar(self, anio, semana, dep, prov, dist, ubigeo, especie_idx, n):
        dep, prov, dist = self.nombre(dep), self.nombre(prov), self.nombre(dist)
        if not dep:
            # El ubigeo INEI codifica el departamento en sus 2 primeros digitos.
            dep = self.codigos.get(ubigeo[:2], "SIN DEPARTAMENTO")
            prov = prov or "(sin nombre en la fuente)"
            dist = dist or f"(sin nombre, ubigeo {ubigeo})"
            self.recuperados[ubigeo] += n
        self.anual[anio][especie_idx] += n
        for clave in (dep, "PERU"):
            self.semanal[(clave, anio)][especie_idx][semana - 1] += n
        self.dep_anual[(dep, anio)][especie_idx] += n
        self.distrito.setdefault(ubigeo, (dep, prov, dist))
        self.dist_anual[(ubigeo, anio)][especie_idx] += n


def procesar_a(acc, informe):
    """Archivo 2000-2008: una fila por semana y distrito con conteos por especie."""
    ruta = CRUDOS / ARCHIVO_A
    nulos, invalidas, filas, casos = Counter(), 0, 0, 0
    with open(ruta, encoding="utf-8", newline="") as f:
        lector = csv.DictReader(f)
        columnas = lector.fieldnames
        for fila in lector:
            filas += 1
            for col, val in fila.items():
                if val in ("", None):
                    nulos[col] += 1
            try:
                anio, semana = int(fila["ano"]), int(fila["semana"])
                conteos = int(fila["falciparum"] or 0), int(fila["vivax"] or 0)
            except ValueError:
                invalidas += 1
                continue
            if not (2000 <= anio <= 2008 and 1 <= semana <= SEMANAS) or min(conteos) < 0:
                invalidas += 1
                continue
            for i, n in enumerate(conteos):
                if n:
                    acc.sumar(anio, semana, fila["departamento"].strip(), fila["provincia"].strip(),
                              fila["distrito"].strip(), fila["ubigeo"].strip(), i, n)
                    casos += n
    informe.append({"archivo": ARCHIVO_A, "periodo": "2000-2008", "granularidad": "agregado semana-distrito",
                    "columnas": columnas, "filas": filas, "filas_invalidas": invalidas, "casos": casos,
                    "nulos": dict(nulos), "sha256": sha256(ruta), "bytes": ruta.stat().st_size})


def procesar_b(acc, informe):
    """Archivo 2009-2025: un registro por caso notificado (nominal, sin datos de identidad)."""
    ruta = CRUDOS / ARCHIVO_B
    nulos, motivos, filas, casos = Counter(), Counter(), 0, 0
    tipo_edad, ultima_semana = Counter(), defaultdict(int)
    with open(ruta, encoding="utf-8", newline="") as f:
        lector = csv.DictReader(f)
        columnas = lector.fieldnames
        for fila in lector:
            filas += 1
            for col, val in fila.items():
                if val in ("", None):
                    nulos[col] += 1
            especie = CODIGO_ESPECIE.get(fila["diagnostic"].strip())
            try:
                anio, semana, edad = int(fila["ano"]), int(fila["semana"]), int(fila["edad"])
            except ValueError:
                motivos["anio_semana_edad_no_numerico"] += 1
                continue
            if especie is None:
                motivos["diagnostico_no_reconocido"] += 1
                continue
            if not (2009 <= anio <= 2030 and 1 <= semana <= SEMANAS):
                motivos["anio_o_semana_fuera_de_rango"] += 1
                continue
            grupo = grupo_edad(edad, fila["tipo_edad"].strip())
            if grupo is None or edad < 0:
                motivos["edad_fuera_de_rango"] += 1
                continue
            sexo = fila["sexo"].strip()
            if sexo not in ("F", "M"):
                motivos["sexo_no_valido"] += 1
                continue
            dep = acc.nombre(fila["departamento"].strip())
            idx = ESPECIES.index(especie)
            acc.sumar(anio, semana, dep, fila["provincia"].strip(), fila["distrito"].strip(),
                      fila["ubigeo"].strip(), idx, 1)
            if not dep:
                dep = acc.codigos.get(fila["ubigeo"].strip()[:2], "SIN DEPARTAMENTO")
            for clave in (dep, "PERU"):
                acc.edad_sexo[(clave, anio)][grupo][2 * idx + (0 if sexo == "F" else 1)] += 1
            tipo_edad[fila["tipo_edad"].strip()] += 1
            ultima_semana[anio] = max(ultima_semana[anio], semana)
            casos += 1
    informe.append({"archivo": ARCHIVO_B, "periodo": "2009-2025", "granularidad": "nominal (un caso por fila)",
                    "columnas": columnas, "filas": filas, "filas_invalidas": sum(motivos.values()),
                    "motivos_invalidez": dict(motivos), "casos": casos, "nulos": dict(nulos),
                    "tipo_edad": dict(tipo_edad), "ultima_semana_por_anio": dict(sorted(ultima_semana.items())),
                    "sha256": sha256(ruta), "bytes": ruta.stat().st_size})
    return ultima_semana


def main():
    acc, informe = Acumulador(), []
    procesar_a(acc, informe)
    ultima_semana = procesar_b(acc, informe)
    anios = sorted(acc.anual)
    deps = sorted({d for d, _ in acc.dep_anual})

    semanal = {}
    for (dep, anio), (f, v) in acc.semanal.items():
        semanal.setdefault(dep, {})[str(anio)] = {"f": f, "v": v}

    distritos = []
    for ubigeo, (dep, prov, dist) in sorted(acc.distrito.items()):
        serie = {str(a): acc.dist_anual[(ubigeo, a)] for a in anios if (ubigeo, a) in acc.dist_anual}
        distritos.append({"u": ubigeo, "d": dep, "p": prov, "n": dist, "a": serie})

    edad = {}
    for (dep, anio), grupos in acc.edad_sexo.items():
        edad.setdefault(dep, {})[str(anio)] = {g: grupos[g] for _, _, g in GRUPOS_EDAD}

    anio_max = max(anios)
    datos = {
        "meta": {
            "fuente": "MINSA - CDC Peru, Vigilancia epidemiologica de malaria (Plataforma Nacional de Datos Abiertos)",
            "url": URL_DATASET, "licencia": "Open Data Commons Attribution License",
            "fecha_descarga": fecha_descarga(), "anios": [anios[0], anio_max],
            "ultima_semana": ultima_semana.get(anio_max, 0), "anio_nominal_desde": 2009,
            "grupos_edad": [g for _, _, g in GRUPOS_EDAD],
        },
        "anual": {str(a): acc.anual[a] for a in anios},
        "departamentos": deps,
        "dep_anual": {d: {str(a): acc.dep_anual[(d, a)] for a in anios if (d, a) in acc.dep_anual} for d in deps},
        "semanal": semanal,
        "distritos": distritos,
        "edad_sexo": edad,
    }
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / "malaria.json").write_text(json.dumps(datos, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    calidad = {"fecha_proceso": date.today().isoformat(), "archivos": informe,
               "departamento_recuperado_por_ubigeo": dict(acc.recuperados),
               "nombres_con_enie_restituida": {"regla": "U+FFFD -> Ñ en departamento, provincia y distrito",
                                               "nombres": sorted(acc.restituidos)},
               "total_casos": sum(sum(v) for v in acc.anual.values()),
               "regla_publicacion": "solo agregados por semana, distrito, grupo de edad y sexo"}
    (SALIDA / "calidad_datos.json").write_text(json.dumps(calidad, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"anios {anios[0]}-{anio_max}, casos {calidad['total_casos']}, distritos {len(distritos)}, "
          f"departamentos {len(deps)}, ultima semana {anio_max}: {datos['meta']['ultima_semana']}")
    for a in informe:
        print(a["archivo"], a["filas"], "invalidas", a["filas_invalidas"], a.get("motivos_invalidez", ""))


if __name__ == "__main__":
    main()
