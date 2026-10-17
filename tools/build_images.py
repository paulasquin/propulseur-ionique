"""Resize and convert the source images (blog, Drive, NASA) into web assets.

Usage: uv run --with pillow python -I tools/build_images.py <src_root> <site_root>
<src_root> holds img/ (blog), drive/photos/ (Drive) and nasa/ (NASA Visible Earth).
"""
import sys, pathlib
from PIL import Image, ImageOps

src, site = map(pathlib.Path, sys.argv[1:3])

def save(im, dest, size, q=80):
    im = ImageOps.exif_transpose(im).convert("RGB")
    im.thumbnail((size, size), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=q, method=6)

BLOG = {
    "test_batterie_9V_vide_reduit3.jpg": "pile-9v-vide",
    "multiplicateur_de_tension_cascade.PNG": "schema-cascade",
    "oscillo_GBF_reduit.jpg": "oscillo-gbf",
    "circuit_multimetre_reduit.jpg": "circuit-cascade",
    "multimetre_basse_frequence_reduit.jpg": "cascade-20hz",
    "mostiko.JPG": "elevateur-7kv",
    "IMG_20150507_095236-1.jpg": "diviseur-tension",
    "IMG_20150504_122427.jpg": "montage-test-2",
    "Plein_Nord-ouest-dessus.png": "plateforme-rendu",
    "X-ray_Nord-dessus.PNG": "plateforme-xray-dessus",
    "X-ray_Nord-ouest-dessus.PNG": "plateforme-xray",
    "X-ray_Pignon_aiguille.png": "plateforme-xray-aiguille",
    "IMG_20150531_103244-reduit.jpg": "plateforme-imprimee",
    "IMG_20150531_103330-reduit.jpg": "plateforme-dessus",
    "IMG_20150617_145730.jpg": "extraction-cloche",
    "IMG_20150916_142849.jpg": "gel-couche",
    "IMG_20150916_143011.jpg": "gel-polyacrylate",
    "IMG_20150916_143451.jpg": "gel-humide",
    "IMG_20150916_143556.jpg": "gel-sale",
    "IMG_20150917_152332.jpg": "gel-vide",
    "haut_45_face.PNG": "croix-rendu",
    "coté.PNG": "croix-cote",
    "dessus.PNG": "croix-dessus",
    "dessous.PNG": "croix-dessous",
    "pièce_2_45.PNG": "socle-rendu",
    "pièce_2_dessous.PNG": "socle-dessous",
    "pivot_supermag.PNG": "pivot-supermag",
    "pivot_crookes.PNG": "pivot-crookes",
    "schéma_pivot.PNG": "schema-pivot",
}
for name, stem in BLOG.items():
    save(Image.open(src / "img" / name), site / "assets/img" / f"{stem}.webp", 1400)

PHOTOS = {
    "IMG_20151007_161435.jpg": "proto-face",
    "IMG_20151007_161448.jpg": "proto-trois-quarts",
    "IMG_20151007_161504.jpg": "aiguille-socle",
    "IMG_20151014_162220.jpg": "cloche-pompe",
    "IMG_20151014_163818.jpg": "supermag",
    "IMG_20151014_165813.jpg": "supermag-proche",
    "IMG_20151014_170556.jpg": "proto-socle",
    "IMG_20151014_170623.jpg": "proto-dessus",
    "IMG_20151014_170632.jpg": "proto-table",
    "IMG_20151014_172005.jpg": "cloche-large",
    "IMG_20151014_172041.jpg": "cloche-proche",
    "IMG_20151126_154418.jpg": "labo",
    "IMG_20151126_154437.jpg": "proto-cable-dessus",
    "IMG_20151126_154509.jpg": "grille",
    "IMG_20151126_154525.jpg": "unite-propulsion",
}
for name, stem in PHOTOS.items():
    im = Image.open(src / "drive/photos" / name)
    save(im, site / "assets/photos" / f"{stem}.webp", 1600, 78)
    save(im, site / "assets/photos" / f"{stem}-s.webp", 640, 74)

for i in range(1, 16):
    save(Image.open(src / "img" / f"Présentation_finale_-_Diapo_{i}.jpg"), site / "assets/slides" / f"diapo-{i:02d}.webp", 960, 84)

tex = site / "assets/tex"
tex.mkdir(parents=True, exist_ok=True)
day = Image.open(src / "nasa/world.topo.bathy.200412.3x5400x2700.jpg").convert("RGB").resize((4096, 2048), Image.LANCZOS)
day.save(tex / "earth-day.jpg", quality=82, optimize=True, progressive=True)
night = Image.open(src / "nasa/dnb_land_ocean_ice.2012.3600x1800.jpg").convert("RGB").resize((4096, 2048), Image.LANCZOS)
night.save(tex / "earth-night.jpg", quality=82, optimize=True, progressive=True)
Image.open(src / "nasa/cloud_combined_2048.jpg").convert("L").save(tex / "earth-clouds.jpg", quality=80, optimize=True)
print("done")
