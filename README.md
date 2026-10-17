# Propulseur ionique

Static site (GitHub Pages) presenting my 2014-2016 *classe préparatoire* TIPE project: designing, 3D-printing and measuring a small gridded electrostatic ion thruster under a high-school vacuum bell jar. Content comes from the original French blog, [propulseur-ionique.blogspot.com](https://propulseur-ionique.blogspot.com), and is available in French and English.

Live at https://ionic.paulasquin.com.

## Languages

An inline script in `<head>` picks the language before first paint: `?lang=fr|en`, then the visitor's saved choice (`localStorage`), then `navigator.languages` (French for French speakers, English otherwise). The FR/EN switch in the navigation reloads with `?lang=` and keeps the scroll position.

- French is the default text of `index.html` (elements tagged `data-i18n`, `data-i18n-aria`, `data-i18n-alt`).
- `js/i18n.js` holds the English replacements (`STATIC_EN`) and the strings used by scripts in both languages (`UI`, via `t()`), plus locale-aware number formatting (`nf()`).
- `js/content.js` (French) and `js/content.en.js` (English) hold the editorial content.

## Structure

- `index.html`, `css/style.css` — page and styles.
- `js/main.js` — page orchestration (Lenis smooth scroll, GSAP ScrollTrigger, journal, slides, lightbox).
- `js/content.js` — editorial content (experiments, timeline, results, missions, slides). `VIDEOS_PUBLIC` shows the experiment videos once they are public on YouTube.
- `js/measures.js` — the original measurements (generated, see below).
- `js/stage/` — the fixed WebGL stage (three.js) and its four scroll-driven acts: `orbit.js` (CubeSat over the night Earth), `principle.js` (how a gridded thruster works, with the voltage/ion lab), `prototype.js` (the real prototype from the SolidWorks STL files) and `space.js` (Hohmann transfer vs ion spiral).
- `js/viewer.js`, `js/minis.js`, `js/charts.js` — inline 3D viewer, small animations and SVG charts of the journal.
- `assets/models/*.glb` — the original STL exports, converted and meshopt-compressed.
- `tools/` — scripts that rebuilt the assets from the source files (Drive STL/CSV exports, blog images, NASA textures).

Libraries are loaded from jsDelivr (three.js 0.186 via an import map, GSAP 3.15, Lenis); there is no build step.

## Local preview

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Append `?debug` to expose the stage as `window.__ionic`, and `?lang=en` to force English.

Shaders must stay NaN-free: on hardware GPUs `pow()` of a negative base returns NaN and the bloom pass spreads it over the whole frame (software renderers hide this). Clamp every `pow()` base.

## Rebuilding assets

```bash
uv run --with trimesh --with numpy --with scipy --with networkx python -I tools/build_models.py <stl_dir> assets/models
npx @gltf-transform/cli meshopt assets/models/croix.raw.glb assets/models/croix.glb   # same for pied, plateforme
uv run --with pillow python -I tools/build_images.py <src_root> .
python3 -I tools/build_data.py <data_dir> > js/measures.js
```

## Credits

Earth textures: NASA Visible Earth (Blue Marble, Black Marble). 3D models, photos and measurements: Paul Asquin.
