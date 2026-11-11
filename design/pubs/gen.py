"""
Visuels de la campagne Facebook / Instagram (docs/CAMPAGNE_RESEAUX.md).
Génère design/pubs/html/*.html puis les images design/pubs/out/*.png avec Chrome sans interface.
Lancer : python design/pubs/gen.py
Règles de vocabulaire : jamais « boutique », « commerce », « supermarché », « carte bancaire », ni de prix par téléphone.
"""
import os, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = ROOT / "design" / "pubs"
HTML = HERE / "html"
OUT = HERE / "out"
HTML.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
PUB = (ROOT / "site" / "public").as_uri()
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

ZEBRA = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='120' viewBox='0 0 240 120'%3E%3Cg fill='%23fff' fill-opacity='0.09'%3E%3Cpath d='M0 8C50 0 90 26 140 18S210 2 240 8V22C205 16 175 34 135 32S55 14 0 22Z'/%3E%3Cpath d='M0 52C60 44 110 66 170 58C200 54 220 60 240 52V64C215 70 195 66 165 72C110 80 55 60 0 64Z'/%3E%3Cpath d='M0 94C40 88 80 104 120 98C160 92 200 108 240 94V108C200 118 160 104 120 112C80 118 40 102 0 108Z'/%3E%3C/g%3E%3C/svg%3E\")"

CSS = f"""
@font-face{{font-family:GS;font-weight:500;src:url({PUB}/fonts/google-sans-latin-500-normal.woff2)}}
@font-face{{font-family:GS;font-weight:700;src:url({PUB}/fonts/google-sans-latin-700-normal.woff2)}}
*{{box-sizing:border-box}}
html,body{{margin:0;width:var(--w);height:var(--h);overflow:hidden}}
body{{font-family:GS;font-weight:500;color:#fff;background:linear-gradient(160deg,#2c6fc6 0%,#3987e5 55%,#4b96ee 100%);position:relative}}
.z{{position:absolute;inset:0;background:{ZEBRA};background-size:420px 210px}}
.brand{{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:16px;font-weight:700;font-size:46px;letter-spacing:-.01em}}
.brand img{{width:64px;height:64px;background:#fff;border-radius:16px;padding:8px}}
h1{{font-weight:700;letter-spacing:-.025em;line-height:1.02;margin:0}}
.sun{{color:#ffc233}}
.chip{{display:inline-block;background:#ffc233;color:#12233f;font-weight:700;border-radius:999px}}
.foot{{position:absolute;left:72px;right:72px;bottom:60px;display:flex;align-items:center;justify-content:space-between;font-size:34px;font-weight:700}}
.foot small{{display:block;font-size:24px;font-weight:500;opacity:.85}}
.phone{{position:absolute;border-radius:58px;background:#0f1c36;padding:16px;box-shadow:0 40px 80px rgba(10,30,70,.45)}}
.phone img{{display:block;width:100%;height:100%;object-fit:cover;object-position:top;border-radius:44px}}
.ticks{{list-style:none;margin:0;padding:0;display:grid;gap:18px;font-size:36px}}
.ticks li{{display:flex;align-items:center;gap:16px}}
.ticks li::before{{content:"";flex:none;width:40px;height:40px;border-radius:50%;background:#1fb57a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12l5 5L20 7'/%3E%3C/svg%3E") center/26px no-repeat}}
.drawing{{position:absolute;left:56px;right:56px;border-radius:28px;overflow:hidden;box-shadow:0 30px 60px rgba(10,30,70,.35);border:6px solid #fff}}
.drawing{{height:600px}}.drawing img{{display:block;width:100%;height:100%;object-fit:cover;object-position:center 40%}}
.tag{{position:absolute;left:28px;top:28px;font-size:34px;font-weight:700;padding:10px 22px;border-radius:12px;color:#fff}}
"""

BRAND = f'<div class="brand"><img src="{PUB}/logo.svg">vitePOS</div>'


# Sans argument : tous les visuels. Avec des noms (python design/pubs/gen.py 10-probleme 10-probleme-story) : seulement ceux-là.
ONLY = set(__import__("sys").argv[1:])


def page(name, w, h, body, extra=""):
    if ONLY and name not in ONLY:
        return
    doc = f"""<!doctype html><html><head><meta charset="utf-8"><style>:root{{--w:{w}px;--h:{h}px}}{CSS}{extra}</style></head>
<body><div class="z"></div>{body}</body></html>"""
    p = HTML / f"{name}.html"
    p.write_text(doc, encoding="utf-8")
    subprocess.run([CHROME, "--headless=new", "--hide-scrollbars", "--disable-gpu", "--force-device-scale-factor=1",
                    f"--window-size={w},{h}", "--virtual-time-budget=4000", f"--screenshot={OUT / (name + '.png')}", p.as_uri()],
                   check=True, capture_output=True)
    print("ok", name)


