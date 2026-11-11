"""Concept: sunwall (THE SUN WALL). Daylight-native reveal: the sun is the light source and the effect.

Each product stands inside a curved kinetic wall of small two-sided tiles (matte black outside, brushed mirror
inside) carried on vertical shafts that hang from a curved track, like a giant set of vertical blinds. One small
motor per SHAFT (not per tile) turns it; two traverse drives per wall draw the shafts round the track.

Beats: 36 palm on the console · 40-70 a low "fuse" rail of flip tiles runs the cue across the deck to both walls ·
70-104 the flip wave runs round each wall from its front centre (black -> mirror, a band of sun-flash travels) ·
84 LED wall wakes · 116-137 a return ripple runs back to the front · 138-156 the shafts turn edge-on ·
156-176 they draw apart round the track and park behind the product · 184 effects · hold to 240.
"""
from cl import *
import random

OWN_GUEST = True
F_FUSE0, F_FUSE1 = 40, 70
F_FLIP, FLIP_SPAN, FLIP_T = 70, 26, 6
F_RIP = 112
F_EDGE, EDGE_SPAN, EDGE_T = 138, 8, 9
F_DRAW0, F_DRAW1 = 156, 176
F_FX = 184
PITCH, TILE, THK = 0.70, 0.686, 0.045          # shaft pitch, tile size, tile thickness (ft)
TH_MAX = math.radians(122)                     # the wall wraps 122 degrees each side of front centre; back is open
FUSE_Y = -4.7

# product centre y, wall radius, tile rows
UNITS = (dict(y=-11.0, r=5.2, rows=13), dict(y=-12.0, r=6.7, rows=14))

SHOTS = [(1, (-13.0, 14.0, 9.8), (-4.5, -4.0, 6.0)),                  # guest walking along the deck front to the console
         (F_TOUCH + 6, (-9.5, 13.5, 9.4), (-1.8, -4.0, 5.8)),        # the palm goes down
         (F_FUSE1 - 2, (-3.5, 21, 9.8), (-1.0, -6.0, 6.0)),          # pulling back as the fuse runs to both walls
         (104, (-12, 31, 8.6), (-0.5, -9.0, 7.6)),                   # drifting across the sparkle wave
         (F_EDGE - 4, (0, 41, 7.2), (0, -10, 8.8)),                  # centre aisle, whole stage, for the reveal
         (F_DRAW1 + 4, (0, 39, 7.0), (0, -10.5, 8.6)),
         (END, (0.4, 29.5, 6.4), (0.4, -11.2, 8.0))]                 # slow push for the hero hold


# ------------------------------------------------------------------ geometry --
def _mesh(c, name, bm, mats):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    return link(bpy.data.objects.new(name, me), c)


