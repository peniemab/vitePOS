"""
Allège les PDF du site imprimés par Chrome : les captures y sont gardées sans perte (plusieurs Mo) ;
on les réencode en JPEG, sans toucher au texte. Le manuel passe d'environ 6,5 Mo à 3 Mo.
Usage : python scripts/shrink-pdf.py site/public/*.pdf   (nécessite : pip install pikepdf)
"""
import io
import sys

import pikepdf
from pikepdf import Name, PdfImage

for path in sys.argv[1:]:
    pdf = pikepdf.open(path, allow_overwriting_input=True)
    done = 0
    for obj in pdf.objects:
        if not isinstance(obj, pikepdf.Stream) or obj.get("/Subtype") != Name.Image:
            continue
        # Seulement les grandes images opaques (les captures), pas les logos ni les icônes.
        if obj.get("/Filter") != Name.FlateDecode or int(obj.get("/Width", 0)) < 300:
            continue
        if obj.get("/SMask") is not None or obj.get("/BitsPerComponent") != 8:
            continue
        try:
            im = PdfImage(obj).as_pil_image()
        except Exception:
            continue
        if im.mode != "RGB":
            continue
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=85, optimize=True)
        if buf.tell() >= len(obj.read_raw_bytes()):
            continue
        obj.write(buf.getvalue(), filter=Name.DCTDecode)
        if "/DecodeParms" in obj:
            del obj["/DecodeParms"]
        done += 1
    pdf.save(path, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    print(f"{path} : {done} capture(s) en JPEG")
