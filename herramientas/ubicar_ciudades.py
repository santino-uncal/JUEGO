# Ubica en el mapa las ciudades de cada pueblo (además de su capital).
# Para cada ciudad se pone su latitud y longitud reales; el programa calcula dónde caería
# en el mapa a partir de la capital del pueblo y busca la casilla más cercana de ese pueblo
# (que no sea montaña ni esté pegada a otra ciudad). Imprime las líneas "ciudades" para data/ciudad.js.
# Uso: python herramientas/ubicar_ciudades.py   (volver a correrlo si se regenera el mapa)
import re, math, os

AQUI = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(AQUI, "..", "data", "mapa-mundo.js"), encoding="utf8").read()
datos = open(os.path.join(AQUI, "..", "data", "ciudad.js"), encoding="utf8").read()

def arreglo(nombre):
    m = re.search(r"const " + nombre + r" = \[(.*?)\];", src, re.S)
    return re.findall(r'"([^"]*)"', m.group(1))

TER, DUE = arreglo("MAPA_TERRENO"), arreglo("MAPA_DUENOS")
ALTO, ANCHO = len(DUE), len(DUE[0])

# Capitales: letra -> (x, y), leídas de ENEMIGOS
CAP = {}
for m in re.finditer(r'(\w+):\s*\{[^}]*?letra: "(\w)"[^}]*?x: (\d+), y: (\d+)', datos):
    CAP[m.group(2)] = (int(m.group(3)), int(m.group(4)))

def cubo(x, y):
    q = x - (y - (y & 1)) // 2
    return q, y, -q - y
def distancia(a, b):
    p, q = cubo(*a), cubo(*b)
    return max(abs(p[0] - q[0]), abs(p[1] - q[1]), abs(p[2] - q[2]))

