"""Concept: ignition. Owns everything specific to this reveal. Shared helpers come from cl.py (do not edit cl.py).

Palm on a glowing amber cube -> pixel pulse through a floor channel, up a scenic fin, into the LED wall -> wall
wakes (ember field, no text) -> pulse returns along the floor to each product -> fog builds -> the roller lid opens and
a telescoping sleeve sinks into a plinth-height collar, so the product appears to rise out of the fog.
(The spec's lift cannot be hidden in a 3 ft deck: this is the spec's own mitigation, retracting cover + lighting snap.)
"""
from cl import *

N_TIER = 6                      # nested sleeve sections per cover
F_PATH0 = F_TOUCH + 4           # pulse leaves the cube
F_JUNC = F_TOUCH + 16           # pulse reaches the floor junction
F_FIN = F_WAKE - 10             # pulse reaches the wall base and climbs
F_LID = F_REVEAL - 5            # roller lids open
F_DOWN = F_REVEAL + 32          # sleeves fully nested
F_SNAP = F_REVEAL + 14          # lighting snap
F_FX = F_REVEAL + 40            # effects, after the reveal is complete
JX, JY = CX, -7.6               # floor junction (trunk to the wall, branches to the products)

SHOTS = [(1, (-8.0, 6.5, 9.2), (CX + 0.2, CY - 0.6, DECK_H + 2.4)),          # close on the cube and the guest
         (F_TOUCH + 8, (-7.0, 7.5, 9.0), (CX + 0.6, CY - 1.4, DECK_H + 2.2)),
         (F_WAKE - 16, (7.0, 15.0, 15.5), (0, -11.5, DECK_H + 1.0)),            # lifting to follow the pulse upstage
         (F_WAKE + 18, (3.0, 29.0, 9.5), (0, -12, 9.5)),                        # pulling back as the wall wakes
         (F_REVEAL - 10, (0, 40.0, 6.6), (0, -10.5, 9.6)),                       # whole stage from the centre aisle
         (F_FX + 6, (0, 37.0, 6.2), (0, -10.5, 9.0)),
         (END, (0, 30.0, 5.8), (0, -10.5, 8.4))]                                 # slow push to the products


def lin_keys(o, pairs):
    """Linear location keys: [(frame, Vector)]."""
    prefs = bpy.context.preferences.edit
    old = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = "LINEAR"
    for f, loc in pairs:
        key(o, f, loc=loc)
    prefs.keyframe_new_interpolation_type = old