W, H = 1080, 1350

# 0. Présentation : le tout premier post du profil (règle Instagram : on se présente d'abord).
page("00-presentation", W, H, f"""
<div style="position:absolute;left:0;right:0;top:150px;text-align:center">
  <img src="{PUB}/logo.svg" style="width:150px;height:150px;background:#fff;border-radius:36px;padding:20px;box-shadow:0 24px 50px rgba(10,30,70,.35)">
  <div style="font-size:110px;font-weight:700;letter-spacing:-.03em;margin-top:26px">vitePOS</div>
  <h1 style="font-size:58px;margin:18px 90px 0">La caisse de votre business,<br><span class="sun">sur votre téléphone.</span></h1>
</div>
<div style="position:absolute;left:0;right:0;top:760px;display:flex;justify-content:center">
  <ul class="ticks" style="font-size:38px;gap:24px"><li>Ventes, stock et bénéfice calculés</li><li>Cash ($, €, FC) et mobile money</li><li>Même quand le réseau coupe</li></ul>
</div>
<div class="foot" style="justify-content:center;gap:28px"><span class="chip" style="font-size:32px;padding:12px 28px">Lancement le 9 novembre</span><span>Conçu à Kinshasa</span></div>
""")

# 1. Teaser (6 novembre) : le cahier.
page("01-teaser", W, H, f"""
{BRAND}
<div class="drawing" style="top:180px"><img src="{PUB}/bd/bd-1.webp"></div>
<div style="position:absolute;left:72px;right:72px;top:830px">
  <h1 style="font-size:64px">Le soir, on recompte le cahier…<br><span class="sun">et il manque toujours quelque chose.</span></h1>
  <p style="font-size:36px;margin:30px 0 0;opacity:.95">Et si votre téléphone faisait les comptes à votre place ?</p>
</div>
<div class="foot"><span class="chip" style="font-size:34px;padding:14px 30px">Lundi 9 novembre</span><span>On vous montre</span></div>
""")

# 2. Demain, on lance (8 novembre).
page("02-demain", W, H, f"""
{BRAND}
<div style="position:absolute;left:72px;top:200px;width:560px">
  <span class="chip" style="font-size:30px;padding:10px 24px">Demain · 9 novembre</span>
  <h1 style="font-size:84px;margin-top:28px">vitePOS<br>arrive à<br><span class="sun">Kinshasa.</span></h1>
  <p style="font-size:34px;margin:28px 0 40px;opacity:.95">La caisse de votre business, sur le téléphone que vous avez déjà.</p>
  <ul class="ticks"><li>Ventes, stock, bénéfice</li><li>Cash ($, €, FC) et mobile money</li><li>Même sans réseau</li></ul>
</div>
<div class="phone" style="right:-40px;top:250px;width:420px;height:880px;transform:rotate(5deg)"><img src="{PUB}/captures/tel-caisse.webp"></div>
<div class="foot"><span>Abonnez-vous à la page</span><span style="font-size:30px">viteposrdc.com</span></div>
""")

# 3. Lancement (9 novembre) : post.
LAUNCH_TXT = """
  <span class="chip" style="font-size:32px;padding:10px 26px">vitePOS est là</span>
  <h1 style="font-size:86px;margin-top:30px">Vendez plus vite.<br>Perdez moins.<br><span class="sun">Même sans réseau.</span></h1>
"""
page("03-lancement", W, H, f"""
{BRAND}
<div style="position:absolute;left:72px;top:190px;right:72px">{LAUNCH_TXT}</div>
<div class="phone" style="left:72px;top:640px;width:330px;height:690px;transform:rotate(-4deg)"><img src="{PUB}/captures/tel-caisse.webp"></div>
<div style="position:absolute;left:450px;top:690px;right:60px">
  <ul class="ticks" style="font-size:34px;gap:22px"><li>Cash et mobile money</li><li>Stock calculé tout seul</li><li>Un compte par vendeur</li><li>La caisse tombe juste</li></ul>
  <div style="margin-top:46px;background:#fff;color:#12233f;border-radius:24px;padding:26px 30px">
    <div style="font-size:40px;font-weight:700">Essai gratuit</div>
    <div style="font-size:28px;margin-top:6px;color:#1f63b8;font-weight:700">viteposrdc.com</div>
  </div>
</div>
""")