def _arc(c, name, x, y, r0, r1, z0, z1, t0, t1, material, steps=72):
    """Curved rail segment in plan feet around (x, y); angles measured from front centre (toward the audience)."""
    bm = bmesh.new()
    for s in range(steps):
        a, b = t0 + (t1 - t0) * s / steps, t0 + (t1 - t0) * (s + 1) / steps
        v = [bm.verts.new(P(x + math.sin(t) * r, y + math.cos(t) * r, z)) for z in (z0, z1) for (t, r) in ((a, r0), (b, r0), (b, r1), (a, r1))]
        for q in ((0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (2, 3, 7, 6), (1, 2, 6, 5), (3, 0, 4, 7)):
            bm.faces.new([v[i] for i in q])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    return _mesh(c, name, bm, [material])


def _tile(bm, w, t, z0, z1, ang, mats=(0, 1, 2)):
    """One tile in shaft-local metres: dark face toward -Y (outward when closed), mirror face toward +Y."""
    rz = Matrix.Rotation(ang, 3, "Z")
    v = [bm.verts.new(rz @ Vector((sx * w / 2, sy * t / 2, z))) for z in (z0, z1) for (sx, sy) in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    for q, mi in (((0, 1, 5, 4), mats[0]), ((2, 3, 7, 6), mats[1]), ((0, 1, 2, 3), mats[2]), ((4, 5, 6, 7), mats[2]), ((1, 2, 6, 5), mats[2]), ((3, 0, 4, 7), mats[2])):
        bm.faces.new([v[i] for i in q]).material_index = mi


def _windows(o, wins):
    """Object visible only inside the given (first, last) frame windows."""
    key(o, 1, hide=True)
    for a, b in wins:
        key(o, a - 1, hide=True)
        key(o, a, hide=False)
        key(o, b + 1, hide=True)


def _product(c, p, y):
    """Copy of hero.product with its own y (product two sits 1 ft further upstage so its wall clears the fuse rail)."""
    x, s, z = p["x"], p["size"] / 2, DECK_H
    box(c, "plinth", x - s - 0.7, x + s + 0.7, y - s - 0.7, y + s + 0.7, z + 0.14, z + PL, m_["plinth"], 0.02)
    box(c, "plinth_shadow_gap", x - s - 0.55, x + s + 0.55, y - s - 0.55, y + s + 0.55, z, z + 0.14, m_["black"])
    warm = mat("plinth_edge_light", (1, 0.6, 0.2), 0.4, emit=(1.0, 0.55, 0.16), strength=30.0)
    show_from(box(c, "plinth_underglow", x - s - 0.62, x + s + 0.62, y + s + 0.56, y + s + 0.6, z + 0.03, z + 0.11, warm), F_EDGE)
    body = mat("product_silver", (0.62, 0.64, 0.67), 0.26, 1.0, coat=0.5)
    zp = z + PL
    box(c, "product_lower", x - s, x + s, y - s, y + s, zp, zp + p["h"] * 0.58, body, 0.09)
    box(c, "product_seam_off", x - s + 0.13, x + s - 0.13, y - s + 0.13, y + s - 0.13, zp + p["h"] * 0.58, zp + p["h"] * 0.60, m_["black"])
    show_from(box(c, "product_seam", x - s + 0.12, x + s - 0.12, y - s + 0.12, y + s - 0.12, zp + p["h"] * 0.58, zp + p["h"] * 0.60, warm), F_EDGE)
    box(c, "product_upper", x - s + 0.25, x + s - 0.25, y - s + 0.25, y + s - 0.25, zp + p["h"] * 0.60, zp + p["h"], body, 0.14)
    text(c, "plinth_label", f"PRODUCT {p['name']}", P(x, y + s + 0.705, z + PL * 0.55), 0.085, m_["ink"], spacing=1.7)


# ------------------------------------------------------------------ the wall --
def _wall(c, wi, p, u, M):
    x, y, r, rows = p["x"], u["y"], u["r"], u["rows"]
    z = DECK_H
    Z0 = 0.34                                   # bottom of the tile field above the deck
    H = Z0 + rows * PITCH                       # underside of the top track
    rng = random.Random(11 + wi)
    frame, dark, mirror, edge, glint = M["frame"], M["dark"], M["mirror"], M["edge"], M["glint"]

    # ---- fixed structure: bottom guide rail, curved top track, four slim posts, rear tie, ballast feet
    e = TH_MAX + math.radians(5)
    _arc(c, f"sun_floor_rail_{wi}", x, y, r - 0.16, r + 0.16, z, z + 0.14, -e, e, frame)
    _arc(c, f"sun_top_track_{wi}", x, y, r - 0.36, r + 0.36, z + H + 0.02, z + H + 0.42, -e, e, frame)
    _arc(c, f"sun_top_trim_{wi}", x, y, r + 0.36, r + 0.385, z + H + 0.16, z + H + 0.28, -e, e, M["trim"])
    posts = []
    for th in (-e, -math.radians(50), math.radians(50), e):
        px, py = x + math.sin(th) * (r + 0.5), y + math.cos(th) * (r + 0.5)
        posts.append((px, py))
        box(c, f"sun_post_{wi}", px - 0.12, px + 0.12, py - 0.12, py + 0.12, z, z + H + 0.42, frame, 0.01)
        box(c, f"sun_post_foot_{wi}", px - 0.75, px + 0.75, py - 0.75, py + 0.75, z, z + 0.07, m_["steel_dark"], 0.004)
        box(c, f"sun_post_arm_{wi}", min(px, x + math.sin(th) * r) - 0.1, max(px, x + math.sin(th) * r) + 0.1,
            min(py, y + math.cos(th) * r) - 0.1, max(py, y + math.cos(th) * r) + 0.1, z + H + 0.42, z + H + 0.54, frame)
    (ax, ay), (bx, by) = posts[0], posts[3]
    box(c, f"sun_rear_tie_{wi}", ax, bx, ay - 0.12, ay + 0.12, z + H + 0.18, z + H + 0.42, frame, 0.01)
    for px in (ax, bx):                          # ballast at the two rear posts (out of the audience's eyeline)
        box(c, f"sun_ballast_{wi}", px - 0.9, px + 0.9, ay - 2.4, ay - 0.5, z, z + 1.1, m_["concrete"], 0.03)

    # ---- shafts: each one object (rod + its stack of tiles), hung from a carrier that rides the curved track
    n = round(2 * TH_MAX * r / PITCH)
    thetas = [-TH_MAX + (i + 0.5) * 2 * TH_MAX / n for i in range(n)]
    dpark = 0.17 / r
    slot = {}
    for sg in (-1, 1):
        side = sorted((i for i in range(n) if (thetas[i] >= 0) == (sg > 0)), key=lambda i: -abs(thetas[i]))
        for j, i in enumerate(side):
            slot[i] = sg * (TH_MAX - j * dpark)
    w, t, hh = TILE * FT, THK * FT, (PITCH - 0.014) * FT
    for i, th in enumerate(thetas):
        d = abs(th) / TH_MAX                     # 0 at front centre, 1 at the two back ends
        sg = 1 if th >= 0 else -1
        piv = bpy.data.objects.new(f"sun_carrier_{wi}", None)
        link(piv, c)
        piv.location = P(x, y, z)
        piv.empty_display_size = 0.05
        bm = bmesh.new()
        gA = bmesh.new()
        _tile(bm, 0.05 * FT, 0.05 * FT, 0.14 * FT, (H + 0.05) * FT, 0, (2, 2, 2))            # the shaft itself
        for k in range(rows):
            a = math.radians(rng.uniform(-2.0, 2.0))                                          # hand-set facet, gives the shimmer
            za = (Z0 + k * PITCH) * FT
            _tile(bm, w, t, za, za + hh, a)
            if rng.random() > 0.6:
                continue
            g = gA
            rz = Matrix.Rotation(a, 3, "Z")
            m = 0.07 * FT
            g.faces.new([g.verts.new(rz @ Vector((sx * (w / 2 - m), t / 2 + 0.004, zz))) for (sx, zz) in ((-1, za + m), (1, za + m), (1, za + hh - m), (-1, za + hh - m))])
        sh = _mesh(c, f"sun_shaft_{wi}", bm, [dark, mirror, edge])
        sh.parent = piv
        sh.location = Vector((0, -r * FT, 0))
        # rotation: closed (black out) -> flip to mirror -> return ripple -> edge-on (radial)
        f1 = F_FLIP + round(d * FLIP_SPAN)
        fr = F_RIP + round((1 - d) * 14)
        f3 = F_EDGE + round(d * EDGE_SPAN)
        key(sh, 1, rot=(0, 0, 0))
        key(sh, f1, rot=(0, 0, 0))
        key(sh, f1 + FLIP_T, rot=(0, 0, sg * math.pi))
        key(sh, fr, rot=(0, 0, sg * math.pi))
        key(sh, fr + 5, rot=(0, 0, sg * (math.pi - 0.5)))
        key(sh, fr + 11, rot=(0, 0, sg * math.pi))
        key(sh, f3, rot=(0, 0, sg * math.pi))
        key(sh, f3 + EDGE_T, rot=(0, 0, sg * math.pi * 1.5))
        # the carrier travels round the track to its parking slot behind the product
        key(piv, 1, rot=(0, 0, th))
        key(piv, F_DRAW0, rot=(0, 0, th))
        key(piv, F_DRAW1, rot=(0, 0, slot[i]))
        # sun-flash: the moment each mirror face sweeps through the sun
        go = _mesh(c, f"sun_flash_{wi}", gA, [glint])
        go.parent = sh
        _windows(go, [(f1 + 3, f1 + 5), (fr + 3, fr + 5), (f3 + 1, f3 + 2)])
    return n, H


# ---------------------------------------------------------------- the "fuse" --
def _fuse(c, M):
    """Low kerb rail of small flip tiles carrying the cue from the console to the front centre of each wall."""
    z = DECK_H
    ys = CY - 0.95
    pts = [(CX, ys - 0.25, 0.0)]
    routes = []
    for p, u in zip(PRODUCTS, UNITS):
        sg = -1 if p["x"] < CX else 1
        yend = u["y"] + u["r"] + 0.45
        leg = []
        xx = CX + sg * 0.6
        while abs(xx - CX) <= abs(p["x"] - CX) + 1e-6:
            leg.append((xx, FUSE_Y, abs(xx - CX) + 0.6))
            xx += sg * 0.6
        yy = FUSE_Y - 0.6
        while yy > yend:
            leg.append((p["x"], yy, abs(p["x"] - CX) + (FUSE_Y - yy) + 0.6))
            yy -= 0.6
        routes.append(leg)
        box(c, "fuse_rail", min(CX, p["x"]) - 0.1, max(CX, p["x"]) + 0.1, FUSE_Y - 0.09, FUSE_Y + 0.09, z, z + 0.16, M["frame"], 0.01)
        box(c, "fuse_rail", p["x"] - 0.09, p["x"] + 0.09, yend, FUSE_Y, z, z + 0.16, M["frame"], 0.01)
    box(c, "fuse_rail", CX - 0.09, CX + 0.09, FUSE_Y, ys, z, z + 0.16, M["frame"], 0.01)
    dmax = max(q[2] for leg in routes for q in leg)
    w, t, h0, h1 = 0.52 * FT, 0.04 * FT, 0.2 * FT, 0.74 * FT
    for (fx_, fy, dd) in pts + [q for leg in routes for q in leg]:
        bm = bmesh.new()
        _tile(bm, w, t, h0, h1, 0)
        _tile(bm, 0.04 * FT, 0.04 * FT, 0.1 * FT, h0, 0, (2, 2, 2))
        o = _mesh(c, "fuse_tile", bm, [M["dark"], M["mirror"], M["edge"]])
        o.location = P(fx_, fy, z)
        f = F_FUSE0 + round(dd / dmax * (F_FUSE1 - F_FUSE0 - 6))
        key(o, 1, rot=(0, 0, 0))
        key(o, f, rot=(0, 0, 0))
        key(o, f + 6, rot=(0, 0, math.pi))
        g = bmesh.new()
        g.faces.new([g.verts.new(Vector((sx * w * 0.42, t / 2 + 0.004, zz))) for (sx, zz) in ((-1, h0 + 0.02), (1, h0 + 0.02), (1, h1 - 0.02), (-1, h1 - 0.02))])
        go = _mesh(c, "fuse_flash", g, [M["glint"]])
        go.parent = o
        _windows(go, [(f + 3, f + 5)])


# --------------------------------------------------------------------- guest --
def _guest(c):
    """cl.guest with its own route: in along the deck front from stage left, palm on the console from its side,
    then back the same way to stand at the stage-left front corner, well clear of the walls and the fuse rail."""
    suit = mat("guest_suit", (0.20, 0.23, 0.30), 0.62)
    skin = mat("guest_skin", (0.60, 0.47, 0.38), 0.6)
    stand = (CX - 1.95, CY + 0.1)
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
    a0, a1, b0, b1 = 2, F_TOUCH - 8, F_TOUCH + 20, F_TOUCH + 76
    start, away = (-11.5, -2.3), (-21.5, -2.6)
    east, west = math.radians(90), math.radians(-90)
    key(root, a0, loc=P(start[0], start[1], DECK_H), rot=(0, 0, east))
    key(root, a1, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, east))
    key(root, b0, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, east))
    key(root, b0 + 8, rot=(0, 0, west))
    key(root, b1 - 8, rot=(0, 0, west))
    key(root, b1, loc=P(away[0], away[1], DECK_H), rot=(0, 0, math.radians(140)))     # turns to watch the walls
    for (fa, fb) in ((a0, a1), (b0, b1)):
        f, k = fa, 0
        while f <= fb:
            sw = 0 if f + 5 > fb else math.radians(24) * (1 if k % 2 == 0 else -1)
            key(legs[0], f, rot=(sw, 0, 0))
            key(legs[1], f, rot=(-sw, 0, 0))
            key(arm_l, f, rot=(sw * 0.7, 0, 0))
            f += 5
            k += 1
    key(arm_r, a1, rot=(0, 0, 0))                    # the cue: palm onto the console pad
    key(arm_r, F_TOUCH, rot=(math.radians(-46), 0, 0))
    key(arm_r, b0 - 6, rot=(math.radians(-46), 0, 0))
    key(arm_r, b0 + 2, rot=(0, 0, 0))
    return root


