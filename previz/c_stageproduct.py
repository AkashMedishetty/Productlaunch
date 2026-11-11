"""Concept: stageproduct — nested portal frames (the design the client approved). Shared helpers come from cl.py (do not edit cl.py).

The composition is unchanged: per product, three open portal frames stepping back and up around a central bay,
a low spine linking the two sets, a console where the guest seats a machined core, and a shutter in each bay.
This pass only improves the finish (satin metal, recessed LED channels, base plates, ballast, shutter guides),
closes the sightlines into the innermost bay, and separates the two sets at stage centre.
"""
from cl import *

OWN_GUEST = True
SIDE_CAM = False            # temporary QA switch: side-seat camera

Y0, STEP, D, T = -4.4, 2.6, 1.2, 0.9        # front frame line, spacing front-to-back, frame depth, frame thickness
G0, GSTEP = 1.6, 1.5                        # clearance round the product, growth per frame
F_CH = F_TOUCH + 34                         # first frame channels fire (then +8 per frame, front to back)
F_SHUT, SHUT_T = F_REVEAL, 30               # shutter travel 138 -> 168
F_FX = 178
STAND = (CX - 0.84, CY - 1.9)               # guest at the console
AWAY = (-15.0, -2.5)                        # beside the lectern, clear of the frames and outside both bays

SHOTS = [(1, (-8.5, 14.5, 10.0), (-5.0, -3.6, DECK_H + 3.4)),            # on the guest walking to the console
         (F_TOUCH + 4, (-6.0, 9.0, 9.4), (CX, CY - 0.6, DECK_H + 3.2)),  # the core is seated
         (66, (-3.5, 19, 12.5), (-1.0, -5.5, DECK_H + 3.5)),             # rising: signal crosses the deck
         (F_WAKE + 14, (-1.0, 30, 9.0), (-0.5, -9, 9.0)),                # channels fire front to back, wall wakes
         (F_REVEAL - 8, (0, 39, 7.0), (-0.5, -9, 9.6)),                  # whole stage, centre aisle
         (190, (0, 33, 6.6), (-0.5, -9.5, 9.0)),
         (END, (0, 27, 6.3), (-0.5, -10, 8.6))]                          # slow push to the open bays
if SIDE_CAM:
    SHOTS = [(1, (-34, 14, 8.5), (-6, -9, 8)), (END, (-34, 14, 8.5), (-6, -9, 8))]


def _linear(fn):
    prefs = bpy.context.preferences.edit
    old = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = "LINEAR"
    fn()
    prefs.keyframe_new_interpolation_type = old


def _portal(c, xa, xb, yk, z, top, body, dark, glow, f_on):
    """One portal frame: opening xa..xb, clear height `top`; box-section legs + head with a recessed LED channel
    on the front face near the inner edge, base plates and ballast behind the legs."""
    r, ci, cw = 0.1, 0.16, 0.13                 # recess depth, channel inset from the inner edge, channel width
    yb, yf = yk - D, yk
    cl0, cl1 = xa - ci - cw, xa - ci            # left leg channel
    cr0, cr1 = xb + ci, xb + ci + cw            # right leg channel
    hz0, hz1 = z + top + ci, z + top + ci + cw  # head channel
    bv = 0.006
    for a, b, c0, c1 in ((xa - T, xa, cl0, cl1), (xb, xb + T, cr0, cr1)):
        box(c, "portal_leg", a, b, yb, yf - r, z + 0.08, z + top, body, bv)
        box(c, "portal_leg_face", a, c0, yf - r, yf, z + 0.08, z + top, body, bv)
        box(c, "portal_leg_face", c1, b, yf - r, yf, z + 0.08, z + top, body, bv)
        box(c, "portal_recess", c0, c1, yf - r - 0.01, yf - r + 0.015, z + 0.08, hz1, dark)
        show_from(box(c, "portal_channel", c0 + 0.02, c1 - 0.02, yf - r + 0.015, yf - r + 0.04, z + 0.3, hz1 - 0.02, glow), f_on)
        box(c, "portal_joint", a - 0.008, b + 0.008, yb - 0.008, yf - r, z + top - 0.03, z + top + 0.03, dark)   # shadow gap leg/head
        box(c, "portal_baseplate", a - 0.22, b + 0.22, yb - 0.25, yf + 0.25, z, z + 0.08, m_["steel_dark"], 0.004)
        box(c, "portal_ballast", a + 0.2, b - 0.2, yb - 1.5, yb - 0.05, z + 0.08, z + 0.42, m_["steel_dark"], 0.01)
    box(c, "portal_head", xa - T, xb + T, yb, yf - r, z + top, z + top + T, body, bv)
    box(c, "portal_head_face", xa - T, xb + T, yf - r, yf, hz1, z + top + T, body, bv)          # above the channel
    box(c, "portal_head_face", cl1, cr0, yf - r, yf, z + top, hz0, body, bv)                    # below it, between legs
    box(c, "portal_head_face", xa - T, cl0, yf - r, yf, z + top, hz1, body, bv)                 # outer corners
    box(c, "portal_head_face", cr1, xb + T, yf - r, yf, z + top, hz1, body, bv)
    box(c, "portal_recess", cl0, cr1, yf - r - 0.01, yf - r + 0.015, hz0, hz1, dark)
    show_from(box(c, "portal_channel", cl0 + 0.02, cr1 - 0.02, yf - r + 0.015, yf - r + 0.04, hz0 + 0.02, hz1 - 0.02, glow), f_on)


