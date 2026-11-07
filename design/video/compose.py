"""Monte la vidéo de démonstration à partir des images filmées par preview/video.mjs.

Format vertical 1080 × 1920 (site et Reels / stories) : le texte de chaque étape en haut, l'app dans un téléphone,
puis une image de fin (logo, essai gratuit, adresse de l'app). Sans son : tout se comprend en lisant.
Sorties : design/video/out/demo-fr-1080.mp4 (réseaux), site/public/video/demo-fr.mp4 (720 × 1280, léger) et
site/public/video/demo-fr.jpg (image affichée avant la lecture).
Usage : python design/video/compose.py   (nécessite pip install pillow imageio-ffmpeg)
"""
import json
import os
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
VID = os.path.join(ROOT, "design", "video")
OUT = os.path.join(VID, "out")
SITE = os.path.join(ROOT, "site", "public", "video")
FONT = os.path.join(ROOT, "node_modules", "@fontsource", "google-sans", "files", "google-sans-latin-{}-normal.woff")
W, H, FPS = 1080, 1920, 30
END = 3.6  # image de fin, en secondes
NAVY, SKY, SUN, RED = (26, 43, 76), (47, 125, 225), (255, 196, 46), (255, 77, 82)

data = json.load(open(os.path.join(VID, "timeline.json"), encoding="utf-8"))
frames, captions, duration = data["frames"], data["captions"], data["duration"]


def font(weight, size):
    return ImageFont.truetype(FONT.format(weight), size)


def background():
    """Dégradé bleu nuit vers bleu ciel, comme le site."""
    bg = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(bg)
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=tuple(round(NAVY[i] + (SKY[i] - NAVY[i]) * k * 0.85) for i in range(3)))
    return bg


# Téléphone : écran de 780 × 1688 réduit, avec un cadre sombre et des coins arrondis.
SCREEN_H = 1180
SCREEN_W = round(780 * SCREEN_H / 1688)
BEZEL = 16
PX = (W - SCREEN_W) // 2
PY = 520
mask = Image.new("L", (SCREEN_W, SCREEN_H), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, SCREEN_W - 1, SCREEN_H - 1], radius=46, fill=255)

BASE = background()
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle(
    [PX - BEZEL, PY - BEZEL + 24, PX + SCREEN_W + BEZEL, PY + SCREEN_H + BEZEL + 24], radius=64, fill=(0, 0, 0, 110)
)
BASE.paste(shadow.filter(ImageFilter.GaussianBlur(28)), (0, 0), shadow.filter(ImageFilter.GaussianBlur(28)))
ImageDraw.Draw(BASE).rounded_rectangle(
    [PX - BEZEL, PY - BEZEL, PX + SCREEN_W + BEZEL, PY + SCREEN_H + BEZEL], radius=62, fill=(12, 20, 38)
)

# Pied : petit logo et adresse du site.
logo = Image.open(os.path.join(ROOT, "public", "pwa-512.png")).convert("RGBA")
small = logo.resize((64, 64), Image.LANCZOS)
foot = font(500, 38)
label = "viteposrdc.com"
lw = foot.getlength(label)
fx = round((W - 64 - 18 - lw) / 2)
BASE.paste(small, (fx, 1790), small)
ImageDraw.Draw(BASE).text((fx + 82, 1822), label, font=foot, fill=(255, 255, 255), anchor="lm")


def wrap(text, f, width):
    lines, line = [], ""
    for word in text.split():
        test = (line + " " + word).strip()
        if f.getlength(test) <= width:
            line = test
        else:
            lines.append(line)
            line = word
    return lines + [line]


