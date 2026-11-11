"""Quality proof: THE IGNITION at the reveal moment, from the audience, path-traced.

Run:  blender -b -P previz/hero.py -- [--samples 160] [--w 1920 --h 1080] [--eevee] [--cam seat|centre|close]
Two products (5 x 5 ft and 7 x 7 ft footprints; heights ASSUMED) under one ground-supported goalpost.
"""
import bpy, math, sys, os, time
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import venue as V
import fx
from venue import P, FT, DECK_H, box, tube, text, truss, link, collection, mat

PRODUCTS = (dict(name="01", x=-10.5, y=-11.0, size=5.0, h=5.0), dict(name="02", x=9.5, y=-11.0, size=7.0, h=6.0))
PLINTH_H = 1.2
LIFT = 10.5          # how far the covers have been hoisted at this moment (ft)
GOAL_H = 20.0        # goalpost height above the deck (ft)
T_FX = 1.1           # seconds since the reveal cue


def product(c, m, p):
    """Stand-in for the unknown product: a machined graphite form with a lit seam, on a white plinth."""
    x, y, s, z = p["x"], p["y"], p["size"] / 2, DECK_H
    box(c, "plinth", x - s - 0.7, x + s + 0.7, y - s - 0.7, y + s + 0.7, z + 0.14, z + PLINTH_H, m["plinth"], 0.02)
    box(c, "plinth_shadow_gap", x - s - 0.55, x + s + 0.55, y - s - 0.55, y + s + 0.55, z, z + 0.14, m["black"])
    warm = mat("plinth_edge_light", (1, 0.6, 0.2), 0.4, emit=(1.0, 0.55, 0.16), strength=30.0)
    box(c, "plinth_underglow", x - s - 0.62, x + s + 0.62, y + s + 0.56, y + s + 0.6, z + 0.03, z + 0.11, warm)
    body = mat("product_silver", (0.62, 0.64, 0.67), 0.26, 1.0, coat=0.5)
    zp = z + PLINTH_H
    box(c, "product_lower", x - s, x + s, y - s, y + s, zp, zp + p["h"] * 0.58, body, 0.09)
    box(c, "product_seam", x - s + 0.12, x + s - 0.12, y - s + 0.12, y + s - 0.12, zp + p["h"] * 0.58, zp + p["h"] * 0.60, warm)
    box(c, "product_upper", x - s + 0.25, x + s - 0.25, y - s + 0.25, y + s - 0.25, zp + p["h"] * 0.60, zp + p["h"], body, 0.14)
    text(c, "plinth_label", f"PRODUCT {p['name']}", P(x, y + s + 0.705, z + PLINTH_H * 0.55), 0.085, m["ink"], spacing=1.7)


def cover(c, m, p, lift):
    """Rigid branded sleeve, hoisted clear on two chain hoists."""
    x, y, s = p["x"], p["y"], p["size"] / 2 + 0.45
    z0 = DECK_H + PLINTH_H + lift
    ch = p["h"] + 0.9
    skin = V.pbr("cover_skin", "fabric_pattern_07", 4.0, tint=(0.035, 0.04, 0.055), bump=0.3)
    for (x0, x1, y0, y1) in ((-s, s, s - 0.06, s), (-s, s, -s, -s + 0.06), (-s, -s + 0.06, -s, s), (s - 0.06, s, -s, s)):
        box(c, "cover_panel", x + x0, x + x1, y + y0, y + y1, z0, z0 + ch, skin)
    box(c, "cover_lid", x - s, x + s, y - s, y + s, z0 + ch, z0 + ch + 0.06, skin)
    for sx in (-s, s):
        for sy in (-s, s):
            box(c, "cover_frame", x + sx - 0.07, x + sx + 0.07, y + sy - 0.07, y + sy + 0.07, z0 - 0.02, z0 + ch + 0.08, m["steel"], 0.006)
    box(c, "cover_hem", x - s - 0.03, x + s + 0.03, y + s - 0.02, y + s + 0.03, z0 - 0.02, z0 + 0.1, m["steel"])
    text(c, "cover_brand", V.BRAND, P(x, y + s + 0.02, z0 + ch * 0.56), 0.05 * p["size"], m["whiteink"], spacing=1.1)
    box(c, "cover_rule", x - s * 0.5, x + s * 0.5, y + s, y + s + 0.015, z0 + ch * 0.4, z0 + ch * 0.4 + 0.05, m["ledaccent"])
    for sx in (-s * 0.6, s * 0.6):
        tube(c, "hoist_chain", [P(x + sx, y, z0 + ch), P(x + sx, y, DECK_H + GOAL_H - 0.9)], 0.011, m["steel_dark"])
        box(c, "hoist_motor", x + sx - 0.36, x + sx + 0.36, y - 0.3, y + 0.3, DECK_H + GOAL_H - 1.7, DECK_H + GOAL_H - 0.5, m["black"], 0.04)
        box(c, "hoist_clamp", x + sx - 0.12, x + sx + 0.12, y - 0.12, y + 0.12, DECK_H + GOAL_H - 0.5, DECK_H + GOAL_H - 0.2, m["steel_dark"])