def _bay(c, p, z, body, liner, slat_m, guide_m):
    """Innermost bay behind the first frame: slim side returns, top and back (dark inside, frame finish outside),
    and a slatted roller shutter in guide channels that travels up into the head."""
    x, y, s, h = p["x"], p["y"], p["size"] / 2, p["h"] + PL
    xa, xb, top = x - s - G0, x + s + G0, h + 1.8
    yfr, yback = Y0 - D, y - s - 0.9
    for a, b, sg in ((xa - 0.14, xa, -1), (xb, xb + 0.14, 1)):
        box(c, "bay_return", min(a, b) + (0.07 if sg > 0 else 0), max(a, b) - (0.07 if sg < 0 else 0), yback, yfr, z, z + top + 0.14, body, 0.004)
        box(c, "bay_liner", (xa - 0.07) if sg < 0 else xb, xa if sg < 0 else (xb + 0.07), yback, yfr, z, z + top, liner)
    box(c, "bay_top", xa - 0.14, xb + 0.14, yback - 0.14, yfr, z + top + 0.07, z + top + 0.14, body, 0.004)
    box(c, "bay_top_liner", xa - 0.07, xb + 0.07, yback, yfr, z + top, z + top + 0.07, liner)
    box(c, "bay_back", xa - 0.14, xb + 0.14, yback - 0.14, yback - 0.07, z, z + top + 0.14, body, 0.004)
    box(c, "bay_back_liner", xa - 0.07, xb + 0.07, yback - 0.07, yback, z, z + top, liner)
    box(c, "bay_floor", xa, xb, yback, yfr, z, z + 0.02, liner)
    # shutter: guide channel each side, slats rise together and disappear into the head
    ys0, ys1 = Y0 - 0.72, Y0 - 0.6
    for a, b in ((xa, xa + 0.2), (xb - 0.2, xb)):
        box(c, "shutter_guide", a, b, ys0 - 0.1, ys1 + 0.1, z, z + top, guide_m, 0.004)
    n = 16
    hs = top / n
    bottom = box(c, "shutter_bottom_bar", xa + 0.2, xb - 0.2, ys0 - 0.04, ys1 + 0.04, z + 0.02, z + 0.22, guide_m, 0.004)
    slats = [(bottom, z + 0.02)]
    for k in range(n):
        za, zb = z + 0.22 + k * (top - 0.22) / n, z + 0.22 + (k + 1) * (top - 0.22) / n + 0.01
        slats.append((box(c, "bay_slat", xa + 0.2, xb - 0.2, ys0, ys1, za, zb, slat_m, 0.006), za))

    def keys():
        for sl, za in slats:
            lift = z + top - za
            f1 = F_SHUT + SHUT_T * lift / top
            key(sl, F_SHUT, loc=sl.location.copy(), hide=False)
            key(sl, f1, loc=sl.location + Vector((0, 0, lift * FT)))
            key(sl, round(f1) + 1, hide=True)
    _linear(keys)
    # light inside the bay (strip under the bay top, behind the head) + a front-of-house key through the opening
    for nm, loc, e, kind in (("bay_strip", (x, yfr - 1.0, z + top - 0.25), 70 * p["size"], "AREA"), ("bay_key", (x, 6.0, z + 12.5), 1500, "SPOT")):
        li = bpy.data.lights.new(nm, kind)
        li.energy = e
        li.color = (1.0, 0.96, 0.9)
        if kind == "AREA":
            li.shape = "RECTANGLE"
            li.size, li.size_y = (xb - xa - 1) * FT, 0.6 * FT
        else:
            li.spot_size, li.spot_blend = math.radians(30), 0.5
        o = bpy.data.objects.new(nm, li)
        o.location = P(*loc)
        o.rotation_euler = (P(x, y + 0.5, z + PL + p["h"] * 0.55) - o.location).to_track_quat("-Z", "Y").to_euler()
        link(o, c)
        show_from(o, F_SHUT + 8)
    return xa, xb, top


