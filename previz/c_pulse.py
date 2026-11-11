"""Concept: pulse. Owns everything specific to this reveal. Shared helpers come from cl.py (do not edit cl.py).

One idea, readable in one glance:
  palm on the console (36) -> a pixel chase of light leaves the console, runs straight across the deck to each
  product and along the stage front (40-84) -> it wraps the foot of each drape (to 102) -> the silk drape lets go
  and falls (118-160) -> product lit.  The LED wall starts its launch sequence on the same cue (black until 84).
No fin, no return leg, no confetti, no floor fog.
"""
from cl import *

OWN_GUEST = True
F_DROP0, F_DROP1 = 118, 140   # first (upstage) and last (audience-facing) pleats let go
FALL = 20                     # frames each pleat takes to fall
F_FX = 172

import cl
CX, CY = 20.5, -2.4           # console at stage left (audience right), per the written spec; cl default is front centre

SHOTS = [(1, (13.0, 6.5, 9.4), (CX - 0.4, CY - 0.8, DECK_H + 3.1)),        # on the guest and the console
         (F_TOUCH + 4, (13.5, 7.5, 9.8), (CX - 1.2, CY - 0.6, DECK_H + 2.6)),   # the palm
         (F_WAKE, (-1.0, 26.0, 13.5), (-2.0, -6.0, DECK_H + 2.0)),         # pulled back and up, following the chase
         (F_DROP0 + 2, (0, 40.0, 7.6), (0, -10.5, 9.6)),                   # centre aisle, whole stage
         (END, (0, 31.0, 6.6), (0, -10.8, 9.0))]                           # slow push for the hero hold


# ------------------------------------------------------------- pixel chase --
def _px_mesh(name, dims, material):
    me = V.boxes_mesh(name, [(0, 0, 0, dims[0] * FT, dims[1] * FT, dims[2] * FT)])
    me.materials.append(material)
    return me


def pixel_chase(c, pts, f0, f1, lit, hot, dims=(0.34, 0.5, 0.04), pitch=0.5, head=4, bed=None, closed_gap=True):
    """Individually addressable pixels along pts (plan feet xyz). Each pixel switches on in order f0..f1 and stays
    on; the `head` pixels at the front burn white-hot, so the travel reads as a chase of discrete pixels."""
    d = [0.0]
    for a, b in zip(pts, pts[1:]):
        d.append(d[-1] + math.dist(a, b))
    total = d[-1]
    n = max(2, int(total / pitch))
    me_l, me_h = _px_mesh("px_lit", dims, lit), _px_mesh("px_hot", (dims[0] * 1.15, dims[1] * 1.25, dims[2] * 1.6), hot)
    fr = lambda i: f0 + (f1 - f0) * i / (n - 1)
    for i in range(n):
        s = (i + 0.5) * total / n
        k = max(j for j in range(len(d) - 1) if d[j] <= s)
        a, b = pts[k], pts[k + 1]
        t = (s - d[k]) / max(d[k + 1] - d[k], 1e-6)
        q = [a[j] + (b[j] - a[j]) * t for j in range(3)]
        rz = math.atan2(-(b[1] - a[1]), b[0] - a[0])
        fa = int(round(fr(i)))
        for me, until in ((me_l, None), (me_h, max(fa + 2, int(round(fr(i + head))) + 1))):
            o = link(bpy.data.objects.new(me.name, me), c)
            o.location = P(*q)
            o.rotation_euler = (0, 0, rz)
            show_from(o, fa, until)
    if bed is not None:      # protected aluminium channel the pixels sit in
        for a, b in zip(pts, pts[1:]):
            L = math.dist(a, b)
            me = _px_mesh("led_channel", (L, dims[1] + 0.12, 0.05), bed)
            o = link(bpy.data.objects.new("led_channel", me), c)
            o.location = P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2] - 0.045)
            o.rotation_euler = (0, 0, math.atan2(-(b[1] - a[1]), b[0] - a[0]))


def head_glow(c, a, b, f0, f1, color, energy=260):
    """Small travelling light so the chase head throws a little light on the deck (not the main read)."""
    li = bpy.data.lights.new("chase_glow", "POINT")
    li.energy, li.color, li.shadow_soft_size, li.specular_factor = energy, color, 0.15, 0.0
    o = link(bpy.data.objects.new("chase_glow", li), c)
    prefs = bpy.context.preferences.edit
    old = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = "LINEAR"
    key(o, f0, loc=P(a[0], a[1], a[2] + 0.5))
    key(o, f1, loc=P(b[0], b[1], b[2] + 0.5))
    prefs.keyframe_new_interpolation_type = old
    key(o, 1, hide=True)
    key(o, f0 - 1, hide=True)
    key(o, f0, hide=False)
    key(o, f1 + 1, hide=True)


# ------------------------------------------------------------------- drape --
def _sq(a, th, n=5.0):
    """Rounded-square radius (half-width a) at plan angle th."""
    return a / (abs(math.cos(th)) ** n + abs(math.sin(th)) ** n) ** (1.0 / n)


