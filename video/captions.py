"""Write the on-screen text (ASS) of the 30 s vertical video, in French and English.

    python3 captions.py   # -> captions_fr.ass, captions_en.ass
"""
CX, Y = 540, 1290  # text block centre (clear of Instagram's top and bottom overlays)

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Big,Ion Unbounded Medium,64,&H00F8EEE8,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,-1,0,1,0,0,5,60,60,0,1
Style: Kicker,Ion Mono Medium,30,&H00FFD66F,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,6,0,1,0,0,5,60,60,0,1
Style: Sub,Ion Inter Medium,38,&H00D3BFB4,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,60,60,0,1
Style: Number,Ion Unbounded Medium,170,&H00FFD66F,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,-4,0,1,0,0,5,60,60,0,1
Style: Title,Ion Unbounded Light,118,&H00F8EEE8,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,-4,0,1,0,0,5,60,60,0,1
Style: Url,Ion Mono Medium,36,&H00FFD66F,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,5,60,60,0,1
Style: Shade,Arial,20,&H00000000,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

ACCENT = r"{\c&HFFD66F&}"
WHITE = r"{\c&HF8EEE8&}"


def ts(s):
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{sec:05.2f}"


def line(start, end, style, text, y, rise=36, fade=(220, 200)):
    """One text element: a soft dark halo layer (for legibility) + the text, rising slightly."""
    move = rf"\move({CX},{y + rise},{CX},{y},0,420)"
    halo = rf"{{\an5{move}\fad({fade[0]},{fade[1]})\blur14\bord10\3c&H000000&\3a&H70&\1a&HFF&}}{text}"
    main = rf"{{\an5{move}\fad({fade[0]},{fade[1]})}}{text}"
    return [f"Dialogue: 0,{ts(start)},{ts(end)},{style},,0,0,0,,{halo}",
            f"Dialogue: 1,{ts(start)},{ts(end)},{style},,0,0,0,,{main}"]


def block(start, end, big=None, kicker=None, sub=None, number=None, dy=0):
    out = []
    y = Y + dy
    if kicker:
        out += line(start, end, "Kicker", kicker, y - 150, rise=20)
    if number:
        out += line(start, end, "Number", number, y - 20, rise=50)
        y += 110
    if big:
        out += line(start + 0.06, end, "Big", big.replace("\n", r"\N"), y)
    if sub:
        out += line(start + 0.18, end, "Sub", sub, y + (120 if big and "\n" in big else 90) if big else y, rise=24)
    return out


def ending(start, end, title, sub, url):
    shade = rf"{{\an7\pos(0,0)\fad(500,0)\1a&H50&\p1}}m 0 0 l 1080 0 l 1080 1920 l 0 1920{{\p0}}"
    out = [f"Dialogue: 0,{ts(start)},{ts(end)},Shade,,0,0,0,,{shade}"]
    out += line(start + 0.15, end, "Title", title.replace("\n", r"\N"), 1040, rise=50, fade=(400, 0))
    out += line(start + 0.45, end, "Sub", sub, 1265, rise=24, fade=(300, 0))
    out += line(start + 0.65, end, "Url", url, 1335, rise=20, fade=(300, 0))
    return out


TEXT = {
    "fr": [
        (0.4, 4.8, dict(kicker="TIPE · CLASSE PRÉPA · 2015", big="J'ai construit un\npropulseur ionique")),
        (5.1, 7.3, dict(big="Comment pousser\nun satellite…\navec des ions ?")),
        (7.8, 9.9, dict(kicker="LE PRINCIPE", big="Des ions arrachés\nà de l'eau salée")),
        (10.2, 12.4, dict(big=f"Éjectés à\n{ACCENT}347 km/s")),
        (12.7, 14.9, dict(kicker="LE PROTOTYPE", big="Imprimé en 3D,\ncouche par couche")),
        (15.2, 17.4, dict(big="Le modèle original\nde 2015")),
        (17.7, 19.9, dict(big=f"Allumage des\n{ACCENT}4 propulseurs")),
        (20.2, 22.4, dict(big="Sous une\ncloche à vide")),
        (22.6, 24.9, dict(kicker="LE RÉSULTAT", number="6,7 µN", sub="de poussée mesurée", dy=80)),
        (25.3, 27.3, dict(big="Déjà dans l'espace", sub="Deep Space 1, Dawn, BepiColombo, Starlink…")),
        ("end", f"propulseur\n{ACCENT}ionique", "Tout le projet en 3D", "ionic.paulasquin.com"),
    ],
    "en": [
        (0.4, 4.8, dict(kicker="PREP-CLASS PROJECT · 2015", big="I built an\nion thruster")),
        (5.1, 7.3, dict(big="How do you push\na satellite…\nwith ions?")),
        (7.8, 9.9, dict(kicker="THE PRINCIPLE", big="Ions torn away\nfrom salt water")),
        (10.2, 12.4, dict(big=f"Ejected at\n{ACCENT}347 km/s")),
        (12.7, 14.9, dict(kicker="THE PROTOTYPE", big="3D-printed,\nlayer by layer")),
        (15.2, 17.4, dict(big="My original\n2015 model")),
        (17.7, 19.9, dict(big=f"Igniting the\n{ACCENT}4 thrusters")),
        (20.2, 22.4, dict(big="Under a\nvacuum bell jar")),
        (22.6, 24.9, dict(kicker="THE RESULT", number="6.7 µN", sub="of measured thrust", dy=80)),
        (25.3, 27.3, dict(big="Already in space", sub="Deep Space 1, Dawn, BepiColombo, Starlink…")),
        ("end", f"{ACCENT}ion{WHITE}\nthruster", "The whole project in 3D", "ionic.paulasquin.com"),
    ],
}

for lang, items in TEXT.items():
    events = []
    for it in items:
        if it[0] == "end":
            events += ending(27.6, 30.0, it[1], it[2], it[3])
        else:
            events += block(it[0], it[1], **it[2])
    open(f"captions_{lang}.ass", "w").write(HEAD + "\n".join(events) + "\n")
    print(f"captions_{lang}.ass", len(events), "events")