# ------------------------------------------------------------------- effects --
def _led(c, f0):
    """Main LED wall: black until f0, then slim warm columns rise from the centre out and settle to a calm low
    amber field (daylight: the wall supports, the sun does the work). No text."""
    yf = -DECK_D - 0.5
    z0, H, W = V.LED_Z0, V.LED_H, V.LED_W
    glow = emissive("sun_led_col", (1.0, 0.70, 0.30), 5.0)
    n = 28
    for i in range(n):
        x = -W / 2 + (i + 0.5) * W / n
        d = abs(i - (n - 1) / 2) / (n / 2)
        b = origin_to(box(c, "led_column", x - 0.14, x + 0.14, yf - 0.01, yf, z0 + 0.3, z0 + H - 0.3, glow), "bottom")
        fa = f0 + round(d * 14)
        key(b, 1, hide=True)
        key(b, fa - 1, hide=True)
        key(b, fa, hide=False, scale=(1, 1, 0.02))
        key(b, fa + 14, scale=(1, 1, 1))
    bands = 6
    for k in range(bands):
        t = k / (bands - 1)
        col = (0.30 - 0.22 * t, 0.15 - 0.10 * t, 0.035 + 0.06 * t)
        show_from(box(c, "led_field", -W / 2, W / 2, yf - 0.012, yf - 0.002, z0 + H * k / bands, z0 + H * (k + 1) / bands,
                      emissive(f"sun_led_band_{k}", col, 0.9)), f0 + 12)


