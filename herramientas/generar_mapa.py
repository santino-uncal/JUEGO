# Genera data/mapa-mundo.js a partir de herramientas/mapa-mundo.png (la imagen que mandó el usuario).
# Uso (desde la carpeta del juego):   py herramientas/generar_mapa.py
#
# 1. Cada píxel de la imagen se clasifica por su color: mar (blanco), tierra de nadie (gris) o un pueblo.
#    La imagen no tiene nombres escritos; los píxeles de borde (mezcla de dos colores) toman el color de al lado.
#    (La imagen nueva está apenas corrida respecto de la vieja: AJUSTE la acomoda para que las coordenadas
#    de capitales y cordilleras sigan valiendo.)
# 2. La imagen se pasa a hexágonos (ESCALA hexágonos por píxel; las filas impares corridas medio hexágono).
# 3. El terreno (llanura, bosque, colinas, montaña) se inventa: cordilleras dibujadas a mano
#    (en coordenadas de la imagen) + ruido para que bosques y colinas queden en manchas.
import math
import random
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw

AQUI = Path(__file__).parent
ESCALA = 1.25
FILA = math.sqrt(3) / 2
RADIO = 1 / math.sqrt(3)

# Color de cada cosa en la imagen → letra en MAPA_DUENOS
PALETA = [
    ((255, 255, 255), "~"),  # mar
    ((188, 188, 188), "-"),  # tierra de nadie
    ((255, 127, 39), "P"),   # Imperio persa
    ((0, 0, 160), "O"),      # Confederación india
    ((0, 128, 0), "J"),      # Dinastía Zhou
    ((128, 64, 64), "V"),    # Reino de Kush
    ((128, 128, 192), "F"),  # Reino de Damot
    ((128, 0, 64), "B"),     # Galos
    ((0, 255, 64), "G"),     # Tribus germánicas
    ((255, 128, 255), "T"),  # Celtíberos
    ((255, 174, 201), "Z"),  # Lusitanos
    ((255, 242, 0), "W"),    # Celtas (Britania)
    ((0, 255, 255), "D"),    # Tribus dacias
    ((163, 73, 164), "K"),   # Cartago
    ((255, 255, 128), "Q"),  # Tribus bereberes
    ((64, 128, 128), "M"),   # Númidas
    ((136, 0, 21), "C"),     # Galos cisalpinos
    ((128, 0, 128), "Y"),    # Ilirios
    ((255, 128, 128), "N"),  # Peonios
    ((128, 128, 255), "X"),  # Tracios
    ((185, 122, 87), "H"),   # Liga griega
    ((255, 201, 14), "E"),   # Etruscos
    ((239, 228, 176), "U"),  # Umbros
    ((34, 177, 76), "R"),    # Latinos (pasan a ser Roma)
    ((0, 162, 232), "S"),    # Samnitas
    ((220, 68, 60), "R"),    # Roma (el puntito rojo dentro del Lacio)
    ((112, 146, 190), "A"),  # Mesapios
    ((181, 230, 29), "I"),   # Ítalos (los de Sicilia pasan a ser sículos, "L")
]

# La imagen nueva (833 x 424) en las coordenadas de la vieja (826 x 426):
# píxel viejo (x, y) = píxel nuevo (x * sx + tx, y * sy + ty). Calculado comparando las costas.
AJUSTE = (1.000625, 0.99875, -3.5, -0.75)
ANCHO_VIEJO, ALTO_VIEJO = 826, 426

# Capitales (en píxeles de la imagen). Se busca la casilla del pueblo más cercana a ese punto.
# Tienen que coincidir con x, y de ENEMIGOS en data/ciudad.js (el programa las imprime al final).
CAPITALES = {
    "R": (159, 145), "U": (163, 136), "E": (152, 133), "S": (169, 146), "C": (143, 121),
    "A": (178, 148), "I": (179, 160), "L": (167, 174), "K": (147, 184), "H": (218, 170),
    "P": (242, 163), "B": (100, 110), "Y": (195, 138), "N": (210, 135), "T": (60, 143),
    "Z": (22, 165), "W": (78, 62), "G": (135, 80), "D": (233, 106), "X": (240, 127),
    "M": (90, 198), "Q": (150, 215), "V": (275, 285), "F": (320, 330), "O": (590, 265),
    "J": (760, 195),
}

