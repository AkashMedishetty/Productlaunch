"""Download the CC0 Poly Haven assets the previz uses into previz/assets/.

Run:  python3 previz/fetch_assets.py
"""
import json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "assets")
UA = {"User-Agent": "previz-client"}

HDRIS = ["kloofendal_43d_clear_puresky"]
TEXTURES = ["dirty_carpet", "pavement_02", "concrete_floor_01", "fabric_pattern_07", "leather_white",
            "plywood", "velour_velvet", "metal_plate", "asphalt_02"]
MODELS = ["sofa_02", "sofa_03", "potted_plant_02", "potted_plant_01", "tree_small_02", "jacaranda_tree",
          "coffee_table_round_01", "modern_arm_chair_01", "covered_car"]
TEX_MAPS = {"Diffuse": "diff", "nor_gl": "nor", "Rough": "rough", "arm": "arm"}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r, open(path + ".part", "wb") as f:
        while True:
            chunk = r.read(1 << 20)
            if not chunk:
                break
            f.write(chunk)
    os.replace(path + ".part", path)
    print(f"  {os.path.relpath(path, DEST)}  {os.path.getsize(path) / 1e6:.1f} MB")


def main():
    for a in HDRIS:
        f = get_json(f"https://api.polyhaven.com/files/{a}")
        fetch(f["hdri"]["4k"]["hdr"]["url"], os.path.join(DEST, "hdri", f"{a}_4k.hdr"))
    for a in TEXTURES:
        f = get_json(f"https://api.polyhaven.com/files/{a}")
        got = False
        for key, short in TEX_MAPS.items():
            if key in f and "2k" in f[key] and "jpg" in f[key]["2k"]:
                if short == "rough" and "arm" in f:
                    continue
                fetch(f[key]["2k"]["jpg"]["url"], os.path.join(DEST, "tex", a, f"{short}.jpg"))
                got = True
        if not got:
            print("  !! no maps for", a, list(f.keys()))
    for a in MODELS:
        f = get_json(f"https://api.polyhaven.com/files/{a}")
        g = f["gltf"]["1k"]["gltf"] if "1k" in f["gltf"] else f["gltf"][sorted(f["gltf"])[0]]["gltf"]
        d = os.path.join(DEST, "models", a)
        fetch(g["url"], os.path.join(d, f"{a}.gltf"))
        for rel, inc in g.get("include", {}).items():
            fetch(inc["url"], os.path.join(d, rel))


if __name__ == "__main__":
    main()
    print("done")