def _fx(c, f):
    """Daylight effects only: CO2 jets upstage of the walls and a high drift of metallic confetti that catches the
    sun. No pyro or sparks (they wash out at noon)."""
    for x in (-19.5, -1.0, 20.0):
        j = fx.co2_jet(c, x, -17.5, DECK_H, height=15, t=0.9)
        origin_to(j, "bottom")
        key(j, 1, hide=True)
        key(j, f - 1, hide=True)
        key(j, f, hide=False, scale=(0.5, 0.5, 0.05))
        key(j, f + 8, scale=(1, 1, 1))
        key(j, f + 30, scale=(1.35, 1.35, 1.1))
        key(j, f + 31, hide=True)
    o = fx.confetti(c, -23, 23, -19.5, -15.5, DECK_H + 15, DECK_H + 32, count=800, seed=7, name="confetti_sun", size=0.7)
    key(o, 1, hide=True)
    key(o, f + 3, hide=True)
    key(o, f + 4, hide=False, loc=Vector((0, 0, 1.8)))
    key(o, END, loc=Vector((0.4, 0, -0.9)))


def build(c):
    M = dict(
        dark=mat("sun_tile_dark", (0.016, 0.017, 0.02), 0.5, coat=0.25),
        mirror=mat("sun_tile_mirror", (0.95, 0.93, 0.88), 0.10, 1.0),
        edge=mat("sun_tile_edge", (0.05, 0.05, 0.055), 0.45, 0.8),
        frame=mat("sun_frame", (0.03, 0.032, 0.036), 0.42, 0.6, coat=0.2),
        trim=mat("sun_trim", (0.86, 0.66, 0.34), 0.25, 1.0),
        glint=emissive("sun_glint", (1.0, 0.95, 0.80), 30.0),
    )
    pad = emissive("sun_pad", (1.0, 0.78, 0.42), 9)
    console(c, "TOUCH", pad, "palm")
    for wi, (p, u) in enumerate(zip(PRODUCTS, UNITS)):
        _product(c, p, u["y"])
        n, H = _wall(c, wi, p, u, M)
        print(f"SUNWALL wall {wi}: {n} shafts x {u['rows']} tiles = {n * u['rows']} tiles, {H:.1f} ft high")
    _fuse(c, M)
    _led(c, F_WAKE)
    _guest(c)
    _fx(c, F_FX)
    print(f"SUNWALL concept objects: {len(c.objects)}")
