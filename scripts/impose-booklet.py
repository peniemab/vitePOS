"""
Met la brochure (4 pages A5, dans l'ordre de lecture) en page pour l'imprimante : 2 pages par face sur une feuille A4
à l'italienne. Recto : page 4 | page 1. Verso : page 2 | page 3. Imprimée recto-verso (retourner sur le bord court)
puis pliée en deux, la feuille donne le livret dans le bon ordre.
Usage : python scripts/impose-booklet.py <brochure A5.pdf> <sortie A4.pdf>   (nécessite : pip install pikepdf)
"""
import sys

import pikepdf
from pikepdf import Rectangle

A4_W, A4_H = 841.89, 595.28  # A4 à l'italienne, en points
src_path, out_path = sys.argv[1], sys.argv[2]

src = pikepdf.open(src_path)
if len(src.pages) != 4:
    sys.exit(f"{src_path} : 4 pages attendues, {len(src.pages)} trouvées")

out = pikepdf.new()
half = A4_W / 2
for left, right in ((3, 0), (1, 2)):
    page = out.add_blank_page(page_size=(A4_W, A4_H))
    page.add_overlay(src.pages[left], Rectangle(0, 0, half, A4_H))
    page.add_overlay(src.pages[right], Rectangle(half, 0, A4_W, A4_H))
out.save(out_path)
print(out_path, "2 pages A4")