def build(m):
    c = collection("ignition_hero")
    for p in PRODUCTS:
        product(c, m, p)
        cover(c, m, p, LIFT)
    # ground-supported goalpost spanning both products (no fly grid outdoors)
    for sx in (-20.5, -0.4, 20.5):
        truss(c, "goal_post", P(sx, -11, DECK_H + 0.1), P(sx, -11, DECK_H + GOAL_H), m["steel"], 0.4, 0.028)
        box(c, "goal_base", sx - 1.5, sx + 1.5, -12.5, -9.5, DECK_H, DECK_H + 0.1, m["steel_dark"], 0.005)
    truss(c, "goal_header", P(-20.5, -11, DECK_H + GOAL_H), P(20.5, -11, DECK_H + GOAL_H), m["steel"], 0.4, 0.028)
    # touch pedestal + lit floor conduit running to both plinths
    amber = mat("ignite_amber", (1.0, 0.42, 0.06), 0.4, emit=(1.0, 0.40, 0.05), strength=45.0)
    z = DECK_H
    box(c, "pedestal", 16.2, 17.8, -3.6, -2.4, z, z + 3.3, m["plinth"], 0.02)
    box(c, "pedestal_top", 16.1, 17.9, -3.7, -2.3, z + 3.3, z + 3.42, m["black"], 0.008)
    box(c, "touch_pad_lit", 16.5, 17.5, -3.4, -2.6, z + 3.42, z + 3.44, amber)
    text(c, "pedestal_label", "TOUCH TO IGNITE", P(17.0, -2.385, z + 2.3), 0.065, m["ink"], spacing=1.5)
    for (x0, x1, y0, y1) in ((16.9, 17.1, -6.6, -3.6), (-10.6, 17.1, -6.8, -6.6), (-10.6, -10.4, -7.8, -6.6), (9.4, 9.6, -6.9, -6.6)):
        box(c, "conduit", x0 - 0.07, x1 + 0.07, y0 - 0.07, y1 + 0.07, z, z + 0.045, m["steel"])
        box(c, "conduit_lit", x0, x1, y0, y1, z + 0.045, z + 0.07, amber)
    # effects at T_FX seconds after the cue
    f = collection("fx")
    fx.low_fog(f, -28, 28, -19.8, 0.5, DECK_H, height=3.4, density=0.85)
    fx.low_fog(f, -26, 26, 0.3, 4.5, 0.05, height=2.6, density=0.22, name="fog_spill", seed=4.0)
    for p in PRODUCTS:
        s = p["size"] / 2 + 1.5
        for sx in (-s, s):
            fx.co2_jet(f, p["x"] + sx, p["y"] + 0.5, DECK_H, height=15, t=T_FX)
    for i, x in enumerate((-26, -19.5, 19.5, 26)):
        fx.spark_fountain(f, x, -1.6, DECK_H, height=15, count=650, t=T_FX, seed=40 + i)
    for i, p in enumerate(PRODUCTS):
        fx.confetti(f, p["x"] - 13, p["x"] + 13, -17, 3, DECK_H + 9, 36, count=2600, seed=3 + i, name=f"confetti_{i}", size=0.72)
    top = V.LED_Z0 + V.LED_H + 0.9
    for p in PRODUCTS:
        for dx in (-9, 0, 9):
            fx.show_spot(f, P(p["x"] + dx, -V.STAGE_D + 1, top), P(p["x"], p["y"], DECK_H + PLINTH_H + p["h"] * 0.5), 5200)
        for s in (-1, 1):
            fx.show_spot(f, P(s * 29, -6, V.SIDE_TRUSS_H - 1), P(p["x"], p["y"], DECK_H + PLINTH_H + p["h"] * 0.6), 4200, angle=13)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

    def arg(k, d=None):
        return argv[argv.index(k) + 1] if k in argv else d

    out = os.path.join(HERE, "out", "hero")
    os.makedirs(out, exist_ok=True)
    t0 = time.time()
    m, cams = V.build_all()
    sc = bpy.context.scene
    for o in list(bpy.data.objects):
        if o.name.startswith("launch_plinth"):
            bpy.data.objects.remove(o, do_unlink=True)
    build(m)
    views = {
        "seat": V.add_camera("cam_seat", P(-1.2, 40.5, 4.5), P(0, -10, 11.5), 23, 8.0),
        "centre": V.add_camera("cam_centre", P(0, 58, 9.0), P(0, -10, 11.0), 30),
        "close": V.add_camera("cam_close", P(15, 16, 6.2), P(4, -11, 10.5), 32, 4.0),
    }
    eevee = "--eevee" in argv
    V.setup_render(sc, int(arg("--w", 1920)), int(arg("--h", 1080)), "EEVEE" if eevee else "CYCLES", int(arg("--samples", 160)))
    if not eevee:
        sc.cycles.volume_step_rate = 1.0 if hasattr(sc.cycles, "volume_step_rate") else None
        sc.cycles.volume_bounces = 1
    elif hasattr(sc.eevee, "volumetric_end"):
        sc.eevee.volumetric_end = 80
    sc.view_settings.exposure = float(arg("--exposure", -0.7))
    print(f"BUILT hero in {time.time() - t0:.1f}s")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, "ignition_hero.blend"))
    for name in arg("--cam", "seat").split(","):
        sc.camera = views[name]
        sc.render.filepath = os.path.join(out, f"ignition_{name}{'_eevee' if eevee else ''}.png")
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"HERO {name} {'eevee' if eevee else 'cycles'} {sc.render.resolution_x}x{sc.render.resolution_y} in {time.time() - t:.1f}s")


if __name__ == "__main__":
    main()