# Parches a mano (polígonos en píxeles de la imagen, letra del pueblo). Con la imagen sin nombres casi no hacen falta:
# solo el Lacio, para que Roma arranque con el mismo tamaño que antes (en la imagen es un puntito).
PARCHES = [
    ("R", [(154, 144), (159, 142), (162, 143), (162, 146), (160, 147), (155, 148)]),  # Lacio (hasta la costa)
]

# Cordilleras: líneas (en píxeles de la imagen) y su ancho en píxeles
CORDILLERAS = [
    ([(64, 133), (82, 132), (100, 135)], 2.5),                       # Pirineos
    ([(122, 130), (124, 118), (138, 109), (158, 110), (176, 113)], 3),  # Alpes
    ([(146, 125), (158, 133), (168, 145), (176, 156), (179, 165)], 1.6),  # Apeninos
    ([(176, 117), (192, 132), (204, 148)], 2.2),                     # Alpes dináricos
    ([(206, 92), (222, 86), (244, 94), (250, 104), (236, 113), (222, 112)], 2),  # Cárpatos
    ([(216, 128), (246, 126)], 1.6),                                 # Balcanes
    ([(205, 146), (212, 162)], 1.6),                                 # Pindo
    ([(40, 205), (70, 198), (100, 192), (125, 190)], 2.5),           # Atlas
    ([(38, 140), (60, 150), (80, 160)], 1.5),                        # Sistema central (Hispania)
    ([(340, 130), (360, 140), (378, 150)], 2.5),                     # Cáucaso
    ([(238, 178), (262, 176), (290, 172), (310, 165)], 2.2),         # Tauro
    ([(320, 170), (340, 190), (360, 210), (385, 232)], 2.8),         # Zagros
    ([(372, 166), (395, 167), (415, 170)], 2),                       # Elburz
    ([(430, 180), (455, 174), (485, 170)], 2.6),                     # Hindu Kush
    ([(485, 170), (500, 190), (520, 205)], 2.6),                     # Karakórum
    ([(520, 210), (545, 220), (580, 230), (620, 240), (660, 240)], 3.5),  # Himalaya
    ([(500, 140), (540, 140), (590, 150), (620, 152)], 2.5),         # Tian Shan
    ([(390, 15), (392, 50), (396, 90)], 1.6),                        # Urales
    ([(132, 8), (140, 22), (150, 40)], 2),                           # Montes escandinavos
    ([(300, 305), (315, 320), (330, 345)], 3),                       # Etiopía
    ([(518, 315), (526, 340), (532, 370)], 1.6),                     # Ghats
    ([(715, 200), (750, 198), (790, 200)], 1.8),                     # Qinling
    ([(560, 30), (600, 40), (660, 50)], 2),                          # Altái
]
# Mesetas altas: mucha montaña y colina (rectángulos en píxeles)
MESETAS = [(560, 185, 700, 235), (440, 150, 500, 175)]
# Zonas secas: casi sin bosque (desierto, estepa)
SECAS = [(0, 205, 330, 300), (290, 200, 400, 300), (360, 160, 470, 230), (400, 90, 650, 175), (640, 100, 760, 165)]


def cerca_color(c):
    mejor, dmin = None, 1e9
    for col, letra in PALETA:
        d = sum((a - b) ** 2 for a, b in zip(c, col))
        if d < dmin:
            mejor, dmin = letra, d
    return mejor, math.sqrt(dmin)


def rellenar(letra, w, h):
    """Los píxeles sin color toman el color conocido más cercano."""
    cola = deque((x, y) for y in range(h) for x in range(w) if letra[y][x] is not None)
    while cola:
        x, y = cola.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and letra[ny][nx] is None:
                letra[ny][nx] = letra[y][x]
                cola.append((nx, ny))