def _wall(c, glow, f0=F_WAKE, f1=F_RETURN):
    """cl.led_wake without the horizontal rules (they clashed with the frame heads). Black until f0. No text."""
    yf = -DECK_D - 0.5
    z0, H, W = V.LED_Z0, V.LED_H, V.LED_W
    n = 14
    for i in range(n):
        x = -W / 2 + (i + 0.5) * W / n
        d = abs(i - (n - 1) / 2) / (n / 2)
        b = origin_to(box(c, "led_column", x - W / n * 0.42, x + W / n * 0.42, yf - 0.01, yf, z0 + 0.3, z0 + H - 0.3, glow), "bottom")
        fa = f0 + round(d * 14)
        key(b, 1, hide=True)
        key(b, fa - 1, hide=True)
        key(b, fa, hide=False, scale=(0.12, 1, 0.02))
        key(b, fa + 14, scale=(0.12, 1, 1))
        key(b, f1 - 6, scale=(0.12, 1, 1))
        key(b, f1 + 6, scale=(1, 1, 1))
        key(b, f1 + 7, hide=True)
    field = emissive("sp_led_field", (0.010, 0.030, 0.075), 1.0)
    show_from(box(c, "led_field", -W / 2, W / 2, yf - 0.012, yf - 0.002, z0, z0 + H, field), f1 + 6)


def _finale(c, f, xs):
    """Effects kept off the products: CO2 outside the frame sets and in the centre gap, sparks at the upstage
    corners, light confetti well upstage of the bays."""
    for xj, yj in xs:
        j = fx.co2_jet(c, xj, yj, DECK_H, height=13, t=0.9)
        origin_to(j, "bottom")
        key(j, 1, hide=True)
        key(j, f - 1, hide=True)
        key(j, f, hide=False, scale=(0.4, 0.4, 0.05))
        key(j, f + 8, scale=(0.75, 0.75, 1))
        key(j, f + 30, scale=(1.0, 1.0, 1.1))
        key(j, f + 31, hide=True)
    for i, x in enumerate((-26.5, 26.5)):
        vs = [fx.spark_fountain(c, x, -17.5, DECK_H, height=14, count=420, t=1.0, seed=40 + i * 7 + k) for k in range(3)]
        for k, o in enumerate(vs):
            key(o, 1, hide=True)
            for fr in range(f, END + 1):
                key(o, fr, hide=((fr - f) % 3 != k))
    o = fx.confetti(c, -24, 24, -19.5, -16.2, DECK_H + 15, 40, count=650, seed=3, name="confetti_sp", size=0.7)
    key(o, 1, hide=True)
    key(o, f + 3, hide=True)
    key(o, f + 4, hide=False, loc=Vector((0, 0, 2.5)))
    key(o, END, loc=Vector((0.4, -0.3, -2.4)))


def _guest(c):
    """cl.guest mannequin re-timed: walks in from the lectern, seats the core at F_TOUCH, walks back clear."""
    root = guest(c)
    ob = bpy.data.objects
    parts = [o for o in root.children]
    legs = sorted((o for o in parts if o.name.startswith("guest_leg")), key=lambda o: o.name)
    arm_l = next(o for o in parts if o.name.startswith("guest_arm_l"))
    arm_r = next(o for o in parts if o.name.startswith("guest_arm_r"))
    for o in [root, arm_l, arm_r] + legs:
        o.animation_data_clear()
        o.rotation_euler = (0, 0, 0)
    a0, a1, b0, b1 = 2, F_TOUCH - 8, F_TOUCH + 16, F_TOUCH + 76
    R = math.radians
    key(root, a0, loc=P(AWAY[0], AWAY[1], DECK_H), rot=(0, 0, R(90)))
    key(root, a1 - 7, loc=P(STAND[0] - 1.6, AWAY[1] - 0.3, DECK_H), rot=(0, 0, R(80)))
    key(root, a1, loc=P(STAND[0], STAND[1], DECK_H), rot=(0, 0, 0))
    key(root, b0, loc=P(STAND[0], STAND[1], DECK_H), rot=(0, 0, 0))
    key(root, b0 + 9, loc=P(STAND[0] - 1.8, AWAY[1] - 0.3, DECK_H), rot=(0, 0, R(-80)))
    key(root, b1 - 6, rot=(0, 0, R(-90)))
    key(root, b1, loc=P(AWAY[0], AWAY[1], DECK_H), rot=(0, 0, R(-20)))
    for (fa, fb) in ((a0, a1), (b0, b1)):
        f, k = fa, 0
        while f <= fb:
            sw = 0 if f + 5 > fb else R(24) * (1 if k % 2 == 0 else -1)
            key(legs[0], f, rot=(sw, 0, 0))
            key(legs[1], f, rot=(-sw, 0, 0))
            key(arm_l, f, rot=(sw * 0.7, 0, 0))
            f += 5
            k += 1
    key(arm_r, a1, rot=(0, 0, 0))                    # the cue: hand onto the core, pressing it home
    key(arm_r, F_TOUCH - 4, rot=(R(-73), 0, 0))
    key(arm_r, F_TOUCH, rot=(R(-64), 0, 0))
    key(arm_r, b0 - 6, rot=(R(-64), 0, 0))
    key(arm_r, b0 + 2, rot=(0, 0, 0))
    return root


