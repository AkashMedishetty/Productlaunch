"""Concept: cargo (THE CARGO VAULT). Owns everything specific to this reveal. Shared helpers come from cl.py.

Uses the spec's own mitigation: two opposing front doors per vault + fixed back, sides and roof light box.
Each leaf is hinged on a corner post and swings outward 105 degrees to a mechanical stop, so the open vault
stays standing and frames the product. Nothing falls flat, nothing reaches the console, LED wall or stage lip.

Beats (24 fps): guest turns the handle 26-40 · signal runs deck channels + stage fascia 40-70 · climbs the door
seam 70-78 · lock lights amber->white one by one 80-104 · LED wall wakes 84-120 · fog from under the doors 110 ·
lock bars throw 126-136 · doors burst 138-162 · effects 180 · hero hold to 240.
"""
from cl import *

OWN_GUEST = True
OPEN_DEG = 105.0
F_SEAM, F_LOCK0, LOCK_STEP = 70, 80, 8
F_FOG, F_FX = 110, 180
AWAY = (-17.45, -4.6)        # the guest returns to the lectern, 2 ft outside the nearest door's swing

SHOTS = [(1, (-12.5, 13, 9.5), (-6.5, -4.6, DECK_H + 3.2)),          # on the guest walking to the console
         (F_TOUCH + 4, (-7.5, 9.0, 9.2), (CX, CY - 1.0, DECK_H + 3.0)),         # the handle turn
         (F_SEAM, (-2.5, 21, 13.5), (0, -6.5, DECK_H + 2.0)),                   # rising: signal crosses the deck
         (104, (0, 31, 8.6), (0, -10, 7.6)),                                    # lock lights + LED wall waking
         (F_REVEAL - 6, (0, 35, 6.8), (0, -10, 8.2)),                           # whole stage, centre aisle
         (190, (0, 30, 6.6), (0, -10.5, 7.8)),
         (END, (0, 23, 6.4), (0, -10.5, 7.4))]                                  # slow push to the open vaults


def _chevrons(c, name, x0, x1, yf, z0, z1, ink, piv=None):
    """Diagonal hazard stripes (plan feet) on a vertical face at y=yf, facing the audience."""
    bm = bmesh.new()
    w = (z1 - z0)
    xa = x0
    while xa + 2 * w <= x1 + 1e-6:
        vs = [bm.verts.new(P(xa, yf, z0)), bm.verts.new(P(xa + w, yf, z0)), bm.verts.new(P(xa + 2 * w, yf, z1)), bm.verts.new(P(xa + w, yf, z1))]
        bm.faces.new(vs)
        xa += 2 * w
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(ink)
    o = link(bpy.data.objects.new(name, me), c)
    return parent(o, piv) if piv else o


def _area(c, name, loc, size_ft, energy, color, f):
    li = bpy.data.lights.new(name, "AREA")
    li.shape = "SQUARE"
    li.size = size_ft * FT
    li.energy = energy
    li.color = color
    o = link(bpy.data.objects.new(name, li), c)
    o.location = loc            # default orientation shines straight down
    return show_from(o, f)


def _spot(c, name, loc, aim, energy, deg, f):
    li = bpy.data.lights.new(name, "SPOT")
    li.energy = energy
    li.spot_size = math.radians(deg)
    li.spot_blend = 0.5
    li.color = (1.0, 0.93, 0.84)
    o = link(bpy.data.objects.new(name, li), c)
    o.location = loc
    o.rotation_euler = (aim - loc).to_track_quat("-Z", "Y").to_euler()
    return show_from(o, f)