# 3 bis. Lancement : story (1080 x 1920). Zones de sécurité Instagram : rien d'important dans les 250 px du haut
# (photo du profil, barre de progression) ni dans les 340 px du bas (barre de réponse, bouton).
page("03-lancement-story", 1080, 1920, f"""
{BRAND.replace('class="brand"', 'class="brand" style="top:280px"')}
<div style="position:absolute;left:72px;right:72px;top:400px">{LAUNCH_TXT}</div>
<div class="phone" style="left:50%;top:860px;width:340px;height:620px;margin-left:-170px;overflow:hidden"><img src="{PUB}/captures/tel-caisse.webp"></div>
<div style="position:absolute;left:72px;right:72px;top:1460px;text-align:center">
  <div style="display:inline-block;background:#ffc233;color:#12233f;border-radius:24px;padding:24px 44px;font-size:44px;font-weight:700;box-shadow:0 20px 40px rgba(0,0,0,.25)">Essai gratuit · viteposrdc.com</div>
</div>
""")

# 4. Avant / après (10 novembre) : carrousel de 2 images.
for name, img, label, color, title, sub in (
    ("04-avant", "bd-1", "Avant", "#d32f2f", "On recompte le cahier,<br>et l'argent manque.", "Glissez pour voir la différence →"),
    ("04-apres", "bd-8", "Avec vitePOS", "#11915e", "Chaque vente est notée.<br><span class='sun'>La caisse tombe juste.</span>", "Essai gratuit · viteposrdc.com"),
):
    page(name, W, H, f"""
{BRAND}
<div class="drawing" style="top:190px"><img src="{PUB}/bd/{img}.webp"><span class="tag" style="background:{color}">{label}</span></div>
<div style="position:absolute;left:72px;right:72px;top:860px">
  <h1 style="font-size:70px">{title}</h1>
</div>
<div class="foot"><span>{sub}</span></div>
""")

# 5. Même sans réseau (11 novembre).
page("05-sans-reseau", W, H, f"""
{BRAND}
<div style="position:absolute;left:72px;top:200px;width:560px">
  <span class="chip" style="font-size:30px;padding:10px 24px;background:#fff">Le réseau coupe ?</span>
  <h1 style="font-size:88px;margin-top:28px">Vous<br>continuez<br><span class="sun">à vendre.</span></h1>
  <p style="font-size:34px;margin:30px 0 0;opacity:.95">Ventes, stock et dépenses restent dans le téléphone. Dès qu'internet revient, tout se met à jour.</p>
</div>
<div class="phone" style="right:-30px;top:230px;width:420px;height:880px;transform:rotate(5deg)"><img src="{PUB}/captures/tel-caisse.webp">
  <span style="position:absolute;left:50%;top:-26px;transform:translateX(-50%);background:#12233f;color:#fff;border:4px solid #fff;font-size:28px;font-weight:700;padding:10px 24px;border-radius:999px;white-space:nowrap">● Hors ligne</span></div>
<div class="foot"><span>Pas de vente perdue</span><span style="font-size:30px">viteposrdc.com</span></div>
""")


# 10. Lundi 9 novembre : on ouvre la campagne avec « le problème » (docs/PLAN_CAMPAGNE.md, phase 1). On ne montre pas l'app.
page("10-probleme", W, H, f"""
{BRAND}
<div class="drawing" style="top:180px"><img src="{PUB}/bd/bd-1.webp"></div>
<div style="position:absolute;left:72px;right:72px;top:830px">
  <h1 style="font-size:66px">Ce soir encore,<br><span class="sun">les comptes ne tombent<br>pas juste.</span></h1>
  <p style="font-size:40px;margin:28px 0 0;font-weight:700">Où est passé l'argent ?</p>
</div>
<div class="foot"><span class="chip" style="font-size:32px;padding:12px 28px">Le 20 novembre, on vous montre</span><span style="font-size:28px;opacity:.9">#OuEstPasseLArgent</span></div>
""")

# 10 bis. Story (1080 x 1920) : rien d'important dans les 250 px du haut ni les 300 px du bas (zones d'Instagram).
# L'espace libre sous « Et chez vous ? » accueille l'autocollant « Sondage » ajouté dans Instagram.
page("10-probleme-story", 1080, 1920, f"""
<div class="brand" style="top:270px">{BRAND[len('<div class="brand">'):-len('</div>')]}</div>
<div class="drawing" style="top:380px;height:640px"><img src="{PUB}/bd/bd-1.webp"></div>
<div style="position:absolute;left:72px;right:72px;top:1080px">
  <h1 style="font-size:70px">Ce soir encore,<br><span class="sun">les comptes ne tombent<br>pas juste.</span></h1>
  <p style="font-size:42px;margin:26px 0 0;font-weight:700">Et chez vous ?</p>
</div>
<div style="position:absolute;left:72px;top:1530px"><span class="chip" style="font-size:34px;padding:14px 30px">vitePOS est là pour régler ça</span></div>
""")