def build(c):
    """The set is a monumental abstract of the product: nested portal frames with lit channels echoing the
    product's own seam. Guest seats a machined core in the console; the central bays open and the real
    products stand inside the giant form."""
    cyan = emissive("sp_channel", (0.55, 0.85, 1.0), 9.0)
    cyan_deck = emissive("sp_deck", (0.55, 0.85, 1.0), 3.2)
    wall = emissive("sp_wall", (0.30, 0.62, 0.95), 3.0)
    body = mat("sp_body", (0.115, 0.12, 0.13), 0.38, 0.85, coat=0.15)          # satin dark anodised metal
    dark = mat("sp_recess", (0.008, 0.008, 0.01), 0.7)
    liner = mat("sp_liner", (0.012, 0.013, 0.016), 0.92)                       # matt black bay interior
    slat_m = mat("sp_slat", (0.20, 0.21, 0.225), 0.42, 0.9)
    guide_m = mat("sp_guide", (0.42, 0.43, 0.45), 0.35, 1.0)                   # brushed aluminium guides
    z = DECK_H
    products(c)
    console(c, "SEAT THE CORE", cyan_deck, "palm")
    core = box(c, "core_module", CX - 0.3, CX + 0.3, CY - 0.3, CY + 0.3, z + 3.12, z + 3.7, m_["chrome"], 0.04)
    key(core, F_TOUCH - 5, loc=core.location + Vector((0, 0, 0.5 * FT)))
    key(core, F_TOUCH, loc=core.location - Vector((0, 0, 0.5 * FT)))
    _wall(c, wall)
    fascia_run(c, F_TOUCH + 4, F_TOUCH + 34, cyan_deck)
    lit_path(c, [(CX, CY + 0.95), (CX, -1.5)], F_TOUCH + 4, F_TOUCH + 10, cyan_deck)
    inner = []
    for i, p in enumerate(PRODUCTS):
        x, y, s, h = p["x"], p["y"], p["size"] / 2, p["h"] + PL
        lit_path(c, [(CX, -1.5), (x, -1.5), (x, Y0 + 1.3)], F_TOUCH + 10, F_CH, cyan_deck)
        # three nested portals stepping back and up: the product's silhouette, enlarged
        for k in range(3):
            g = G0 + k * GSTEP
            _portal(c, x - s - g, x + s + g, Y0 - k * STEP, z, h + 1.8 + k * 2.2, body, dark, cyan, F_CH + k * 8)
        _bay(c, p, z, body, liner, slat_m, guide_m)
        g = G0 + 2 * GSTEP + T
        inner.append((x + s + g) if i == 0 else (x - s - g))
    # low spine linking the two sets at the rear frame line, with a recessed seam
    sa, sb, ys = inner[0], inner[1], Y0 - 2 * STEP
    box(c, "motif_spine", sa, sb, ys - D + 0.15, ys - 0.25, z + 0.08, z + 4.2, body, 0.006)
    box(c, "motif_spine_base", sa, sb, ys - D, ys - 0.1, z, z + 0.08, m_["steel_dark"], 0.004)
    box(c, "motif_spine_recess", sa + 0.15, sb - 0.15, ys - 0.26, ys - 0.24, z + 3.55, z + 3.72, dark)
    show_from(box(c, "motif_spine_seam", sa + 0.17, sb - 0.17, ys - 0.25, ys - 0.235, z + 3.57, z + 3.70, cyan), F_CH + 16)
    for li in bpy.data.lights:                       # the travelling head must not flood the shutters in daylight
        if li.name.startswith("pulse_glow"):
            li.energy = 35
    fog_floor(c, F_REVEAL, 0.3)
    _finale(c, F_FX, [(-21.2, -8.0), ((sa + sb) / 2, -13.0), (20.7, -8.0)])
    _guest(c)
