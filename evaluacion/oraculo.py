"""Oraculo de prueba para la correccion funcional (metrica IF-02).

Recalcula, directamente desde los CSV oficiales y SIN reutilizar el codigo de
pipeline/procesar.py, los valores que el dashboard debe mostrar en un conjunto
de escenarios. Las pruebas E2E comparan la interfaz con estos valores.

Uso: python evaluacion/oraculo.py
"""

import csv
import json
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CRUDOS = RAIZ / "datos" / "crudos"
SALIDA = RAIZ / "evaluacion" / "oraculo" / "esperados.json"
# Codigo INEI de departamento (2 primeros digitos del ubigeo); se usa solo cuando la fuente no trae el nombre.
INEI = {"01": "AMAZONAS", "02": "ANCASH", "03": "APURIMAC", "04": "AREQUIPA", "05": "AYACUCHO", "06": "CAJAMARCA",
        "07": "CALLAO", "08": "CUSCO", "09": "HUANCAVELICA", "10": "HUANUCO", "11": "ICA", "12": "JUNIN",
        "13": "LA LIBERTAD", "14": "LAMBAYEQUE", "15": "LIMA", "16": "LORETO", "17": "MADRE DE DIOS",
        "18": "MOQUEGUA", "19": "PASCO", "20": "PIURA", "21": "PUNO", "22": "SAN MARTIN", "23": "TACNA",
        "24": "TUMBES", "25": "UCAYALI"}
ESCENARIOS = [  # (anio, departamento, especie)
    (2025, "PERU", "todas"), (2024, "PERU", "vivax"), (2023, "PERU", "falciparum"), (2014, "LORETO", "todas"),
    (2022, "AMAZONAS", "todas"), (2019, "JUNIN", "falciparum"), (2005, "PERU", "todas"), (2008, "TUMBES", "vivax"),
]


def leer():
    """Devuelve una lista de tuplas (anio, semana, dep, distrito, ubigeo, especie, n, edad_anios|None, sexo|None)."""
    filas = []
    with open(CRUDOS / "datos_abiertos_vigilancia_malaria_2000_2008.csv", encoding="utf-8", newline="") as f:
        for r in csv.reader(f):
            if r[0] == "ano":
                continue
            anio, sem, dep, _prov, dist, ub, fa, vi = r
            dep = dep or INEI[ub[:2]]
            if int(fa):
                filas.append((int(anio), int(sem), dep, dist, ub, "falciparum", int(fa), None, None))
            if int(vi):
                filas.append((int(anio), int(sem), dep, dist, ub, "vivax", int(vi), None, None))
    with open(CRUDOS / "datos_abiertos_vigilancia_malaria_2009_2025.csv", encoding="utf-8", newline="") as f:
        cab = None
        for r in csv.reader(f):
            if cab is None:
                cab = {c: i for i, c in enumerate(r)}
                continue
            dx = r[cab["diagnostic"]]
            esp = "falciparum" if dx == "B50" else "vivax" if dx == "B51" else None
            edad, tipo = int(r[cab["edad"]]), r[cab["tipo_edad"]]
            anios = edad if tipo == "A" else 0
            if esp is None or anios < 0 or anios > 200 or r[cab["sexo"]] not in ("F", "M"):
                continue
            dep = r[cab["departamento"]] or INEI[r[cab["ubigeo"]][:2]]
            filas.append((int(r[cab["ano"]]), int(r[cab["semana"]]), dep, r[cab["distrito"]], r[cab["ubigeo"]],
                          esp, 1, anios, r[cab["sexo"]]))
    return filas


def esperado(filas, anio, dep, esp):
    sel = lambda r, a: r[0] == a and (dep == "PERU" or r[2] == dep)
    toma = lambda r: esp == "todas" or r[5] == esp
    casos = sum(r[6] for r in filas if sel(r, anio) and toma(r))
    previo = sum(r[6] for r in filas if sel(r, anio - 1) and toma(r)) if anio > 2000 else None
    falci = sum(r[6] for r in filas if sel(r, anio) and r[5] == "falciparum")
    total_ambas = sum(r[6] for r in filas if sel(r, anio))
    semanas = defaultdict(int)
    for r in filas:
        if sel(r, anio) and toma(r):
            semanas[r[1]] += r[6]
    pico = max(semanas, key=lambda s: (semanas[s], -s)) if semanas else None
    if dep == "PERU":
        por = defaultdict(int)
        for r in filas:
            if r[0] == anio and toma(r):
                por[r[2]] += r[6]
    else:
        por = defaultdict(int)
        for r in filas:
            if sel(r, anio) and toma(r):
                por[r[4]] += r[6]
    lider = max(por, key=por.get) if por else None
    edad = {"F": 0, "M": 0}
    for r in filas:
        if sel(r, anio) and toma(r) and r[8]:
            edad[r[8]] += 1
    return {
        "anio": anio, "dep": dep, "esp": esp, "casos": casos, "previo": previo,
        "variacion_pct": round((casos - previo) / previo * 100, 1) if previo else None,
        "pf_pct": round(falci / total_ambas * 100, 1) if total_ambas else None,
        "lider_casos": por[lider] if lider else 0,
        "pico_semana": pico, "pico_casos": semanas[pico] if pico else 0,
        "semanas_con_casos": sum(1 for v in semanas.values() if v > 0),
        "mujeres": edad["F"] if anio >= 2009 else None, "hombres": edad["M"] if anio >= 2009 else None,
        "distritos_con_casos": len({r[4] for r in filas if sel(r, anio) and toma(r)}),
    }


def main():
    filas = leer()
    datos = [esperado(filas, *e) for e in ESCENARIOS]
    serie = defaultdict(lambda: [0, 0])
    for r in filas:
        serie[r[0]][0 if r[5] == "falciparum" else 1] += r[6]
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps({"escenarios": datos, "serie_anual": {str(k): v for k, v in sorted(serie.items())}},
                                 indent=1, ensure_ascii=False), encoding="utf-8")
    for d in datos:
        print(d)


if __name__ == "__main__":
    main()
