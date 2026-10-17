"""Convert the original SolidWorks STL exports into compact GLB files.

Usage: uv run --with trimesh --with numpy --with scipy python -I tools/build_models.py <stl_dir> <out_dir>
Then compress with: npx @gltf-transform/cli meshopt in.glb out.glb
"""
import sys, pathlib
import numpy as np
import trimesh

src, out = map(pathlib.Path, sys.argv[1:3])
for name, stem in [("Croix.STL", "croix"), ("Pied.STL", "pied"), ("plateforme_test.STL", "plateforme")]:
    m = trimesh.load(src / name)
    m.merge_vertices()
    lo, hi = m.bounds
    # Centre on the X/Z axis, base at y = 0 (SolidWorks exports are Y-up, in millimetres).
    m.apply_translation([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
    s = trimesh.graph.smooth_shade(m, angle=np.radians(28))
    s.export(out / f"{stem}.raw.glb", include_normals=True)
    print(stem, len(s.faces), "faces", np.round(s.bounds, 1).tolist())
