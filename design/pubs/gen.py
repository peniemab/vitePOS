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


def page(name, w, h, body, extra=""):
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