# Por pueblo: latitud y longitud de la capital, casillas por grado (x, y) y sus ciudades
PUEBLOS = {
    "U": ((43.35, 12.58), (6.6, 9.7), [("Spoletium", 42.73, 12.74), ("Sarsina", 43.92, 12.14)]),
    "E": ((42.02, 12.40), (6.6, 9.7), [("Tarquinia", 42.25, 11.76), ("Volaterrae", 43.40, 10.86)]),
    "S": ((41.49, 14.47), (6.6, 9.7), [("Aesernia", 41.60, 14.23), ("Malventum", 41.13, 14.78)]),
    "C": ((45.46, 9.19), (6.6, 9.7), [("Felsina", 44.49, 11.34), ("Brixia", 45.54, 10.21), ("Taurasia", 45.07, 7.69)]),
    "A": ((40.63, 17.64), (6.6, 9.7), [("Brundisium", 40.63, 17.94), ("Hydruntum", 40.15, 18.49)]),
    "L": ((41.75, 12.65), (6.6, 9.7), [("Tibur", 41.96, 12.80), ("Lavinium", 41.66, 12.47)]),
    "I": ((39.30, 16.25), (6.6, 9.7), [("Petelia", 39.25, 17.00), ("Henna", 37.57, 14.28)]),
    "K": ((36.85, 10.32), (6.6, 9.7), [("Caralis", 39.22, 9.12), ("Lilibeo", 37.80, 12.43), ("Leptis Magna", 32.64, 14.29)]),
    "H": ((37.98, 23.73), (6.6, 9.7), [("Siracusa", 37.07, 15.29), ("Esparta", 37.07, 22.43), ("Tarento", 40.47, 17.24)]),
    "P": ((38.48, 28.04), (8, 13), [("Menfis", 29.85, 31.25), ("Babilonia", 32.54, 44.42), ("Persépolis", 29.93, 52.89), ("Bactra", 36.76, 66.90)]),
    "B": ((46.92, 4.04), (6.6, 9.7), [("Lutecia", 48.85, 2.35), ("Gergovia", 45.71, 3.13), ("Burdigala", 44.84, -0.58)]),
    "Y": ((42.07, 19.51), (6.6, 9.7), [("Rhizon", 42.51, 18.69), ("Delminium", 43.70, 17.20)]),
    "N": ((41.72, 21.75), (6.6, 9.7), [("Stobi", 41.55, 21.97), ("Naissus", 43.32, 21.90)]),
    "T": ((41.81, -2.44), (6.6, 9.7), [("Toletum", 39.86, -4.02), ("Bílbilis", 41.38, -1.60), ("Salmantica", 40.96, -5.66)]),
    "Z": ((38.72, -9.14), (6.6, 9.7), [("Conímbriga", 40.10, -8.49), ("Ebora", 38.57, -7.91)]),
    "W": ((51.89, 0.90), (6.6, 9.7), [("Calleva", 51.36, -1.08), ("Eboracum", 53.96, -1.08), ("Tara", 53.58, -6.60)]),
    "G": ((52.00, 8.90), (6.6, 9.7), [("Treva", 53.55, 10.00), ("Mattium", 51.17, 9.30), ("Marobudum", 50.00, 14.40)]),
    "D": ((45.62, 23.31), (6.6, 9.7), [("Porolissum", 47.18, 23.15), ("Buridava", 45.10, 24.30), ("Piroboridava", 45.80, 27.20)]),
    "X": ((42.62, 25.39), (6.6, 9.7), [("Kabyle", 42.55, 26.48), ("Filipópolis", 42.15, 24.75)]),
    "M": ((36.36, 6.61), (6.6, 9.7), [("Siga", 35.27, -1.37), ("Thugga", 36.42, 9.22), ("Hippo Regius", 36.88, 7.75)]),
    "Q": ((26.50, 13.00), (6.6, 9.7), [("Cidamus", 30.13, 9.50), ("Augila", 29.10, 21.30), ("Amonio", 29.20, 25.50)]),
    "V": ((18.50, 31.80), (12, 14), [("Meroe", 16.94, 33.75), ("Kerma", 19.60, 30.40), ("Buhen", 21.90, 31.30)]),
    "F": ((14.30, 39.00), (14, 19), [("Adulis", 15.26, 39.66), ("Malao", 10.43, 45.01), ("Aksum", 14.13, 38.72)]),
    "O": ((25.60, 85.10), (9.6, 6), [("Taxila", 33.74, 72.79), ("Ujjayini", 23.18, 75.78), ("Kausambi", 25.34, 81.39), ("Tamralipta", 22.30, 87.90)]),
    "J": ((34.62, 112.45), (6, 10), [("Haojing", 34.26, 108.90), ("Linzi", 36.80, 118.30), ("Ji", 39.90, 116.40), ("Ying", 30.40, 112.20)]),
}

SEPARACION = 3        # casillas como mínimo entre dos ciudades
todas = [(196, 207)] + list(CAP.values())   # Roma y las capitales
salida = {}
for letra, ((la0, lo0), (sx, sy), ciudades) in PUEBLOS.items():
    cx, cy = CAP[letra]
    casillas = [(x, y) for y in range(ALTO) for x in range(ANCHO) if DUE[y][x] == letra and TER[y][x] not in "~m"]
    salida[letra] = []
    for nombre, la, lo in ciudades:
        meta = (cx + (lo - lo0) * sx, cy - (la - la0) * sy)
        libres = [c for c in casillas if all(distancia(c, o) >= SEPARACION for o in todas)]
        mejor = min(libres, key=lambda c: (c[0] - meta[0]) ** 2 + (c[1] - meta[1]) ** 2)
        lejos = math.hypot(mejor[0] - meta[0], mejor[1] - meta[1])
        todas.append(mejor)
        salida[letra].append((nombre, mejor, lejos))

for letra, lista in salida.items():
    txt = ", ".join(f'{{ nombre: "{n}", x: {x}, y: {y} }}' for n, (x, y), _ in lista)
    aviso = " ".join(f"[{n}: quedó a {d:.0f} casillas de donde iba]" for n, _, d in lista if d > 6)
    print(f"{letra}: ciudades: [{txt}],  {aviso}")
