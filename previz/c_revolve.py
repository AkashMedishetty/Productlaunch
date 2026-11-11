"""Concept: revolve. Owns everything specific to this reveal. Shared helpers come from cl.py (do not edit cl.py).

Client direction (overrides the written spec's sealed drum): each product stands on its own revolving stage with a
SEMICIRCULAR LED wall behind it, no roof. The revolve starts with the convex scenic back of the LED toward the
audience (product hidden); on the cue both revolves turn 180 degrees, mirrored, and each product arrives inside
its glowing half-round LED backdrop.

Beats: 36 handle · 40-70 signal runs console -> both revolve rims · 70-84 rims light round · 84 LED wall wakes ·
112-170 the turn · 186 effects · hold to 240.
"""
from cl import *

OWN_GUEST = True
F_PATH0, F_PATH1, F_RIM, F_TURN0, F_TURN1, F_FX = 40, 70, 84, 112, 170, 186
RISER_H = 0.5          # low circular stage the revolve sits flush in (ft)
CAB = 1.6404           # 500 mm LED cabinet
WRAP = math.radians(8)  # the half-round wraps 8 degrees past 180 each side so side seats cannot see in

# per product: revolve centre y, LED radius, product offset into the curve, cabinet rows
UNITS = (dict(yc=-11.0, r=5.0, d=1.2, rows=6, turn=1), dict(yc=-11.5, r=6.4, d=1.4, rows=7, turn=-1))
WALL_T = 0.3

SHOTS = [(1, (7.5, 12.5, 10.5), (-4.5, -4.5, DECK_H + 3.0)),          # raised 3/4: guest walking to the handle
         (F_TOUCH + 6, (5.5, 11, 10.5), (CX - 1.0, CY - 2.0, DECK_H + 2.8)),
         (F_PATH1 - 4, (-4, 21, 13.5), (0, -8, DECK_H + 2.0)),        # lifting back to follow the signal to the rims
         (F_TURN0 - 6, (0, 41, 7.4), (0, -10, 9.6)),                  # centre aisle, whole stage, before the turn
         (F_TURN1 + 6, (0, 38.5, 7.0), (0, -10.5, 9.2)),
         (END, (0, 27.5, 6.4), (0, -11, 8.4))]                        # slow push for the hero hold


# ------------------------------------------------------------------ geometry --
def _pt(th, r, z):
    """Local plan feet around a revolve centre. th is measured from the upstage direction (the curve's apex)."""
    return Vector((math.sin(th) * r * FT, math.cos(th) * r * FT, z * FT))