def clasificar(im):
    w, h = im.size
    px = im.load()
    letra = [[None] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            l, d = cerca_color(px[x, y])
            # el gris de la tierra de nadie se confunde con los bordes borrosos de las costas: se pide más parecido
            if d < (14 if l == "-" else 30):
                letra[y][x] = l
    rellenar(letra, w, h)
    # Manchitas sueltas (restos de letras o de bordes): se borran y se vuelven a rellenar,
    # salvo que sea el pedazo más grande de ese pueblo
    visto = [[False] * w for _ in range(h)]
    manchas, mayor = [], {}
    for y in range(h):
        for x in range(w):
            if visto[y][x]:
                continue
            l, pila, celdas = letra[y][x], [(x, y)], []
            visto[y][x] = True
            while pila:
                cx, cy = pila.pop()
                celdas.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not visto[ny][nx] and letra[ny][nx] == l:
                        visto[ny][nx] = True
                        pila.append((nx, ny))
            manchas.append((l, celdas))
            mayor[l] = max(mayor.get(l, 0), len(celdas))
    for l, celdas in manchas:
        if len(celdas) < 10 and len(celdas) < mayor[l] and l != "~":
            for x, y in celdas:
                letra[y][x] = None
    rellenar(letra, w, h)
    # Parches a mano
    capa = Image.new("L", (w, h), 0)
    dibujo = ImageDraw.Draw(capa)
    for i, (_, puntos) in enumerate(PARCHES):
        dibujo.polygon(puntos, fill=i + 1)
    cp = capa.load()
    for y in range(h):
        for x in range(w):
            if cp[x, y] and not (PARCHES[cp[x, y] - 1][0] == "R" and letra[y][x] == "~"):   # Roma no se mete en el mar
                letra[y][x] = PARCHES[cp[x, y] - 1][0]
    # Sicilia: los ítalos de la isla son sículos
    for y in range(h):
        for x in range(w):
            if letra[y][x] == "I" and y >= 168 and x < 177:
                letra[y][x] = "L"
    return letra


def vecinos(x, y, W, H):
    dirs = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]] if y & 1 else [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]]
    for dx, dy in dirs:
        if 0 <= x + dx < W and 0 <= y + dy < H:
            yield x + dx, y + dy


def a_imagen(hx, hy):
    """Centro del hexágono, en píxeles de la imagen."""
    return (hx + 0.5 + 0.5 * (hy & 1)) / ESCALA, (RADIO + hy * FILA) / ESCALA


def a_hex(px, py):
    hy = round((py * ESCALA - RADIO) / FILA)
    hx = round(px * ESCALA - 0.5 - 0.5 * (hy & 1))
    return hx, hy


def ruido(semilla, tam):
    """Ruido suave: una grilla de valores al azar interpolada."""
    rnd = random.Random(semilla)
    g = {}

    def v(i, j):
        if (i, j) not in g:
            g[(i, j)] = rnd.random()
        return g[(i, j)]

    def f(x, y):
        x, y = x / tam, y / tam
        i, j = math.floor(x), math.floor(y)
        fx, fy = x - i, y - j
        fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
        a = v(i, j) + (v(i + 1, j) - v(i, j)) * fx
        b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * fx
        return a + (b - a) * fy
    return f


