"""Concept: unseen (The Unseen). Owns everything specific to this reveal. Shared helpers come from cl.py.

Two free-standing matte-black architectural bays (the second wider and taller than the first) stand on the deck
with a gap between them, well inside the 56 ft width and well below the top of the LED wall, so the wall is seen
to wake above, beside and between them. Each bay = two ballasted piers + a header + four telescoping face leaves
that slide into the piers. The back of each bay is open: once the leaves retract the product is seen against the
main LED wall. The guest turns a brass key at a low lectern; light runs along a deck channel into bay one's seams,
bay one breathes and opens, the light runs on along the base line to bay two, and bay two opens.
"""
from cl import *

OWN_GUEST = True

LX, LY = CX, -2.6            # lectern centre (plan ft)
YF = -6.0                    # front face of the piers
YB = -15.8                   # back of the bays (open)
F_B1, F_B2 = 128, 156        # bay one / bay two start opening
OPEN_T = 20                  # frames for a bay to open
F_FX = 182

# (product index, opening x0, x1, clear opening height, overall height)
BAYS = ((0, -14.7, -6.3, 8.2, 10.4), (1, 4.1, 14.9, 9.4, 12.0))

SHOTS = [
    (1, (-8.5, 6.5, 9.6), (-1.2, -4.2, 6.6)),            # on the guest, the lectern and the key
    (F_TOUCH + 6, (-7.5, 8.0, 9.4), (-2.0, -4.0, 6.0)),
    (64, (-12.5, 15.0, 10.5), (-8.5, -6.0, 7.0)),        # following the light along the deck into bay one
    (92, (-7.0, 27.0, 10.0), (-4.0, -10.0, 9.5)),        # rising back as the LED wall wakes
    (122, (0.0, 40.0, 7.4), (0.0, -10.0, 10.2)),         # centre-aisle view of the whole stage for the reveal
    (END, (0.4, 30.0, 6.6), (0.4, -10.0, 9.0)),          # slow push toward the products
]


def _run(c, name, pts, f0, f1, glow, th=0.07, step=0.7, until=None):
    """A line of light that draws itself along a polyline (plan feet xyz) between frames f0 and f1."""
    segs = []
    for a, b in zip(pts, pts[1:]):
        n = max(1, round(math.dist(a, b) / step))
        for i in range(n):
            segs.append(tuple(tuple(a[k] + (b[k] - a[k]) * t for k in range(3)) for t in (i / n, (i + 1) / n)))
    for i, (a, b) in enumerate(segs):
        o = box(c, name, min(a[0], b[0]) - th / 2, max(a[0], b[0]) + th / 2, min(a[1], b[1]) - 0.015, max(a[1], b[1]) + 0.015,
                min(a[2], b[2]) - th / 2, max(a[2], b[2]) + th / 2, glow)
        show_from(o, int(f0 + i * (f1 - f0) / max(1, len(segs))), until=until)


def _lectern(c, brass, glow):
    z = DECK_H
    stone = V.pbr("unseen_lectern", "concrete_floor_01", 0.5, tint=(0.07, 0.07, 0.075))
    box(c, "lectern_base", LX - 1.5, LX + 1.5, LY - 0.95, LY + 0.95, z, z + 0.16, brass, 0.01)
    box(c, "lectern_body", LX - 1.3, LX + 1.3, LY - 0.78, LY + 0.78, z + 0.16, z + 2.95, stone, 0.03)
    box(c, "lectern_top", LX - 1.42, LX + 1.42, LY - 0.9, LY + 0.9, z + 2.95, z + 3.08, brass, 0.012)
    box(c, "lectern_inlay", LX - 0.03, LX + 0.03, LY + 0.78, LY + 0.80, z + 0.3, z + 2.8, brass)
    show_from(box(c, "lectern_inlay_lit", LX - 0.04, LX + 0.04, LY + 0.80, LY + 0.82, z + 0.3, z + 2.8, glow), F_TOUCH)
    show_from(box(c, "lectern_halo", LX - 0.5, LX + 0.5, LY - 0.5, LY + 0.5, z + 3.08, z + 3.1, glow), F_TOUCH)
    show_from(box(c, "lectern_feed", LX - 2.0, LX - 1.3, LY - 0.1, LY + 0.1, z + 0.02, z + 0.1, glow), F_TOUCH + 2)
    # the machined brass key: collar in the lectern, shaft, and a flat bow the guest grips
    hp = empty(c, "key_pivot", P(LX, LY, z + 3.1))
    parent(box(c, "key_collar", LX - 0.26, LX + 0.26, LY - 0.26, LY + 0.26, z + 3.08, z + 3.2, brass, 0.03), hp)
    parent(box(c, "key_shaft", LX - 0.09, LX + 0.09, LY - 0.09, LY + 0.09, z + 3.2, z + 3.62, brass, 0.02), hp)
    parent(box(c, "key_bow", LX - 0.5, LX + 0.5, LY - 0.06, LY + 0.06, z + 3.55, z + 4.1, brass, 0.025), hp)
    key(hp, F_TOUCH - 9, rot=(0, 0, 0))
    key(hp, F_TOUCH + 4, rot=(0, 0, math.radians(-90)))