def _led(c, glow):
    """LED wall: black until F_WAKE, then a restrained technical pattern (thin rising lines, then two datum rules).
    No text, no filled blocks; it stays dark enough to sit behind the vaults."""
    yf = -DECK_D - 0.5
    z0, H, W = V.LED_Z0, V.LED_H, V.LED_W
    n = 15
    for i in range(n):
        x = -W / 2 + (i + 0.5) * W / n
        d = abs(i - (n - 1) / 2) / (n / 2)
        b = origin_to(box(c, "led_line", x - 0.09, x + 0.09, yf - 0.01, yf, z0 + 0.4, z0 + H - 0.4, glow), "bottom")
        fa = F_WAKE + round(d * 14)
        key(b, 1, hide=True)
        key(b, fa - 1, hide=True)
        key(b, fa, hide=False, scale=(1, 1, 0.02))
        key(b, fa + 16, scale=(1, 1, 1))
    for zz in (z0 + H * 0.3, z0 + H * 0.82):
        r = box(c, "led_rule", -W / 2 + 0.5, W / 2 - 0.5, yf - 0.01, yf, zz - 0.06, zz + 0.06, glow)
        key(r, 1, hide=True)
        key(r, F_RETURN - 1, hide=True)
        key(r, F_RETURN, hide=False, scale=(0.01, 1, 1))
        key(r, F_RETURN + 16, scale=(1, 1, 1))


def _vault_fog(c, x, s, yf, i):
    """Low fog pushed out from under the doors: anchored on the door line, grows toward the audience."""
    y1 = min(yf + 6.5, 0.2)
    o = fx.low_fog(c, x - s - 3.5, x + s + 3.5, yf - 0.2, y1, DECK_H, height=2.4, density=1.5, name=f"vault_fog_{i}", seed=i * 3.1)
    base = o.location.copy()
    ly, lz = (y1 - yf + 0.2) * FT, 2.4 * FT
    ydoor, z0 = base.y + ly / 2, base.z - lz / 2

    def k(f, sx, sy, sz):
        key(o, f, loc=Vector((base.x, ydoor - ly * sy / 2, z0 + lz * sz / 2)), scale=(sx, sy, sz))
    key(o, 1, hide=True)
    key(o, F_FOG - 1, hide=True)
    key(o, F_FOG, hide=False)
    k(F_FOG, 0.55, 0.06, 0.25)
    k(F_REVEAL, 0.7, 0.55, 0.6)
    k(F_REVEAL + 30, 1.0, 1.0, 1.0)
    k(END, 1.15, 1.0, 0.8)


def _guest(c):
    """Copy of cl.guest with this concept's blocking: turn the handle, then walk to the lectern, clear of the doors."""
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
    a0, a1, b0, b1 = 2, F_TOUCH - 12, F_TOUCH + 18, 126
    start = (-20.0, -5.5)
    key(root, a0, loc=P(start[0], start[1], DECK_H), rot=(0, 0, math.radians(90)))
    key(root, a1 - 5, rot=(0, 0, math.radians(90)))
    key(root, a1, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0 + 8, rot=(0, 0, math.radians(-90)))
    key(root, b1 - 8, rot=(0, 0, math.radians(-90)))
    key(root, b1, loc=P(AWAY[0], AWAY[1], DECK_H), rot=(0, 0, math.radians(18)))
    for (fa, fb) in ((a0, a1), (b0, b1)):
        f, k = fa, 0
        while f <= fb:
            sw = 0 if f + 5 > fb else math.radians(24) * (1 if k % 2 == 0 else -1)
            key(legs[0], f, rot=(sw, 0, 0))
            key(legs[1], f, rot=(-sw, 0, 0))
            key(arm_l, f, rot=(sw * 0.7, 0, 0))
            f += 5
            k += 1
    key(arm_r, a1, rot=(0, 0, 0))                                   # reach for the handle, then turn it
    key(arm_r, F_TOUCH - 10, rot=(math.radians(-46), 0, math.radians(14)))
    key(arm_r, F_TOUCH + 4, rot=(math.radians(-40), 0, math.radians(-16)))
    key(arm_r, b0 - 6, rot=(math.radians(-40), 0, math.radians(-16)))
    key(arm_r, b0 + 2, rot=(0, 0, 0))
    return root