def _sector(bm, t0, t1, r0, r1, z0, z1, mi=0, steps=1):
    for s in range(steps):
        a, b = t0 + (t1 - t0) * s / steps, t0 + (t1 - t0) * (s + 1) / steps
        v = [bm.verts.new(_pt(t, r, z)) for z in (z0, z1) for (t, r) in ((a, r0), (b, r0), (b, r1), (a, r1))]
        for q in ((0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (3, 0, 4, 7)):
            if r0 < 1e-6 and q == (0, 1, 5, 4):
                continue
            bm.faces.new([v[i] for i in q]).material_index = mi


def _obj(c, name, bm, mats, x, y, z):
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    o = link(bpy.data.objects.new(name, me), c)
    o.location = P(x, y, z)
    return o


def _ramp(t):
    """LED content colour up the wall: warm gold horizon -> teal -> deep blue. Abstract, no text."""
    stops = ((0.0, (1.0, 0.42, 0.06)), (0.22, (0.62, 0.16, 0.07)), (0.5, (0.02, 0.2, 0.3)), (1.0, (0.004, 0.025, 0.12)))
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if t <= b:
            k = (t - a) / (b - a)
            return tuple(ca[i] + (cb[i] - ca[i]) * k for i in range(3))
    return stops[-1][1]


def _product(c, p, y, z):
    """Copy of hero.product with a slim plinth (so it fits inside the curve) standing on the revolve at height z."""
    x, s = p["x"], p["size"] / 2
    warm = mat("plinth_edge_light", (1, 0.6, 0.2), 0.4, emit=(1.0, 0.55, 0.16), strength=30.0)
    body = mat("product_silver", (0.62, 0.64, 0.67), 0.26, 1.0, coat=0.5)
    e = s + 0.1
    box(c, "plinth", x - e, x + e, y - e, y + e, z + 0.14, z + PL, m_["plinth"], 0.02)
    box(c, "plinth_shadow_gap", x - e + 0.15, x + e - 0.15, y - e + 0.15, y + e - 0.15, z, z + 0.14, m_["black"])
    box(c, "plinth_underglow", x - e + 0.08, x + e - 0.08, y + e - 0.14, y + e - 0.1, z + 0.03, z + 0.11, warm)
    zp = z + PL
    box(c, "product_lower", x - s, x + s, y - s, y + s, zp, zp + p["h"] * 0.58, body, 0.09)
    box(c, "product_seam", x - s + 0.12, x + s - 0.12, y - s + 0.12, y + s - 0.12, zp + p["h"] * 0.58, zp + p["h"] * 0.60, warm)
    box(c, "product_upper", x - s + 0.25, x + s - 0.25, y - s + 0.25, y + s - 0.25, zp + p["h"] * 0.60, zp + p["h"], body, 0.14)
    text(c, "plinth_label", f"PRODUCT {p['name']}", P(x, y + e + 0.005, z + PL * 0.55), 0.085, m_["ink"], spacing=1.7)


def _unit(c, i, p, u, glow, seam):
    x, yc, r, rows = p["x"], u["yc"], u["r"], u["rows"]
    z = DECK_H
    zt = z + RISER_H
    Rt = r + WALL_T + 0.25          # revolve disc radius
    Ro = Rt + 0.45                  # fixed low circular stage
    H = rows * CAB
    full = 2 * math.pi
    # --- fixed low circular stage; the revolve disc sits flush inside it, drive hidden underneath
    bm = bmesh.new()
    _sector(bm, 0, full, Rt + 0.03, Ro, 0, RISER_H, 0, 96)
    _sector(bm, 0, full, Ro - 0.02, Ro + 0.03, RISER_H - 0.05, RISER_H + 0.012, 1, 96)     # aluminium nosing
    _obj(c, f"revolve_stage_{i}", bm, [m_["black"], m_["steel"]], x, yc, z)
    bm = bmesh.new()
    _sector(bm, 0, full, Rt - 0.2, Rt + 0.03, 0, RISER_H - 0.02, 0, 96)                    # shadow gap at the joint
    _obj(c, f"revolve_gap_{i}", bm, [m_["rubber"]], x, yc, z)
    n = 44
    for k in range(n):               # rim: lights from the front point round both sides to the back
        a0, a1 = full * k / n + 0.012, full * (k + 1) / n - 0.012
        bm = bmesh.new()
        _sector(bm, a0, a1, Ro + 0.005, Ro + 0.035, 0.1, 0.36, 0, 2)
        _sector(bm, a0, a1, Rt + 0.1, Rt + 0.28, RISER_H, RISER_H + 0.02, 0, 2)
        dist = abs(((k + 0.5) / n) - 0.5) * 2          # 0 at the front (th = pi), 1 at the back
        show_from(_obj(c, f"rim_light_{i}", bm, [glow], x, yc, z), round(F_PATH1 + (1 - dist) * (F_RIM - F_PATH1)))
    bm = bmesh.new()
    _sector(bm, 0, full, Ro + 0.0, Ro + 0.02, 0.07, 0.39, 0, 96)                           # dark channel behind the rim
    _obj(c, f"rim_channel_{i}", bm, [m_["grille"]], x, yc, z)

    # --- everything below turns with the revolve
    piv = empty(c, f"revolve_pivot_{i}", P(x, yc, zt))
    bm = bmesh.new()
    _sector(bm, 0, full, 0, Rt, -0.3, 0, 0, 96)
    _sector(bm, 0, full, Rt - 0.22, Rt - 0.14, -0.01, 0.006, 1, 96)                        # inlaid ring on the disc
    parent(_obj(c, f"revolve_disc_{i}", bm, [mat("revolve_top", (0.045, 0.047, 0.052), 0.3, coat=0.5), m_["steel"]], x, yc, zt), piv)

    # semicircular LED wall: faceted from 500 mm cabinets, scenic cladding on the convex back, slim frame, no roof
    span = math.pi + 2 * WRAP
    cols = round(span * r / CAB)
    dth = span / cols
    back = mat("revolve_back", (0.028, 0.03, 0.036), 0.5, coat=0.15)
    bm = bmesh.new()
    for k in range(cols):
        a0, a1 = -span / 2 + k * dth, -span / 2 + (k + 1) * dth
        _sector(bm, a0, a1, r, r + WALL_T - 0.05, 0.12, H, 0)                              # LED cabinets (black face)
        _sector(bm, a0 + 0.004, a1 - 0.004, r + WALL_T - 0.05, r + WALL_T, 0.12, H, 1)     # cladding panels, hairline joints
        _sector(bm, a0, a1, r - 0.03, r + WALL_T + 0.03, 0, 0.12, 2)                       # base rail
        _sector(bm, a0, a1, r - 0.03, r + WALL_T + 0.03, H, H + 0.1, 3)                    # slim top frame
    for sg in (-1, 1):                                                                     # end posts
        a = sg * span / 2
        _sector(bm, a, a + sg * 0.14 / r, r - 0.04, r + WALL_T + 0.04, 0, H + 0.1, 3)
    wall = parent(_obj(c, f"led_curve_{i}", bm, [m_["led"], back, m_["black"], m_["steel"]], x, yc, zt), piv)
    bm = bmesh.new()                                                                       # one seam of light on the back
    _sector(bm, -0.06 / r, 0.06 / r, r + WALL_T, r + WALL_T + 0.03, 0.5, H - 0.4, 0)
    parent(_obj(c, f"back_seam_{i}", bm, [seam], x, yc, zt), piv)

    # LED content: per cabinet column, colour bands that rise from the horizon, staggered from the centre outward
    bands = rows * 2
    bmats = [emissive(f"rev_led_{rows}_{j}", _ramp((j + 0.5) / bands), 1.0) for j in range(bands)]
    for j, bmx in enumerate(bmats):
        bmx.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.85
    bar = emissive("rev_led_bar", (0.3, 0.62, 0.8), 0.9)
    order = sorted(range(cols), key=lambda k: abs(k - (cols - 1) / 2))
    for k in range(cols):
        a0, a1 = -span / 2 + k * dth, -span / 2 + (k + 1) * dth
        A, B = _pt(a0, r, 0), _pt(a1, r, 0)
        nrm = -((A + B) / 2).normalized()
        up = Vector((0, 0, 1))

        def quad(bm_, t0, t1, z0, z1, off, mi):
            vs = [bm_.verts.new(A + (B - A) * t + nrm * off * FT + up * zz * FT) for (t, zz) in ((t0, z0), (t1, z0), (t1, z1), (t0, z1))]
            bm_.faces.new(vs).material_index = mi

        bm = bmesh.new()
        for j in range(bands):
            g0 = 0.012 if j % 2 == 0 else 0.0
            g1 = 0.012 if j % 2 == 1 else 0.0
            quad(bm, 0.008, 0.992, j * CAB / 2 + g0, (j + 1) * CAB / 2 - g1, 0.02, j)
        col = _obj(c, f"led_content_{i}", bm, bmats, x, yc, zt + 0.12)
        col.scale = (1, 1, (H - 0.12) / H)
        rank = order.index(k)
        fa = F_TURN0 + round(rank * 16 / cols)
        key(col, 1, hide=True)
        key(col, fa - 1, hide=True)
        key(col, fa, hide=False, scale=(1, 1, 0.03))
        key(col, fa + 26, scale=(1, 1, (H - 0.12) / H))
        parent(col, piv)
        # travelling accent: one cabinet column brightens and the lift chases from the centre out, repeating through the hold
        bm = bmesh.new()
        quad(bm, 0.008, 0.992, 0.14, H - 0.02, 0.035, 0)
        b = _obj(c, f"led_accent_{i}", bm, [bar], x, yc, zt)
        key(b, 1, hide=True)
        s = F_TURN0 + 30 + rank * 3
        while s < END + 8:
            key(b, s - 1, hide=True)
            key(b, s, hide=False)
            key(b, s + 5, hide=True)
            s += cols * 3 + 10
        parent(b, piv)

    # product stands inside the curve, offset upstage so the wall hides it completely when turned away
    before = set(c.objects)
    yp = yc - u["d"]
    _product(c, p, yp, zt)
    for o in set(c.objects) - before:
        parent(o, piv)
    # the LED's own light on the product and the disc (travels with the revolve)
    li = bpy.data.lights.new("curve_glow", "POINT")
    li.energy, li.color, li.shadow_soft_size = 260, (0.55, 0.8, 1.0), 1.2
    lo = link(bpy.data.objects.new("curve_glow", li), c)
    lo.location = P(x, yc - r * 0.55, zt + H * 0.55)
    show_from(lo, F_TURN0 + 10)
    parent(lo, piv)

    start = u["turn"] * math.pi
    key(piv, 1, rot=(0, 0, start))
    key(piv, F_TURN0, rot=(0, 0, start))
    key(piv, F_TURN1, rot=(0, 0, 0))
    product_light(c, dict(p, y=yp), F_TURN1 - 14)
    return Ro


# --------------------------------------------------------------------- guest --
def _guest(c):
    """cl.guest with a different route: in from stage left, turns the handle, then walks back to stand behind the
    lectern before the revolves move (about 5 ft clear of the nearest rotating edge)."""
    suit = mat("guest_suit", (0.20, 0.23, 0.30), 0.62)
    skin = mat("guest_skin", (0.60, 0.47, 0.38), 0.6)
    stand = (CX - 0.82, CY - 1.5)
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
    a0, a1, b0, b1 = 2, F_TOUCH - 10, F_TOUCH + 22, F_TURN0 - 10
    start, away = (-24.0, -4.6), (-17.45, -3.5)
    key(root, a0, loc=P(start[0], start[1], DECK_H), rot=(0, 0, math.radians(90)))
    key(root, a1 - 5, rot=(0, 0, math.radians(90)))
    key(root, a1, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0 + 6, rot=(0, 0, math.radians(-85)))
    key(root, b1 - 6, rot=(0, 0, math.radians(-85)))
    key(root, b1, loc=P(away[0], away[1], DECK_H), rot=(0, 0, 0))
    for (fa, fb) in ((a0, a1), (b0, b1)):
        f, k = fa, 0
        while f <= fb:
            sw = 0 if f + 5 > fb else math.radians(24) * (1 if k % 2 == 0 else -1)
            key(legs[0], f, rot=(sw, 0, 0))
            key(legs[1], f, rot=(-sw, 0, 0))
            key(arm_l, f, rot=(sw * 0.7, 0, 0))
            f += 5
            k += 1
    key(arm_r, a1, rot=(0, 0, 0))                                    # the cue: hand on the handle, quarter turn
    key(arm_r, F_TOUCH - 10, rot=(math.radians(-48), 0, math.radians(14)))
    key(arm_r, F_TOUCH + 4, rot=(math.radians(-48), 0, math.radians(-16)))
    key(arm_r, b0 - 6, rot=(math.radians(-48), 0, math.radians(-16)))
    key(arm_r, b0 + 2, rot=(0, 0, 0))
    return root


# ------------------------------------------------------------------- effects --
def _finale(c, f):
    """Effects kept off the units: CO2 upstage between and outside the revolves, sparks at the upstage corners,
    a light confetti drop high and upstage of the LED curves."""
    for x in (-20.0, -2.3, 0.2, 19.3):
        j = fx.co2_jet(c, x, -18.6, DECK_H, height=14, t=0.9)
        origin_to(j, "bottom")
        key(j, 1, hide=True)
        key(j, f - 1, hide=True)
        key(j, f, hide=False, scale=(0.5, 0.5, 0.05))
        key(j, f + 8, scale=(1, 1, 1))
        key(j, f + 30, scale=(1.3, 1.3, 1.1))
        key(j, f + 31, hide=True)
    for i, x in enumerate((-26.5, -23.5, 23.5, 26.5)):
        vs = [fx.spark_fountain(c, x, -17.5, DECK_H, height=14, count=480, t=1.0, seed=40 + i * 7 + k) for k in range(3)]
        for k, o in enumerate(vs):
            key(o, 1, hide=True)
            for fr in range(f, END + 1):
                key(o, fr, hide=((fr - f) % 3 != k))
    o = fx.confetti(c, -24, 24, -19.6, -17.8, DECK_H + 15, DECK_H + 30, count=900, seed=5, name="confetti_up", size=0.72)
    key(o, 1, hide=True)
    key(o, f + 3, hide=True)
    key(o, f + 4, hide=False, loc=Vector((0, 0, 1.6)))
    key(o, END, loc=Vector((0.3, 0, -0.5)))


def _path(c, pts, f0, f1, glow, z=DECK_H, w=0.3):
    """cl.lit_path with a gentler travelling head (the shared one blows out on the scenic backs)."""
    segs = []
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = max(1, round(math.hypot(bx - ax, by - ay) / 1.3))
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            segs.append(((ax + (bx - ax) * t0, ay + (by - ay) * t0), (ax + (bx - ax) * t1, ay + (by - ay) * t1)))
    for i, ((ax, ay), (bx, by)) in enumerate(segs):
        x0, x1 = min(ax, bx) - w, max(ax, bx) + w
        y0, y1 = min(ay, by) - w, max(ay, by) + w
        box(c, "led_channel", x0 - 0.07, x1 + 0.07, y0 - 0.07, y1 + 0.07, z, z + 0.05, m_["steel"])
        show_from(box(c, "led_pixels", x0, x1, y0, y1, z + 0.05, z + 0.08, glow), f0 + round(i * (f1 - f0) / max(1, len(segs))))
    head = pulse_head(c, [(x, y, z + 0.22) for x, y in pts], f0, f1, glow)
    for ch in head.children:
        if ch.type == "LIGHT":
            ch.data.energy = 220


def _wall_wake(c, f0, f1):
    """Main LED wall: black until f0, then slim columns rise from the centre out and settle into a calm deep-blue
    field (kept darker than the two LED curves so they stay the brightest thing on stage). No text."""
    yf = -DECK_D - 0.5
    z0, H, W = V.LED_Z0, V.LED_H, V.LED_W
    glow = emissive("rev_wall", (0.35, 0.55, 1.0), 1.5)
    n = 28
    for i in range(n):
        x = -W / 2 + (i + 0.5) * W / n
        d = abs(i - (n - 1) / 2) / (n / 2)
        b = origin_to(box(c, "led_column", x - 0.16, x + 0.16, yf - 0.01, yf, z0 + 0.3, z0 + H - 0.3, glow), "bottom")
        fa = f0 + round(d * 12)
        key(b, 1, hide=True)
        key(b, fa - 1, hide=True)
        key(b, fa, hide=False, scale=(1, 1, 0.02))
        key(b, fa + 12, scale=(1, 1, 1))
        key(b, f1, scale=(1, 1, 1))
        key(b, f1 + 14, scale=(1, 1, 0.02))
        key(b, f1 + 15, hide=True)
    field = emissive("rev_wall_field", (0.003, 0.009, 0.03), 1.0)
    show_from(box(c, "led_field", -W / 2, W / 2, yf - 0.012, yf - 0.002, z0, z0 + H, field), f0 + 10)


def build(c):
    """Two revolving stages, each carrying a product inside a semicircular LED wall (no roof). The guest turns the
    handle; light runs across the deck to each revolve's rim; the main wall wakes; both revolves turn 180."""
    warm = emissive("rev_signal", (1.0, 0.72, 0.38), 9)
    seam = emissive("rev_seam", (1.0, 0.82, 0.55), 9)
    console(c, "TURN", warm, "handle")
    fascia_run(c, F_PATH0, F_PATH1, warm)
    for i, (p, u) in enumerate(zip(PRODUCTS, UNITS)):
        ro = _unit(c, i, p, u, warm, seam)
        sg = -1 if p["x"] < CX else 1
        _path(c, [(CX + sg * 1.5, CY), (p["x"], CY), (p["x"], u["yc"] + ro + 0.3)], F_PATH0, F_PATH1, warm)
    _wall_wake(c, F_RIM, F_TURN0)
    _guest(c)
    _finale(c, F_FX)