def _guest(c):
    """Chief guest: walks in from stage left, turns the key at F_TOUCH, holds, then walks clear to stage left."""
    suit = mat("guest_suit", (0.20, 0.23, 0.30), 0.62)
    skin = mat("guest_skin", (0.60, 0.47, 0.38), 0.6)
    stand = (LX - 0.82, LY - 1.5)
    root = empty(c, "guest_root", P(stand[0], stand[1], DECK_H))

    def part(name, pivot, blobs):
        bm = bmesh.new()
        for (cx, cy, cz, rx, ry, rz, mi) in blobs:
            r = bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=1.0,
                                          matrix=Matrix.Translation((cx, cy, cz)) @ Matrix.Diagonal((rx, ry, rz, 1)))
            for f in {f for vv in r["verts"] for f in vv.link_faces}:
                f.material_index = mi
                f.smooth = True
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        me.materials.append(suit)
        me.materials.append(skin)
        o = link(bpy.data.objects.new(name, me), c)
        o.location = root.location + Vector(pivot)
        return parent(o, root)

    legs = [part(f"guest_leg_{i}", (sx, 0, 0.92), [(0, 0, -0.46, 0.085, 0.10, 0.47, 0), (0, -0.05, -0.90, 0.07, 0.13, 0.045, 0)]) for i, sx in enumerate((-0.1, 0.1))]
    part("guest_torso", (0, 0, 0.9), [(0, 0, 0.32, 0.205, 0.125, 0.37, 0), (0, 0, 0.0, 0.18, 0.12, 0.14, 0), (0, 0, 0.66, 0.05, 0.05, 0.07, 1)])
    part("guest_head", (0, 0, 1.63), [(0, 0, 0, 0.095, 0.11, 0.125, 1)])
    arm_l = part("guest_arm_l", (-0.255, 0, 1.46), [(0, 0, -0.30, 0.055, 0.06, 0.32, 0), (0, 0, -0.64, 0.045, 0.05, 0.06, 1)])
    arm_r = part("guest_arm_r", (0.255, 0, 1.46), [(0, 0, -0.30, 0.055, 0.06, 0.32, 0), (0, 0, -0.64, 0.045, 0.05, 0.06, 1)])
    a0, a1, b0, b1 = 2, F_TOUCH - 10, F_TOUCH + 26, F_TOUCH + 82
    start, away = (-9.0, -4.4), (-22.5, -3.2)
    key(root, a0, loc=P(start[0], start[1], DECK_H), rot=(0, 0, math.radians(90)))
    key(root, a1 - 5, rot=(0, 0, math.radians(90)))
    key(root, a1, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0 + 8, rot=(0, 0, math.radians(-80)))
    key(root, b1 - 8, rot=(0, 0, math.radians(-80)))
    key(root, b1, loc=P(away[0], away[1], DECK_H), rot=(0, 0, math.radians(25)))
    for (fa, fb) in ((a0, a1), (b0, b1)):
        f, k = fa, 0
        while f <= fb:
            sw = 0 if f + 5 > fb else math.radians(24) * (1 if k % 2 == 0 else -1)
            key(legs[0], f, rot=(sw, 0, 0))
            key(legs[1], f, rot=(-sw, 0, 0))
            key(arm_l, f, rot=(sw * 0.7, 0, 0))
            f += 5
            k += 1
    key(arm_r, a1, rot=(0, 0, 0))                    # hand onto the key, then the quarter turn
    key(arm_r, F_TOUCH - 9, rot=(math.radians(-43), 0, 0))
    key(arm_r, F_TOUCH + 4, rot=(math.radians(-43), 0, math.radians(-22)))
    key(arm_r, b0 - 6, rot=(math.radians(-43), 0, math.radians(-22)))
    key(arm_r, b0 + 2, rot=(0, 0, 0))
    return root