def _fx(c, f):
    """Copy of cl.finale tuned for the vaults: CO2 beside the fixed side walls, sparks upstage corners, light confetti."""
    for p in PRODUCTS:
        s = p["size"] / 2 + 1.5 + 2.4
        for sx in ((s,) if p["x"] < 0 else (-s,)):      # inner pair only: none near the guest at the lectern
            j = fx.co2_jet(c, p["x"] + sx, p["y"] - 0.5, DECK_H, height=15, t=0.9)
            origin_to(j, "bottom")
            key(j, 1, hide=True)
            key(j, f - 1, hide=True)
            key(j, f, hide=False, scale=(0.5, 0.5, 0.05))
            key(j, f + 8, scale=(1, 1, 1))
            key(j, f + 30, scale=(1.4, 1.4, 1.1))
            key(j, f + 31, hide=True)
    for i, x in enumerate((-27, -24.6, 24.6, 27)):
        vs = [fx.spark_fountain(c, x, -17.5, DECK_H, height=14, count=460, t=1.0, seed=40 + i * 7 + k) for k in range(3)]
        for k, o in enumerate(vs):
            key(o, 1, hide=True)
            for fr in range(f, END + 1):
                key(o, fr, hide=((fr - f) % 3 != k))
    o = fx.confetti(c, -24, 24, -19.5, -16.5, DECK_H + 14, 40, count=700, seed=5, name="confetti_cargo", size=0.72)
    key(o, 1, hide=True)
    key(o, f + 3, hide=True)
    key(o, f + 4, hide=False, loc=Vector((0, 0, 2.5)))
    key(o, END, loc=Vector((0.5, -0.3, -2.6)))


