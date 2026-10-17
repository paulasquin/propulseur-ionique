# Instagram video (30 s, 1080×1920)

Vertical teaser of the site, in French and English. The 3D footage is rendered from the live site in capture mode (`?capture`: full quality, UI hidden), frame by frame, on an ephemeral Modal GPU with a virtual clock.

```bash
MODAL_PROFILE=photomate modal run capture.py            # clean.mp4: 3D only, 900 frames at 30 fps
MODAL_PROFILE=photomate modal run capture.py --only 5,6 # re-render some shots (splice with ffmpeg)
uv run --with numpy --with scipy python music.py         # music.wav: synthesised, no licence involved
curl the variable fonts into fonts/ (Unbounded, Inter, JetBrains Mono from google/fonts), then
uv run --with fonttools python make_fonts.py             # static instances libass can match
./compose.sh                                             # out/propulseur-ionique-fr.mp4, out/ion-thruster-en.mp4
```

The choreography (`SHOTS` in `capture.py`), the on-screen text (`captions.py`) and the music (`music.py`) share the same grid: 96 BPM, one bar = 2.5 s, one shot per bar.
