"""
Met un livret A5 (4, 8, 12… pages, dans l'ordre de lecture) en page pour l'imprimante : 2 pages par face sur des
feuilles A4 à l'italienne. Pour 4 pages : recto 4 | 1, verso 2 | 3. Pour 8 pages : feuille 1 recto 8 | 1, verso 2 | 7,
feuille 2 recto 6 | 3, verso 4 | 5. Imprimer recto-verso (retourner sur le bord court), poser les feuilles l'une
dans l'autre (la première dehors), plier en deux : le livret est dans le bon ordre.
Usage : python scripts/impose-booklet.py <livret A5.pdf> <sortie A4.pdf>   (nécessite : pip install pikepdf)
"""
import sys

import pikepdf
from pikepdf import Rectangle

A4_W, A4_H = 841.89, 595.28  # A4 à l'italienne, en points
src_path, out_path = sys.argv[1], sys.argv[2]

src = pikepdf.open(src_path)
n = len(src.pages)
if n == 0 or n % 4:
    sys.exit(f"{src_path} : il faut un multiple de 4 pages, {n} trouvées")

# Faces dans l'ordre d'impression : (page de gauche, page de droite), numérotées à partir de 0.
faces = []
for k in range(n // 4):
    faces.append((n - 1 - 2 * k, 2 * k))  # recto
    faces.append((2 * k + 1, n - 2 - 2 * k))  # verso

out = pikepdf.new()
half = A4_W / 2
for left, right in faces:
    page = out.add_blank_page(page_size=(A4_W, A4_H))
    page.add_overlay(src.pages[left], Rectangle(0, 0, half, A4_H))
    page.add_overlay(src.pages[right], Rectangle(half, 0, A4_W, A4_H))
out.save(out_path)
print(out_path, len(faces), "pages A4")