def _led_wake(c, glow, f0, f1):
    """Main LED wall: black until f0, warm columns rise, then a calm amber field with a bloom behind each bay."""
    yf = -DECK_D - 0.5
    z0, H, W = V.LED_Z0, V.LED_H, V.LED_W
    n = 14
    for i in range(n):
        x = -W / 2 + (i + 0.5) * W / n
        d = abs(i - (n - 1) / 2) / (n / 2)
        b = origin_to(box(c, "led_column", x - W / n * 0.42, x + W / n * 0.42, yf - 0.01, yf, z0 + 0.3, z0 + H - 0.3, glow), "bottom")
        fa = f0 + round(d * 12)
        key(b, 1, hide=True)
        key(b, fa - 1, hide=True)
        key(b, fa, hide=False, scale=(0.1, 1, 0.02))
        key(b, fa + 14, scale=(0.1, 1, 1))
        key(b, f1 - 6, scale=(0.1, 1, 1))
        key(b, f1 + 6, scale=(1, 1, 1))
        key(b, f1 + 7, hide=True)
    bands = 7
    for k in range(bands):                                # calm vertical gradient, deep bronze up to ember
        t = k / (bands - 1)
        col = (0.20 - 0.15 * t, 0.075 - 0.058 * t, 0.02 - 0.012 * t)
        m = emissive(f"unseen_led_band_{k}", col, 1.5)
        show_from(box(c, "led_field", -W / 2, W / 2, yf - 0.012, yf - 0.002, z0 + H * k / bands, z0 + H * (k + 1) / bands, m), f1 + 6)
    bloom = emissive("unseen_led_bloom", (1.0, 0.50, 0.20), 0.75)
    line = emissive("unseen_led_line", (1.0, 0.78, 0.5), 9.0)
    for (pi, a, b, oh, hb), fo in zip(BAYS, (F_B1, F_B2)):
        show_from(box(c, "led_bloom", a - 0.6, b + 0.6, yf - 0.006, yf + 0.004, z0, DECK_H + oh + 1.2, bloom), max(f1 + 6, fo))
    show_from(box(c, "led_horizon", -W / 2 + 1, W / 2 - 1, yf - 0.004, yf + 0.008, z0 + H - 3.0, z0 + H - 2.92, line), f1 + 6)


def _fx(c, f):
    """CO2 behind the bay line (outer ends and the gap), cold sparks at the upstage corners against the lit LED
    wall, sparse confetti high over the bays. Nothing in front of or inside the bays."""
    for x in (-19.6, -1.4, 20.4):
        j = fx.co2_jet(c, x, -12.0, DECK_H, height=17, t=0.9)
        origin_to(j, "bottom")
        key(j, 1, hide=True)
        key(j, f - 1, hide=True)
        key(j, f, hide=False, scale=(0.5, 0.5, 0.05))
        key(j, f + 8, scale=(1, 1, 1))
        key(j, f + 30, scale=(1.4, 1.4, 1.1))
        key(j, f + 31, hide=True)
    for i, x in enumerate((-25.5, 25.5)):
        vs = [fx.spark_fountain(c, x, -17.5, DECK_H, height=13, count=420, t=1.0, seed=40 + i * 7 + k) for k in range(3)]
        for k, o in enumerate(vs):
            key(o, 1, hide=True)
            for fr in range(f, END + 1):
                key(o, fr, hide=((fr - f) % 3 != k))
    o = fx.confetti(c, -22, 22, -19, -13, DECK_H + 17, 42, count=900, seed=5, name="confetti_unseen", size=0.7)
    key(o, 1, hide=True)
    key(o, f + 3, hide=True)
    key(o, f + 4, hide=False, loc=Vector((0, 0, 2.5)))
    key(o, END, loc=Vector((0.5, -0.3, -1.6)))