def satin():
    m = mat("drape_satin", (0.60, 0.58, 0.54), 0.36)
    b = m.node_tree.nodes["Principled BSDF"]
    for k, v in (("Sheen Weight", 0.8), ("Sheen Roughness", 0.35), ("Specular IOR Level", 0.75)):
        if k in b.inputs:
            b.inputs[k].default_value = v
    if "Sheen Tint" in b.inputs:
        b.inputs["Sheen Tint"].default_value = (1.0, 0.97, 0.9, 1.0)
    return m


def drape(c, p, cloth):
    """Pleated silk kabuki drape with a tented top, hung from a slim halo on two upstage posts.
    It hides the product from the front, both sides, the back and above. On the cue the pleats let go in a wave
    (upstage first, audience side last) and fall to the deck. Returns (a, H)."""
    a = p["size"] / 2 + 0.7 + 0.65            # clear of the plinth
    H = PL + p["h"] + 1.7
    peak = 1.0
    x, y, z = p["x"], p["y"], DECK_H + 0.02
    NG, COLS, NPL = 36, 12, 72                # gores, columns per gore, pleats all round
    rows = (0.0, 0.3, 0.65, 1.0)
    for g in range(NG):
        bm = bmesh.new()
        grid = []
        for j in range(COLS + 1):
            th = 2 * math.pi * (g + j / COLS) / NG
            col = []
            for t in rows:
                r = _sq(a, th) + 0.38 * (1 - t) ** 2 + (0.10 + 0.14 * (1 - t)) * math.cos(NPL * th)
                col.append(bm.verts.new((r * math.cos(th) * FT, -r * math.sin(th) * FT, t * H * FT)))
            r = _sq(a, th) * 0.5                 # tented top, up to a centre pick point
            col.append(bm.verts.new((r * math.cos(th) * FT, -r * math.sin(th) * FT, (H + peak * 0.6) * FT)))
            grid.append(col)
        apex = bm.verts.new((0, 0, (H + peak) * FT))
        for j in range(COLS):
            for i in range(len(rows)):
                bm.faces.new((grid[j][i], grid[j + 1][i], grid[j + 1][i + 1], grid[j][i + 1]))
            bm.faces.new((grid[j][-1], grid[j + 1][-1], apex))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        me = bpy.data.meshes.new("drape_silk")
        bm.to_mesh(me)
        bm.free()
        for f in me.polygons:
            f.use_smooth = True
        me.materials.append(cloth)
        o = link(bpy.data.objects.new("drape_silk", me), c)
        o.location = P(x, y, z)
        thm = 2 * math.pi * (g + 0.5) / NG
        phi = abs((thm - math.pi / 2 + math.pi) % (2 * math.pi) - math.pi) / math.pi     # 0 audience side .. 1 upstage
        f = round(F_DROP1 - (F_DROP1 - F_DROP0) * phi + (g % 3) - 1)
        key(o, 1, scale=(1, 1, 1))
        key(o, f, scale=(1, 1, 1))
        key(o, f + 3, scale=(1.0, 1.0, 0.96))                  # goes slack
        key(o, f + FALL, scale=(1.05, 1.05, 0.028 + 0.006 * (g % 4)))   # pooled on the deck around the plinth
    # halo and its two upstage posts (the only hardware left in the hero frame)
    ring = [P(x + (_sq(a, t) + 0.12) * math.cos(t), y + (_sq(a, t) + 0.12) * math.sin(t), z + H) for t in (2 * math.pi * k / 72 for k in range(72))]
    tube(c, "halo", ring, 0.032, m_["steel"], cyclic=True)
    for sx in (-1, 1):
        px, py = x + sx * a * 0.72, y - a - 0.1
        tube(c, "halo_post", [P(px, py, DECK_H), P(px, py, z + H)], 0.03, m_["steel_dark"])
        box(c, "halo_base", px - 0.8, px + 0.8, py - 0.9, py + 0.7, DECK_H, DECK_H + 0.07, m_["steel_dark"])
        tube(c, "halo_pick", [P(px, py, z + H), P(x, y, z + H + peak), P(x - sx * a * 0.72, y + a + 0.1, z + H)], 0.005, m_["steel_dark"])
    return a, H


def foot_ring(c, p, a, start, f0, f1, lit, hot):
    """Pixel ring on the deck round the foot of the drape; the chase splits at the arrival point and wraps both ways."""
    r0 = a + 0.95
    th0 = math.atan2(start[1] - p["y"], start[0] - p["x"])
    for sg in (-1, 1):
        pts = [(p["x"] + _sq(r0, th0 + sg * math.pi * k / 40) * math.cos(th0 + sg * math.pi * k / 40),
                p["y"] + _sq(r0, th0 + sg * math.pi * k / 40) * math.sin(th0 + sg * math.pi * k / 40), DECK_H + 0.07) for k in range(41)]
        pixel_chase(c, pts, f0, f1, lit, hot, dims=(0.34, 0.4, 0.04), pitch=0.5, head=4)