def dist_segmento(px, py, a, b):
    (ax, ay), (bx, by) = a, b
    dx, dy = bx - ax, by - ay
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def main():
    nueva = Image.open(AQUI / "mapa-mundo.png").convert("RGB")
    sx, sy, tx, ty = AJUSTE
    im = nueva.transform((ANCHO_VIEJO, ALTO_VIEJO), Image.AFFINE, (sx, 0, tx, 0, sy, ty), resample=Image.NEAREST,
                         fillcolor=(255, 255, 255))
    w, h = im.size
    letra = clasificar(im)
    W = math.ceil(w * ESCALA)
    H = math.floor((h * ESCALA - 2 * RADIO) / FILA) + 1

    duenos = []
    for hy in range(H):
        fila = []
        for hx in range(W):
            px, py = a_imagen(hx, hy)
            fila.append(letra[min(h - 1, int(py))][min(w - 1, int(px))])
        duenos.append(fila)

    # Capitales: la casilla del pueblo más cercana al punto elegido
    capitales = {}
    for l, (px, py) in CAPITALES.items():
        cx, cy = a_hex(px, py)
        mejor = min(((abs(x - cx) + abs(y - cy), x, y) for y in range(max(0, cy - 15), min(H, cy + 16))
                     for x in range(max(0, cx - 15), min(W, cx + 16)) if duenos[y][x] == l), default=None)
        if not mejor:
            # (por ejemplo Roma: los latinos quedaron tapados por las letras) → la tierra más cercana
            mejor = min((abs(x - cx) + abs(y - cy), x, y) for y in range(cy - 5, cy + 6)
                        for x in range(cx - 5, cx + 6) if duenos[y][x] != "~")
            print(f"Aviso: {l} no tiene territorio cerca de {px},{py}; se le da la casilla {mejor[1]},{mejor[2]}")
            duenos[mejor[2]][mejor[1]] = l
        capitales[l] = (mejor[1], mejor[2])
    # Roma arranca con su casilla y las de alrededor
    rx, ry = capitales["R"]
    for x, y in vecinos(rx, ry, W, H):
        if duenos[y][x] != "~":
            duenos[y][x] = "R"

    # Terreno
    bosque, colina, rugoso, torcer = ruido(1, 6), ruido(2, 5), ruido(3, 2.5), ruido(4, 9)
    terreno = []
    for hy in range(H):
        fila = []
        for hx in range(W):
            if duenos[hy][hx] == "~":
                fila.append("~")
                continue
            px, py = a_imagen(hx, hy)
            # cercanía a una cordillera: 1 en la cresta, 0 lejos (el ancho cambia con el ruido para que no sea una línea pareja)
            monte = 0
            ensanche = 0.6 + 0.9 * torcer(hx, hy)
            for linea, ancho in CORDILLERAS:
                a2 = ancho * 2.2 * ensanche
                for a, b in zip(linea, linea[1:]):
                    d = dist_segmento(px, py, a, b)
                    if d < a2:
                        monte = max(monte, 1 - d / a2)
            for x0, y0, x1, y1 in MESETAS:
                # elipse con borde suave
                cx, cy, rx, ry = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2
                e = math.hypot((px - cx) / rx, (py - cy) / ry) * (0.8 + 0.4 * torcer(hx, hy))
                if e < 1:
                    monte = max(monte, 0.75 * (1 - e) + 0.25)
            seco = any(x0 <= px <= x1 and y0 <= py <= y1 for x0, y0, x1, y1 in SECAS)
            r = rugoso(hx, hy)
            alto = monte * (0.55 + 0.7 * r)
            if alto > 0.5:
                t = "m"
            elif alto > 0.2:
                t = "h"
            elif colina(hx, hy) > (0.74 if seco else 0.7):
                t = "h"
            elif not seco and bosque(hx, hy) > (0.55 if py < 110 else 0.62):
                t = "f"
            elif seco and bosque(hx, hy) > 0.9:
                t = "f"
            else:
                t = "."
            fila.append(t)
        terreno.append(fila)
    # Las capitales no quedan en montaña
    for x, y in capitales.values():
        if terreno[y][x] == "m":
            terreno[y][x] = "h"

    with open(AQUI.parent / "data" / "mapa-mundo.js", "w", encoding="utf8") as f:
        f.write("// Mapa del mundo antiguo (sale de la imagen herramientas/mapa-mundo.png). Cada letra es un hexágono.\n")
        f.write("// Las filas impares están corridas medio hexágono a la derecha.\n")
        f.write("// Se genera con herramientas/generar_mapa.py: no tocarlo a mano.\n")
        f.write("// MAPA_TERRENO:  ~ mar   . llanura   f bosque   h colinas   m montaña\n")
        f.write("// MAPA_DUENOS:   R Roma, - tierra de nadie, ~ mar, y la letra de cada pueblo (ver \"letra\" en ENEMIGOS)\n")
        for nombre, filas in (("MAPA_TERRENO", terreno), ("MAPA_DUENOS", duenos)):
            f.write(f"const {nombre} = [\n")
            for fila in filas:
                f.write(f'  "{"".join(fila)}",\n')
            f.write("];\n")
    print(f"Mapa de {W} x {H}")
    for l, (x, y) in capitales.items():
        print(l, f"x: {x}, y: {y}")
    # Vista previa para revisar
    colores = {l: c for c, l in PALETA}
    colores["L"] = (120, 200, 0)
    prev = Image.new("RGB", (W, H))
    for y in range(H):
        for x in range(W):
            prev.putpixel((x, y), colores[duenos[y][x]])
    for x, y in capitales.values():
        prev.putpixel((x, y), (255, 0, 0))
    prev.save(AQUI / "vista-duenos.png")
    tc = {"~": (60, 120, 200), ".": (200, 220, 150), "f": (30, 120, 40), "h": (170, 150, 90), "m": (110, 80, 60)}
    prev2 = Image.new("RGB", (W, H))
    for y in range(H):
        for x in range(W):
            prev2.putpixel((x, y), tc[terreno[y][x]])
    prev2.save(AQUI / "vista-terreno.png")


if __name__ == "__main__":
    main()