def build(c):
    amber = emissive("lock_amber", (1.0, 0.17, 0.0), 2.4)
    white = emissive("lock_white", (1.0, 0.97, 0.9), 16)
    sig = emissive("cargo_signal", (1.0, 0.62, 0.2), 9)
    warm = emissive("vault_strip", (1.0, 0.74, 0.42), 4)
    panel = emissive("vault_lightbox", (1.0, 0.93, 0.82), 1.6)
    led = emissive("cargo_led", (1.0, 0.5, 0.14), 4.5)
    steelp = V.pbr("vault_steel", "metal_plate", 0.5, tint=(0.21, 0.235, 0.25), metal=0.85)
    frame = mat("vault_frame", (0.045, 0.05, 0.055), 0.42, 0.8)
    liner = mat("vault_liner", (0.03, 0.032, 0.036), 0.6, 0.1)
    inner = mat("vault_door_inner", (0.10, 0.105, 0.115), 0.45, 0.6)
    brass = mat("vault_brass", (0.83, 0.60, 0.27), 0.3, 1.0)
    hazard = mat("vault_hazard", (0.95, 0.66, 0.04), 0.5)
    black = m_["ink"]
    wink = m_["whiteink"]

    products(c)
    console(c, "RELEASE", white, "handle")
    _led(c, led)                 # LED wall stays black until frame 84
    fascia_run(c, F_TOUCH + 4, F_SEAM, sig)
    z = DECK_H
    for i, p in enumerate(PRODUCTS):
        x, y, s, h = p["x"], p["y"], p["size"] / 2 + 1.5, p["h"] + PL + 1.2
        yf, yb = y + s, y - s
        t = 0.28                                       # wall / door thickness
        # ---- frame stays (skid, corner posts, roof light box); ALL FOUR WALLS are hinged at the base and fall outward
        fh = empty(c, f"vault_fall_front_{i}", P(x, yf, z + 0.22))
        bh = empty(c, f"vault_fall_back_{i}", P(x, yb, z + 0.22))
        shs = {}
        box(c, "vault_skid", x - s - 0.15, x + s + 0.15, yb - 0.15, yf - 0.05, z, z + 0.22, frame, 0.01)
        for sx in (-1, 1):
            for sy in (-1, 1):
                px, py = x + sx * (s - 0.25), y + sy * (s - 0.25)
                box(c, "vault_post", px - 0.25, px + 0.25, py - 0.25, py + 0.25, z, z + h, frame, 0.015)
                for zz in (z, z + h + 0.55):           # ISO-style corner castings
                    box(c, "vault_casting", px - 0.36, px + 0.36, py - 0.36, py + 0.36, zz, zz + 0.5, m_["steel_dark"], 0.03)
            xo = x + sx * s
            sh = shs[sx] = empty(c, f"vault_fall_side_{i}_{sx}", P(xo, y, z + 0.22))
            parent(box(c, "vault_side", min(xo, xo - sx * t), max(xo, xo - sx * t), yb + 0.5, yf - 0.5, z + 0.22, z + h, steelp, 0.005), sh)
            n = 6 if s < 4.5 else 8
            for k in range(n):                         # pressed corrugation on the fixed sides
                ry = yb + 0.5 + (k + 0.5) * (2 * s - 1.0) / n
                parent(box(c, "vault_side_rib", min(xo, xo + sx * 0.09), max(xo, xo + sx * 0.09), ry - 0.22, ry + 0.22, z + 0.45, z + h - 0.3, steelp, 0.02), sh)
            xi = xo - sx * t
            parent(box(c, "vault_side_liner", min(xi, xi - sx * 0.04), max(xi, xi - sx * 0.04), yb + 0.3, yf - 0.5, z + 0.22, z + h - 0.1, liner), sh)
            parent(show_from(box(c, "vault_strip", min(xi - sx * 0.06, xi - sx * 0.2), max(xi - sx * 0.06, xi - sx * 0.2), yb + t + 0.06, yb + t + 0.2, z + 0.5, z + h - 0.4, warm), F_REVEAL - 2), sh)
        parent(box(c, "vault_back", x - s + 0.5, x + s - 0.5, yb, yb + t, z + 0.22, z + h, steelp, 0.005), bh)
        parent(box(c, "vault_back_liner", x - s + t, x + s - t, yb + t, yb + t + 0.04, z + 0.22, z + h - 0.1, liner), bh)
        for k in range(1, 4):                          # service-panel joints on the back liner
            zz = z + 0.22 + k * (h - 0.3) / 4
            parent(box(c, "vault_liner_joint", x - s + 0.6, x + s - 0.6, yb + t + 0.04, yb + t + 0.055, zz - 0.02, zz + 0.02, frame), bh)
        box(c, "vault_floor", x - s + t, x + s - t, yb + t, yf - 0.1, z + 0.22, z + 0.26, liner)
        hz0 = z + h - 0.75
        parent(box(c, "vault_header", x - s + 0.5, x + s - 0.5, yf - t, yf + 0.03, hz0, z + h, frame, 0.01), fh)
        _chevrons(c, "vault_header_hazard_bg", x - s + 0.6, x + s - 0.6, yf + 0.035, z + h - 0.2, z + h - 0.06, hazard, fh)
        parent(text(c, "vault_stencil", f"VAULT {p['name']}", P(x, yf + 0.04, hz0 + 0.3), 0.105, wink, spacing=1.7), fh)
        box(c, "vault_sill", x - s + 0.5, x + s - 0.5, yf - 0.4, yf + 0.03, z, z + 0.3, frame, 0.008)
        box(c, "vault_roof", x - s - 0.2, x + s + 0.2, yb - 0.2, yf + 0.2, z + h, z + h + 0.55, frame, 0.02)
        box(c, "vault_roof_cap", x - s + 0.3, x + s - 0.3, yb + 0.3, yf - 0.3, z + h + 0.55, z + h + 0.95, steelp, 0.03)
        for k in range(5):                             # roof light box vent slots
            vx = x - s + 0.9 + k * (2 * s - 1.8) / 4
            box(c, "vault_roof_vent", vx - 0.3, vx + 0.3, yf + 0.2, yf + 0.215, z + h + 0.16, z + h + 0.4, m_["grille"])
        show_from(box(c, "vault_toplight", x - s + 0.9, x + s - 0.9, yb + 0.9, yf - 0.9, z + h - 0.05, z + h, panel), F_REVEAL - 2)
        _area(c, "vault_top_area", P(x, y, z + h - 0.25), 2 * s - 2.2, 300 if s < 4.5 else 420, (1.0, 0.92, 0.8), F_REVEAL - 2)
        _spot(c, "vault_front_key", P(x * 0.75, yf + 13, z + 8.5), P(x, y, z + PL + p["h"] * 0.55), 1500, 30, F_REVEAL + 6)
        # ---- two opposing door leaves, hinged on the front posts, 105 degrees to a hard stop
        lz0, lz1 = z + 0.34, hz0 - 0.04
        lockz = lz0 + (lz1 - lz0) * 0.56
        lock_x = (x - 1.35, x - 0.5, x + 0.5, x + 1.35)
        for sg in (-1, 1):                             # -1: stage-left leaf, +1: stage-right leaf
            hx = x + sg * (s - 0.5)
            piv = empty(c, f"vault_hinge_{i}_{sg}", P(hx, yf, z))
            parent(piv, fh)
            xa, xb = sorted((hx, x + sg * 0.02))
            parent(box(c, "vault_door", xa, xb, yf - t, yf, lz0, lz1, steelp, 0.008), piv)
            parent(box(c, "vault_door_inner", xa + 0.1, xb - 0.1, yf - t - 0.03, yf - t, lz0 + 0.1, lz1 - 0.1, inner), piv)
            for (a0, a1, b0, b1) in ((xa, xb, lz0, lz0 + 0.2), (xa, xb, lz1 - 0.2, lz1), (xa, xa + 0.2, lz0, lz1), (xb - 0.2, xb, lz0, lz1)):
                parent(box(c, "vault_door_frame", a0, a1, yf, yf + 0.07, b0, b1, frame, 0.006), piv)
            wd = xb - xa
            for k in range(4):                         # pressed vertical ribs between the lock bars
                rx = xa + 0.42 + (k + 0.5) * (wd - 0.84) / 4
                parent(box(c, "vault_door_rib", rx - 0.2, rx + 0.2, yf, yf + 0.06, lz0 + 1.25, lz1 - 0.45, steelp, 0.02), piv)
                parent(box(c, "vault_door_rib_in", rx - 0.2, rx + 0.2, yf - t - 0.08, yf - t - 0.03, lz0 + 0.5, lz1 - 0.5, inner, 0.02), piv)
            for fr in (0.3, 0.72):                     # brass lock bars with keepers and throw handles
                bx = xa + wd * fr if sg < 0 else xb - wd * fr
                bar = parent(box(c, "vault_lockbar", bx - 0.065, bx + 0.065, yf + 0.09, yf + 0.22, lz0 - 0.04, lz1 + 0.04, brass, 0.02), piv)
                key(bar, F_REVEAL - 12, loc=bar.location.copy())
                key(bar, F_REVEAL - 3, loc=bar.location + Vector((0, 0, -0.22 * FT)))
                for zz in (lz0 + 0.5, lz0 + (lz1 - lz0) * 0.5, lz1 - 0.5):
                    parent(box(c, "vault_keeper", bx - 0.17, bx + 0.17, yf + 0.06, yf + 0.25, zz - 0.11, zz + 0.11, frame, 0.015), piv)
                hd = parent(box(c, "vault_lock_handle", bx - 0.05, bx + 0.75, yf + 0.22, yf + 0.3, lz0 + 2.6, lz0 + 2.78, brass, 0.02), piv)
                parent(box(c, "vault_handle_catch", bx + 0.55, bx + 0.85, yf + 0.06, yf + 0.3, lz0 + 2.52, lz0 + 2.86, frame, 0.015), piv)
            for hk in (0.14, 0.5, 0.86):               # hinge knuckles on the post
                zz = lz0 + (lz1 - lz0) * hk
                parent(box(c, "vault_hinge_leaf", min(hx, hx + sg * -0.5), max(hx, hx + sg * -0.5), yf + 0.07, yf + 0.12, zz - 0.2, zz + 0.2, m_["steel_dark"], 0.01), piv)
                parent(box(c, "vault_hinge_knuckle", hx + sg * 0.02 - 0.09, hx + sg * 0.02 + 0.09, yf - 0.02, yf + 0.17, zz - 0.26, zz + 0.26, m_["steel_dark"], 0.03), piv)
            parent(box(c, "vault_hazard_band", xa + 0.2, xb - 0.2, yf + 0.06, yf + 0.075, lz0 + 0.2, lz0 + 0.85, hazard), piv)
            _chevrons(c, "vault_hazard_stripes", xa + 0.2, xb - 0.2, yf + 0.08, lz0 + 0.2, lz0 + 0.85, black, piv)
            mx = (xa + xb) / 2
            if sg < 0:
                parent(text(c, "vault_number", p["name"], P(mx, yf + 0.065, lz1 - 1.35), 0.36, wink, spacing=1.2), piv)
            else:
                for li_, body in enumerate(("MAX GROSS", "2 400 KG", "KEEP CLEAR")):
                    parent(text(c, "vault_data", body, P(mx, yf + 0.065, lz1 - 0.95 - li_ * 0.36), 0.036, wink, spacing=1.3), piv)
            # lock housing + two lock lights on this leaf (four across the pair), amber then white one by one
            lx0, lx1 = (x - 1.75, x - 0.1) if sg < 0 else (x + 0.1, x + 1.75)
            parent(box(c, "vault_lock_housing", lx0, lx1, yf + 0.06, yf + 0.2, lockz - 0.34, lockz + 0.34, frame, 0.02), piv)
            for k, lx in enumerate(lock_x):
                if (lx < x) != (sg < 0):
                    continue
                fz = F_LOCK0 + k * LOCK_STEP
                hide_from(parent(box(c, "lock_amber", lx - 0.22, lx + 0.22, yf + 0.2, yf + 0.24, lockz - 0.2, lockz + 0.2, amber), piv), fz)
                show_from(parent(box(c, "lock_white", lx - 0.22, lx + 0.22, yf + 0.2, yf + 0.24, lockz - 0.2, lockz + 0.2, white), piv), fz)
            if sg > 0:                                 # the signal climbs the meeting seam to the lock housing
                n = 5
                for k in range(n):
                    za, zb = lz0 + (lockz - 0.4 - lz0) * k / n, lz0 + (lockz - 0.4 - lz0) * (k + 1) / n
                    show_from(parent(box(c, "vault_seam_pixels", x + 0.03, x + 0.15, yf + 0.07, yf + 0.1, za, zb - 0.03, sig), piv), F_SEAM + round(k * 8 / n))
        # ---- controlled burst: front, both sides and back fall outward to the deck; roof light box stays on its posts
        f0 = F_REVEAL + i * 3
        fall = math.radians(87)
        for hinge, rot, d in ((fh, (fall, 0, 0), 0), (shs[-1], (0, -fall, 0), 3), (shs[1], (0, fall, 0), 3), (bh, (-fall, 0, 0), 6)):
            key(hinge, f0 + d, rot=(0, 0, 0))
            key(hinge, f0 + d + 24, rot=tuple(a * 1.012 for a in rot))     # lands, small settle
            key(hinge, f0 + d + 30, rot=rot)
        # ---- deck signal: console -> channel -> this vault's threshold
        cx0 = CX - 1.5 if x < 0 else CX + 1.5
        lit_path(c, [(cx0, CY), (x, CY), (x, yf + 0.25)], F_TOUCH + 4, F_SEAM, sig, w=0.16)
        _vault_fog(c, x, s, yf, i)
    _guest(c)
    _fx(c, F_FX)