def co2(c, f):
    cm = fx._volume_mat("vol_co2_pulse", 17.0, noise_scale=3.0, falloff=0.8, aniso=0.5, seed=2.0)
    for p in PRODUCTS:
        s = p["size"] / 2 + 4.3
        for sx in (-s, s):
            j = fx.co2_jet(c, p["x"] + sx, p["y"] - 0.5, DECK_H, height=15, t=0.9)
            j.data.materials.clear()
            j.data.materials.append(cm)
            origin_to(j, "bottom")
            key(j, 1, hide=True)
            key(j, f - 1, hide=True)
            key(j, f, hide=False, scale=(0.5, 0.5, 0.05))
            key(j, f + 7, scale=(1, 1, 1))
            key(j, f + 38, scale=(1.5, 1.5, 1.12))
            key(j, f + 39, hide=True)


def pulse_guest(c):
    """cl.guest, re-blocked: enters from the stage-left wing, palms the console, then steps back toward the wing
    (clear of the drapes, the lectern and the centre of the hero frame) and turns to watch."""
    g = guest(c)
    a0, a1, b0, b1 = 2, F_TOUCH - 8, F_TOUCH + 34, F_TOUCH + 96
    stand, start, away = (CX - 0.82, CY - 1.5), (26.6, -5.0), (24.8, -6.6)
    key(g, a0, loc=P(start[0], start[1], DECK_H), rot=(0, 0, math.radians(-78)))
    key(g, a1 - 5, rot=(0, 0, math.radians(-78)))
    b2 = b0 + 30
    key(g, b0 + 7, rot=(0, 0, math.radians(112)))
    key(g, b2 - 4, rot=(0, 0, math.radians(112)))
    key(g, b2, loc=P(away[0], away[1], DECK_H))
    key(g, b2 + 10, rot=(0, 0, math.radians(-62)))
    key(g, b1, loc=P(away[0], away[1], DECK_H), rot=(0, 0, math.radians(-62)))
    for n in ("guest_leg_0", "guest_leg_1", "guest_arm_l"):      # stop the walk cycle on arrival
        o = bpy.data.objects.get(n)
        if o:
            for f in range(b2 + 1, b1 + 6):
                try:
                    o.keyframe_delete("rotation_euler", frame=f)
                except Exception:
                    pass
            key(o, b2 + 2, rot=(0, 0, 0))
    return g


# ------------------------------------------------------------------- build --
def build(c):
    cl.CX, cl.CY = CX, CY          # cl.console / cl.guest read these at call time (cl.py itself is untouched)
    teal = emissive("pulse_teal", (0.10, 0.95, 0.78), 5)
    hot = emissive("pulse_hot", (0.75, 1.0, 0.95), 110)
    cloth = satin()
    products(c)
    console(c, "PLACE YOUR PALM", teal, "palm")
    z = DECK_H + 0.07
    f0 = F_TOUCH + 4
    bed = m_["steel_dark"]
    x0, x1 = CX - 1.5, min(p["x"] for p in PRODUCTS)
    v = (x0 - x1) / (F_WAKE - 6 - f0)                # ft per frame along the deck
    # one trunk run straight across the deck from the console, in front of both products
    pixel_chase(c, [(x0, CY, z), (x1, CY, z)], f0, F_WAKE - 6, teal, hot, bed=bed, head=5)
    head_glow(c, (x0, CY, z), (x1, CY, z), f0, F_WAKE - 6, (0.25, 0.95, 0.85))
    # the same signal on the stage front, where every seat can see it (in step with the deck run)
    pixel_chase(c, [(CX, CY + 0.95, z), (CX, -0.25, z)], f0, f0 + 3, teal, hot, bed=bed)
    for xe in (-27.6, 27.6):
        pixel_chase(c, [(CX, 0.05, DECK_H - 0.4), (xe, 0.05, DECK_H - 0.4)], f0 + 3, f0 + 3 + abs(xe - CX) / v, teal, hot,
                    dims=(0.34, 0.05, 0.24), pitch=0.5, head=6)
    for p in PRODUCTS:
        a, H = drape(c, p, cloth)
        fa = f0 + (x0 - p["x"]) / v                  # frame the trunk passes this product
        yr = p["y"] + a + 0.95                       # foot ring, audience side
        fb = fa + (CY - yr) / v
        pixel_chase(c, [(p["x"], CY - 0.4, z), (p["x"], yr + 0.3, z)], fa, fb, teal, hot, bed=bed)
        foot_ring(c, p, a, (p["x"], yr), fb, fb + 18, teal, hot)
        product_light(c, p, F_DROP0)
    led_wake(c, teal)            # same cue via show control: the wall is black until F_WAKE
    co2(c, F_FX)
    pulse_guest(c)