def caption_layer(text):
    """Texte d'une étape, centré au-dessus du téléphone. Un numéro d'étape (« 1. ») va dans une pastille jaune."""
    layer = Image.new("RGBA", (W, PY - BEZEL), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    num = None
    if text[:2].rstrip(".").isdigit() and text[1] == ".":
        num, text = text[0], text[3:]
    f = font(700, 66)
    lines = wrap(text, f, 920)
    lh = 80
    block = len(lines) * lh + (110 if num else 0)
    y = (PY - BEZEL - block) // 2 + 40
    if num:
        d.ellipse([W / 2 - 44, y, W / 2 + 44, y + 88], fill=SUN)
        d.text((W / 2, y + 46), num, font=font(700, 56), fill=NAVY, anchor="mm")
        y += 110
    for line in lines:
        d.text((W / 2, y + lh / 2), line, font=f, fill=(255, 255, 255), anchor="mm")
        y += lh
    return layer


CAPS = [(c["from"], caption_layer(c["text"])) for c in captions]


def end_card():
    img = background()
    d = ImageDraw.Draw(img)
    big = logo.resize((260, 260), Image.LANCZOS)
    img.paste(big, ((W - 260) // 2, 560), big)
    d.text((W / 2, 920), "vitePOS", font=font(700, 120), fill=(255, 255, 255), anchor="mm")
    d.text((W / 2, 1040), "La caisse de votre business", font=font(500, 54), fill=(225, 234, 250), anchor="mm")
    d.rounded_rectangle([W / 2 - 250, 1140, W / 2 + 250, 1250], radius=55, fill=SUN)
    d.text((W / 2, 1197), "Essai gratuit", font=font(700, 56), fill=NAVY, anchor="mm")
    d.text((W / 2, 1350), "app.viteposrdc.com", font=font(700, 62), fill=(255, 255, 255), anchor="mm")
    return img


END_IMG = end_card()
cache = {}


def screen(i):
    if i not in cache:
        cache.clear() if len(cache) > 6 else None
        cache[i] = Image.open(os.path.join(VID, "frames", frames[i]["file"])).convert("RGB").resize((SCREEN_W, SCREEN_H), Image.LANCZOS)
    return cache[i]


def frame_at(t):
    if t >= duration:
        k = min(1, (t - duration) / 0.5)
        last = frame_at(duration - 0.001)
        return Image.blend(last, END_IMG, k)
    # Image filmée : on passe en fondu rapide vers la suivante (le film est à ~8 images par seconde).
    i = max(j for j, f in enumerate(frames) if f["t"] <= t) if t >= frames[0]["t"] else 0
    img = screen(i)
    if i + 1 < len(frames):
        t1 = frames[i + 1]["t"]
        k = (t - (t1 - 0.1)) / 0.1
        if 0 < k < 1:
            img = Image.blend(img, screen(i + 1), k)
    out = BASE.copy()
    out.paste(img, (PX, PY), mask)
    # Texte de l'étape, avec un fondu d'entrée.
    idx = max((j for j, (f, _) in enumerate(CAPS) if f <= t), default=0)
    start, layer = CAPS[idx]
    a = max(0, min(1, (t - start) / 0.3)) if idx else 1
    if a < 1:
        layer = layer.copy()
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * a)))
    out.paste(layer, (0, 0), layer)
    return out


def encode(path, size, crf):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    cmd = [
        imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-vf", f"scale={size[0]}:{size[1]}:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", path,
    ]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


total = duration + END
n = round(total * FPS)
big = encode(os.path.join(OUT, "demo-fr-1080.mp4"), (1080, 1920), 23)
web = encode(os.path.join(SITE, "demo-fr.mp4"), (720, 1280), 30)
for k in range(n):
    img = frame_at(k / FPS)
    raw = img.tobytes()
    big.stdin.write(raw)
    web.stdin.write(raw)
    if abs(k / FPS - 2.0) < 0.5 / FPS:
        img.resize((720, 1280), Image.LANCZOS).save(os.path.join(SITE, "demo-fr.jpg"), quality=82)
for p in (big, web):
    p.stdin.close()
    p.wait()
for f in (os.path.join(OUT, "demo-fr-1080.mp4"), os.path.join(SITE, "demo-fr.mp4"), os.path.join(SITE, "demo-fr.jpg")):
    print(os.path.relpath(f, ROOT), round(os.path.getsize(f) / 1e6, 2), "Mo")
print(f"{total:.1f} s")