def glow_mat(name, hot, deep, strength):
    """Lit-from-within acrylic: faces seen square-on are hot, grazing faces fall to a deeper amber, so the form reads."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = mat(name, deep, 0.3, emit=hot, strength=strength, coat=0.6)
    nt = m.node_tree
    b = [n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"][0]
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.42
    mix = nt.nodes.new("ShaderNodeMixRGB")
    mix.inputs[1].default_value = (*hot, 1)
    mix.inputs[2].default_value = (*deep, 1)
    nt.links.new(lw.outputs["Facing"], mix.inputs[0])
    nt.links.new(mix.outputs[0], b.inputs["Emission Color"])
    return m


def soft_head(c, pts, f0, f1, glow):
    """Travelling pulse head (copy of cl.pulse_head with a soft, non-specular light: no orb reflections)."""
    me = V.boxes_mesh("pulse_head", [(0, 0, 0, 0.5, 0.5, 0.12)], 0.05, 3)
    me.materials.append(glow)
    o = link(bpy.data.objects.new("pulse_head", me), c)
    li = bpy.data.lights.new("pulse_glow", "POINT")
    li.energy = 260
    li.color = (1.0, 0.5, 0.12)
    li.shadow_soft_size = 0.6
    li.specular_factor = 0.0
    lo = link(bpy.data.objects.new("pulse_glow", li), c)
    o.location = lo.location = P(*pts[0])
    lo.location.z += 0.45
    parent(lo, o)
    d = [0.0]
    for a, b in zip(pts, pts[1:]):
        d.append(d[-1] + math.dist(a, b))
    lin_keys(o, [(f0 + (f1 - f0) * dd / max(d[-1], 1e-6), P(*q)) for q, dd in zip(pts, d)])
    for ob in (o, lo):
        key(ob, 1, hide=True)
        key(ob, int(f0) - 1, hide=True)
        key(ob, int(f0), hide=False)
        key(ob, int(f1) + 1, hide=True)
    return o


def floor_path(c, pts, f0, f1, glow, w=0.24):
    """Low cable-ramp profile LED channel on the deck; pixels light in order f0..f1 behind a travelling head."""
    z = DECK_H
    segs = []
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = max(1, round(math.hypot(bx - ax, by - ay) / 1.1))
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            segs.append(((ax + (bx - ax) * t0, ay + (by - ay) * t0), (ax + (bx - ax) * t1, ay + (by - ay) * t1)))
    for i, ((ax, ay), (bx, by)) in enumerate(segs):
        x0, x1 = min(ax, bx) - w, max(ax, bx) + w
        y0, y1 = min(ay, by) - w, max(ay, by) + w
        box(c, "led_channel", x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, z, z + 0.045, m_["steel_dark"])
        show_from(box(c, "led_pixels", x0, x1, y0, y1, z + 0.045, z + 0.065, glow), f0 + round(i * (f1 - f0) / max(1, len(segs))))
    soft_head(c, [(x, y, z + 0.2) for x, y in pts], f0, f1, glow)


def fin(c, x, y, z0, z1, f0, f1, glow):
    box(c, "fin_body", x - 0.4, x + 0.4, y - 0.5, y + 0.1, z0, z1, m_["black"], 0.01)
    n = max(1, round((z1 - z0) / 1.0))
    for i in range(n):
        a, b = z0 + (z1 - z0) * i / n, z0 + (z1 - z0) * (i + 1) / n
        show_from(box(c, "fin_pixels", x - 0.16, x + 0.16, y + 0.1, y + 0.13, a + 0.03, b - 0.03, glow), f0 + round(i * (f1 - f0) / n))
    soft_head(c, [(x, y + 0.3, z0 + 0.3), (x, y + 0.3, z1)], f0, f1, glow)


def wall_wake(c, glow, f0=F_WAKE, f1=F_RETURN):
    """Copy of cl.led_wake in the Ignition palette: amber columns rise from the centre out, then an ember field with a
    warm bloom behind each product. No text."""
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
    field = emissive("ign_led_field", (0.045, 0.011, 0.003), 1.0)
    bloom = emissive("ign_led_bloom", (0.60, 0.19, 0.03), 0.4)
    core = emissive("ign_led_core", (0.95, 0.36, 0.07), 0.55)
    show_from(box(c, "led_field", -W / 2, W / 2, yf - 0.012, yf - 0.002, z0, z0 + H, field), f1 + 6)
    for p in PRODUCTS:
        s = p["size"]
        show_from(box(c, "led_bloom", p["x"] - s * 1.15, p["x"] + s * 1.15, yf - 0.006, yf + 0.004, z0 + 0.4, z0 + H - 1.2, bloom), f1 + 6)
        show_from(box(c, "led_bloom_core", p["x"] - s * 0.85, p["x"] + s * 0.85, yf - 0.002, yf + 0.008, z0 + 0.4, z0 + H - 3.0, core), f1 + 6)


def touch_cube(c, amber):
    z = DECK_H
    box(c, "cube_plinth", CX - 1.25, CX + 1.25, CY - 1.25, CY + 1.25, z, z + 1.0, m_["black"], 0.03)
    box(c, "cube_plinth_trim", CX - 1.29, CX + 1.29, CY - 1.29, CY + 1.29, z + 0.94, z + 1.0, m_["chrome"], 0.01)
    a, b, z0, z1 = 0.95, 0.9, z + 1.06, z + 3.0
    soft = glow_mat("cube_standby", (0.55, 0.20, 0.04), (0.16, 0.05, 0.012), 0.55)
    lit = glow_mat("cube_lit", (1.0, 0.36, 0.035), (0.7, 0.12, 0.01), 1.25)
    hide_from(box(c, "touch_cube", CX - b, CX + b, CY - b, CY + b, z0, z1 - 0.03, soft, 0.05), F_TOUCH)
    show_from(box(c, "touch_cube_lit", CX - b, CX + b, CY - b, CY + b, z0, z1 - 0.03, lit, 0.05), F_TOUCH)
    fr = m_["black"]
    t = 0.07
    for sx in (-1, 1):          # slim frame on all twelve edges gives the glowing block a readable form
        for sy in (-1, 1):
            box(c, "cube_frame", CX + sx * a - t / 2, CX + sx * a + t / 2, CY + sy * a - t / 2, CY + sy * a + t / 2, z0, z1, fr, 0.008)
        for zz in (z0 + t / 2, z1 - t / 2):
            box(c, "cube_frame", CX - a, CX + a, CY + sx * a - t / 2, CY + sx * a + t / 2, zz - t / 2, zz + t / 2, fr, 0.008)
            box(c, "cube_frame", CX + sx * a - t / 2, CX + sx * a + t / 2, CY - a, CY + a, zz - t / 2, zz + t / 2, fr, 0.008)
    li = bpy.data.lights.new("cube_glow", "POINT")       # the cube throws amber on the deck and the guest when touched
    li.energy, li.color, li.shadow_soft_size, li.specular_factor = 320, (1.0, 0.5, 0.12), 0.5, 0.0
    lo = link(bpy.data.objects.new("cube_glow", li), c)
    lo.location = P(CX, CY, z + 3.6)
    show_from(lo, F_TOUCH)
    show_from(box(c, "cube_halo", CX - 1.27, CX + 1.27, CY - 1.27, CY + 1.27, z + 1.0, z + 1.05, amber), F_TOUCH)


def sleeve(c, p, amber, skin):
    """Telescoping cover: N nested sections lower into a collar at plinth height; a roller lid opens first."""
    x, y, z = p["x"], p["y"], DECK_H
    H = p["h"] + PL + 0.7
    t = H / N_TIER
    out = -1 if x < CX else 1
    dt = (F_DOWN - F_REVEAL) / (N_TIER - 1)
    trim = m_["steel_dark"]
    top = None
    pivs = []
    for k in range(N_TIER):                     # k = 0 fixed outer collar ... N-1 innermost top section
        s = p["size"] / 2 + 0.88 + (N_TIER - 1 - k) * 0.06
        zb = z + 0.03 + k * t
        ov = 0.0 if k == N_TIER - 1 else 0.12
        piv = empty(c, f"sleeve_{p['name']}_{k}", P(x, y, zb))
        for (x0, x1, y0, y1) in ((-s, s, s - 0.05, s), (-s, s, -s, -s + 0.05), (-s, -s + 0.05, -s, s), (s - 0.05, s, -s, s)):
            parent(box(c, "sleeve_panel", x + x0, x + x1, y + y0, y + y1, zb, zb + t + ov, skin), piv)
        for (x0, x1, y0, y1) in ((-s - 0.03, s + 0.03, s, s + 0.03), (-s - 0.03, -s, -s, s), (s, s + 0.03, -s, s)):
            parent(box(c, "sleeve_trim", x + x0, x + x1, y + y0, y + y1, zb + t - 0.09, zb + t, trim), piv)
        pivs.append((piv, k, zb))
        if k == N_TIER - 1:
            top = (piv, s, zb + t)
    piv, s, zt = top
    for (x0, x1, y0, y1) in ((-s - 0.04, s + 0.04, s + 0.03, s + 0.05), (-s - 0.05, -s - 0.03, -s, s + 0.04), (s + 0.03, s + 0.05, -s, s + 0.04)):
        e = parent(box(c, "sleeve_rim_lit", x + x0, x + x1, y + y0, y + y1, zt - 0.1, zt + 0.01, amber), piv)
        show_from(e, F_REVEAL - 6)              # the returning pulse lights the rim before the cover moves
    lid = origin_to(box(c, "sleeve_lid", x - s, x + s, y - s, y + s, zt, zt + 0.04, skin), "left" if out < 0 else "right")
    parent(lid, piv)
    key(lid, F_LID, scale=(1, 1, 1))
    key(lid, F_LID + 8, scale=(0.03, 1, 1))     # fabric lid rolls into its cassette on the outboard edge
    parent(box(c, "lid_cassette", x + out * s - 0.12, x + out * s + 0.12, y - s, y + s, zt, zt + 0.2, m_["black"], 0.03), piv)
    for pv, k, zb in pivs[1:]:                  # key after all children are parented
        a = F_REVEAL + (N_TIER - 1 - k) * dt
        lin_keys(pv, [(F_REVEAL, P(x, y, zb)), (a, P(x, y, zb)), (F_DOWN, P(x, y, z + 0.03))])
    so = p["size"] / 2 + 0.88 + (N_TIER - 1) * 0.06
    show_from(box(c, "collar_glow", x - so, x + so, y + so, y + so + 0.035, z + 0.05, z + 0.13, amber), F_REVEAL - 6)
    for sx in (-1, 1):                          # fog units at the collar's front corners
        box(c, "fog_unit", x + sx * (so + 0.75) - 0.45, x + sx * (so + 0.75) + 0.45, y + so - 1.3, y + so - 0.2, z, z + 0.6, m_["black"], 0.04)
        box(c, "fog_unit_nozzle", x + sx * (so + 0.75) - 0.12, x + sx * (so + 0.75) + 0.12, y + so - 0.2, y + so - 0.05, z + 0.25, z + 0.45, m_["grille"], 0.01)
    return so, H


def fog(c, p, so, H):
    x, y, z = p["x"], p["y"], DECK_H
    n = p["name"]
    # ring of low fog rolling round the closed cover, building from the moment the wall wakes
    ring = origin_to(fx.low_fog(c, x - so - 4.5, x + so + 4.5, y - so - 2.0, y + so + 5.0, z, height=3.4, density=2.6,
                                name=f"ign_ring_{n}", seed=3.0 + x), "bottom")
    key(ring, 1, hide=True)
    key(ring, F_WAKE + 5, hide=True)
    key(ring, F_WAKE + 6, hide=False, scale=(0.45, 0.45, 0.1))
    key(ring, F_REVEAL, scale=(1, 1, 1))
    key(ring, F_FX, scale=(1.15, 1.1, 0.9))
    key(ring, END, scale=(1.3, 1.2, 0.5))
    # fog held inside the cover: the sleeve sinks and the product is left standing in it, then it drains away
    core = origin_to(fx.low_fog(c, x - so + 0.2, x + so - 0.2, y - so + 0.2, y + so - 0.2, z, height=H + 1.0, density=1.6,
                                name=f"ign_core_{n}", seed=11.0 + x), "bottom")
    key(core, 1, hide=True)
    key(core, F_LID - 1, hide=True)
    key(core, F_LID, hide=False, scale=(1, 1, 1))
    key(core, F_REVEAL + 10, scale=(1, 1, 1))
    key(core, F_DOWN + 4, scale=(1.25, 1.25, 0.5))
    key(core, F_FX + 16, scale=(1.5, 1.4, 0.16))


def snap_lights(c, p):
    """Lighting snap: hard key from the front truss plus warm footlights from the fog units."""
    product_light(c, p, F_SNAP)
    for sx in (-1, 1):
        li = bpy.data.lights.new("ign_foot", "SPOT")
        li.energy, li.color = 2600, (1.0, 0.62, 0.3)
        li.spot_size, li.spot_blend, li.specular_factor = math.radians(60), 0.6, 0.3
        o = link(bpy.data.objects.new("ign_foot", li), c)
        o.location = P(p["x"] + sx * (p["size"] / 2 + 2.2), p["y"] + p["size"] / 2 + 3.2, DECK_H + 0.7)
        o.rotation_euler = (P(p["x"], p["y"], DECK_H + PL + p["h"] * 0.6) - o.location).to_track_quat("-Z", "Y").to_euler()
        show_from(o, F_SNAP)


def build(c):
    amber = emissive("ignite_amber", (1.0, 0.42, 0.06), 11)
    products(c)
    touch_cube(c, amber)
    yb = -DECK_D + 0.6
    # the channel leaves the cube on the side away from the guest, so nobody steps over it
    floor_path(c, [(CX + 1.25, CY), (CX + 3.0, CY), (CX + 3.0, JY), (JX, JY)], F_PATH0, F_JUNC, amber)
    floor_path(c, [(JX, JY), (JX, yb)], F_JUNC, F_FIN, amber)
    fin(c, JX, yb - 0.1, DECK_H, V.LED_Z0 + 7.0, F_FIN, F_WAKE, amber)
    fascia_run(c, F_PATH0, F_WAKE, amber)
    wall_wake(c, amber)
    skin = V.pbr("ign_sleeve", "fabric_pattern_07", 4.0, tint=(0.03, 0.027, 0.026), bump=0.3)
    for p in PRODUCTS:
        so, H = sleeve(c, p, amber, skin)
        floor_path(c, [(JX, JY), (p["x"], JY), (p["x"], p["y"] + so + 0.25)], F_RETURN, F_REVEAL - 6, amber)
        fog(c, p, so, H)
        snap_lights(c, p)
    fog_floor(c, F_RETURN, 0.8)
    finale(c, F_FX)