# 11. Carrousel d'ouverture (lundi 9 novembre) : 5 images à faire glisser, le problème sans montrer l'app,
# puis l'appel à s'abonner à la page. Le texte de chaque image est court : on doit le lire en 2 secondes.
import json as _json, re as _re
_ICONS = (ROOT / "site" / "src" / "data" / "icons.ts").read_text(encoding="utf-8")


def _icon(name):
    m = _re.search(name + r': (".*?[^\\]")', _ICONS)
    return _json.loads(m.group(1))


IG, FB = _icon("instagram"), _icon("facebook")
CAR = """
.num{position:absolute;right:72px;top:78px;font-size:30px;font-weight:700;opacity:.8}
.swipe{position:absolute;right:72px;bottom:66px;font-size:32px;font-weight:700;display:flex;align-items:center;gap:12px}
.swipe b{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#ffc233;color:#12233f;font-size:38px}
.txt{position:absolute;left:72px;right:72px}
.txt h1{font-size:64px;text-wrap:balance}
.txt p{font-size:40px;margin:26px 0 0;font-weight:700}
.social{display:flex;gap:18px;justify-content:center;margin-top:48px}
.social span{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.16);border-radius:999px;padding:16px 32px;font-size:36px;font-weight:700}
.social svg{width:40px;height:40px}
"""


def slide(n, body):
    swipe = '<div class="swipe">Glissez <b>→</b></div>' if n < 5 else ""
    brand = BRAND if n < 5 else ""
    page(f"11-carrousel-{n}", W, H, f'{brand}<div class="num">{n} / 5</div>{body}{swipe}', CAR)


slide(1, f"""
<div class="drawing" style="top:180px"><img src="{PUB}/bd/bd-7.webp" style="object-position:center 30%"></div>
<div class="txt" style="top:830px"><h1>Vous n'êtes pas au magasin…<br><span class="sun">et vous ne savez pas<br>ce qui s'y passe.</span></h1></div>
""")
slide(2, """
<div class="txt" style="top:400px">
  <h1 style="font-size:90px;line-height:1.06"><span style="white-space:nowrap">Combien avez-vous</span><br>gagné cette semaine&nbsp;?</h1>
  <h1 style="font-size:96px;line-height:1.04;margin-top:50px" class="sun">Pas vendu&nbsp;:<br>gagné.</h1>
  <p style="font-size:46px;margin-top:70px;opacity:.95;font-weight:500">Si vous hésitez,<br>vous n'êtes pas seul.</p>
</div>
""")
# Textes validés (docs/TEXTES_DOCUMENTS.md) : « Avant », « Le soir, plus besoin de recompter », « Dormez tranquille »,
# « Votre activité, sous vos yeux », et le message du propriétaire : bien gérer n'est pas un luxe.
slide(3, f"""
<div class="drawing" style="top:180px"><img src="{PUB}/bd/bd-1.webp"></div>
<div class="txt" style="top:830px"><h1>Le soir, vous recomptez le cahier, les billets et le stock.</h1>
<p class="sun" style="font-size:46px">Et il manque toujours quelque chose,<br>sans savoir où.</p></div>
""")
slide(4, f"""
<div class="drawing" style="top:180px"><img src="{PUB}/bd/bd-6.webp" style="object-position:center 35%"></div>
<div class="txt" style="top:830px"><h1>Et si, le soir, vous n'aviez<br>plus besoin de recompter&nbsp;?</h1>
<p class="sun" style="font-size:64px;margin-top:34px">Dormez tranquille.</p></div>
""")
slide(5, f"""
<div style="position:absolute;left:0;right:0;top:190px;text-align:center">
  <h1 style="font-size:80px;margin:0 60px;line-height:1.06">Bien gérer son activité,<br>ce n'est pas un luxe.</h1>
  <img src="{PUB}/logo.svg" style="width:150px;height:150px;background:#fff;border-radius:36px;padding:19px;margin-top:70px;box-shadow:0 24px 50px rgba(10,30,70,.35)">
  <h1 style="font-size:104px;margin:34px 60px 0;line-height:1" class="sun">vitePOS est là.</h1>
  <p style="font-size:48px;margin:26px 60px 0;font-weight:700">Pour régler ça, sur votre téléphone.</p>
  <div class="social" style="margin-top:56px"><span>{IG}@viteposrdc</span><span>{FB}Vitepos RDC</span></div>
  <p style="font-size:36px;margin:22px 0 0;font-weight:500;opacity:.95">Abonnez-vous pour tout découvrir.</p>
</div>
<div class="foot" style="justify-content:center"><span class="chip" style="font-size:36px;padding:16px 36px">Essai gratuit · app.viteposrdc.com</span></div>
""")