def build(c):
    z = DECK_H
    warm = emissive("unseen_warm", (1.0, 0.74, 0.44), 34)            # the travelling light
    dim = emissive("unseen_seam_dim", (1.0, 0.72, 0.42), 2.2)        # seams at rest
    skin = emissive("unseen_skin", (1.0, 0.70, 0.42), 0.26)           # inner LED skin of each bay
    brass = mat("unseen_brass", (0.80, 0.58, 0.24), 0.24, 1.0)
    matte = V.pbr("unseen_matte", "concrete_floor_01", 0.35, tint=(0.085, 0.085, 0.092), rough_add=0.1)
    leafm = V.pbr("unseen_leaf", "concrete_floor_01", 0.35, tint=(0.07, 0.07, 0.076), rough_add=0.05)
    steel, sdark = m_["steel"], m_["steel_dark"]

    products(c)
    _lectern(c, brass, warm)
    _guest(c)

    for bi, (pi, a, b, oh, hb) in enumerate(BAYS):
        p = PRODUCTS[pi]
        f0 = (F_B1, F_B2)[bi]
        w = (b - a) / 4                                   # leaf width
        pw = w + 0.5                                      # pier width (pocket for two stacked leaves)
        mid = (a + b) / 2
        x0, x1 = a - pw, b + pw
        # ---- fixed architecture: two piers, header, side returns, roof
        for (pa, pb) in ((x0, a), (b, x1)):
            box(c, "bay_pier", pa, pb, YF - 1.0, YF, z, z + hb, matte, 0.03)
            box(c, "bay_pier_plinth", pa - 0.06, pb + 0.06, YF - 1.0, YF + 0.06, z, z + 0.3, brass, 0.008)
        box(c, "bay_header", a - 0.01, b + 0.01, YF - 1.0, YF, z + oh, z + hb, matte, 0.02)
        box(c, "bay_cap", x0 - 0.05, x1 + 0.05, YF - 1.05, YF + 0.05, z + hb, z + hb + 0.12, brass, 0.01)
        for (sa, sb) in ((a - 0.3, a), (b, b + 0.3)):
            box(c, "bay_return", sa, sb, YB, YF - 1.0, z, z + oh + 0.3, matte, 0.01)
        box(c, "bay_return_skin", a, a + 0.04, YB + 0.2, YF - 1.1, z + 0.2, z + oh, skin)
        box(c, "bay_return_skin", b - 0.04, b, YB + 0.2, YF - 1.1, z + 0.2, z + oh, skin)
        box(c, "bay_roof", a - 0.3, b + 0.3, YB, YF - 1.0, z + oh, z + oh + 0.3, matte, 0.01)
        box(c, "bay_roof_slot", a + 0.6, b - 0.6, YF - 1.7, YF - 1.3, z + oh - 0.04, z + oh, skin)
        box(c, "bay_sill", a, b, YF - 0.7, YF, z, z + 0.05, brass)
        # ---- visible structure and ballast behind each pier (free-standing, no rigging to the LED wall)
        for (pa, pb) in ((x0, a - 0.3), (b + 0.3, x1)):
            cxp = (pa + pb) / 2
            truss(c, "bay_frame_post", P(cxp, YF - 1.3, z + 0.1), P(cxp, YF - 1.3, z + hb - 0.2), steel, 0.22, 0.02)
            truss(c, "bay_frame_kicker", P(cxp, YF - 1.5, z + hb - 0.6), P(cxp, YB + 1.6, z + 0.5), steel, 0.22, 0.02)
            truss(c, "bay_frame_base", P(cxp, YF - 1.3, z + 0.25), P(cxp, YB + 0.6, z + 0.25), steel, 0.22, 0.02)
            box(c, "bay_ballast", pa + 0.1, pb - 0.1, YB + 0.4, YB + 3.6, z, z + 1.7, m_["concrete"], 0.03)
            box(c, "bay_ballast", pa + 0.1, pb - 0.1, YF - 4.6, YF - 2.0, z, z + 1.4, m_["concrete"], 0.03)
        truss(c, "bay_frame_tie", P(x0 + pw / 2, YB + 1.0, z + oh + 0.5), P(x1 - pw / 2, YB + 1.0, z + oh + 0.5), steel, 0.22, 0.02)
        # ---- four telescoping face leaves: the two centre leaves ride the front track, the outer two the rear
        tz0, tz1 = z + 0.05, z + oh + 0.15
        for sg in (-1, 1):
            e = a if sg < 0 else b
            inner = box(c, "bay_leaf_inner", min(mid, mid + sg * w), max(mid, mid + sg * w), YF - 0.19, YF - 0.07, tz0, tz1, leafm, 0.006)
            outer = box(c, "bay_leaf_outer", min(e, e - sg * w), max(e, e - sg * w), YF - 0.34, YF - 0.22, tz0, tz1, leafm, 0.006)
            pull = box(c, "bay_leaf_pull", mid + sg * 0.09, mid + sg * 0.16, YF - 0.07, YF - 0.05, z + 3.2, z + 5.2, brass)
            parent(pull, inner)
            for o, n in ((inner, 2), (outer, 1)):
                key(o, f0, loc=o.location.copy())
                key(o, f0 + OPEN_T, loc=o.location + Vector((sg * n * w * FT, 0, 0)))
        # ---- seams at rest: thin warm lines tracing the bay (always on, low level)
        ys = YF + 0.012
        for sx in (a, b):
            box(c, "bay_seam", sx - 0.025, sx + 0.025, ys - 0.02, ys, z + 0.3, z + oh, dim)
        hide_from(box(c, "bay_seam_centre", mid - 0.025, mid + 0.025, ys - 0.02, ys, z + 0.3, z + oh, dim), f0 + 1)
        box(c, "bay_seam", a, b, ys - 0.02, ys, z + oh - 0.025, z + oh + 0.025, dim)
        for sx in (x0 + 0.5, x1 - 0.5):
            box(c, "bay_seam", sx - 0.02, sx + 0.02, ys - 0.02, ys, z + 0.5, z + hb - 0.4, dim)
        # ---- the signal draws itself over the seams: up the centre, out along the header, down both jambs
        fs = (62, F_B1 + OPEN_T + 2)[bi]                  # when the light reaches this bay's sill
        yr = YF + 0.03
        _run(c, "bay_seam_lit", [(mid, yr, z + 0.3), (mid, yr, z + oh)], fs, fs + 8, warm, until=f0 + 1)
        for sg in (-1, 1):
            e = a if sg < 0 else b
            _run(c, "bay_seam_lit", [(mid, yr, z + oh), (e, yr, z + oh), (e, yr, z + 0.3)], fs + 8, fs + 20, warm)
        # ---- the bay "breathes": warm light swells and fades in the centre joint before the leaves part
        br = origin_to(box(c, "bay_breath", mid - 0.05, mid + 0.05, YF - 0.06, YF - 0.03, z + 0.3, z + oh - 0.1, warm), "bottom")
        bl = bpy.data.lights.new("bay_breath_glow", "POINT")
        bl.color = (1.0, 0.7, 0.4)
        bl.shadow_soft_size = 0.4
        blo = link(bpy.data.objects.new("bay_breath_glow", bl), c)
        blo.location = P(mid, YF + 1.2, z + oh * 0.45)
        key(br, 1, hide=True)
        key(br, fs + 19, hide=True)
        f, k = fs + 20, 0
        while f < f0:
            key(br, f, hide=False, scale=((1.0, 5.0)[k % 2], 1, 1))
            bl.energy = (40, 900)[k % 2]
            bl.keyframe_insert("energy", frame=f)
            f += 9
            k += 1
        key(br, f0, scale=(5.0, 1, 1))
        bl.energy = 900
        bl.keyframe_insert("energy", frame=f0)
        key(br, f0 + 6, hide=True)
        show_from(blo, fs + 20, until=f0 + 6)
        # ---- warm hero light inside the bay, on from the moment the leaves part
        for (lx, ly, lz, en, sz) in ((p["x"], YF + 3.0, z + oh - 0.6, 420, 58), (p["x"], YF - 1.6, z + oh - 0.3, 650, 80)):
            li = bpy.data.lights.new("bay_hero", "SPOT")
            li.energy = en
            li.color = (1.0, 0.84, 0.66)
            li.spot_size = math.radians(sz)
            li.spot_blend = 0.5
            li.shadow_soft_size = 0.6
            li.specular_factor = 0.25
            o = link(bpy.data.objects.new("bay_hero", li), c)
            o.location = P(lx, ly, lz)
            o.rotation_euler = (P(p["x"], p["y"] + 1.0, z + PL + p["h"] * 0.45) - o.location).to_track_quat("-Z", "Y").to_euler()
            show_from(o, f0 + 2)
        show_from(box(c, "bay_pool", p["x"] - p["size"] / 2 - 1.3, p["x"] + p["size"] / 2 + 1.3, p["y"] + p["size"] / 2 + 0.75, YF - 1.0, z + 0.01, z + 0.03,
                      emissive("unseen_pool", (1.0, 0.7, 0.4), 0.8)), f0 + 4)

    # ---- the cue travelling: lectern -> deck channel -> bay one sill; later the base line carries it to bay two
    m1 = (BAYS[0][1] + BAYS[0][2]) / 2
    m2 = (BAYS[1][1] + BAYS[1][2]) / 2
    lit_path(c, [(LX - 2.0, LY), (m1, LY), (m1, YF + 0.35)], F_TOUCH + 4, 62, warm, w=0.22)
    fa, fb = F_B1 + 6, F_B1 + OPEN_T + 2
    route = [(BAYS[0][2], YF + 0.5), (m2, YF + 0.5), (m2, YF + 0.36)]
    lit_path(c, route, fa, fb, warm, w=0.2)

    _led_wake(c, warm, F_WAKE, 116)
    fog_floor(c, F_FX - 2, 0.3)
    _fx(c, F_FX)
