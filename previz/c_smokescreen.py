"""Concept: smokescreen (THE SMOKESCREEN). Daylight-native reveal. Owns everything specific to it; shared
helpers come from cl.py (not edited).

One idea: the two products wait under camouflage hides. The chief guest throws a signal lever (36). A row of
floor smoke units along the stage front fires one after another across the stage (40-76) and a wall of coloured
daytime smoke stands up in front of the stage (saffron-amber on one half, deep green on the other: PLACEHOLDER
brand colours). Inside the smoke the hides are winched off upstage (116-143). Wind machines at centre part the
smoke from the centre outward (136-174) and the two products are standing in clean sun, LED wall awake behind
them. Two slim marker plumes at the upstage corners close the picture (176).

Beats (24 fps): walk-in 2-24 - lever 28-36 - units fire in sequence 40-76 - wall complete ~100 - LED wall wakes
84-120 (behind the smoke) - hides winched off 116-143 - smoke parts 136-174 - marker plumes 176 - hero to 240.
"""
from cl import *
import random

OWN_GUEST = True
GX, GY = -24.6, -5.2            # signal desk, stage right wing (audience left), outside the smoke line
ROW_Y = -2.3                    # smoke unit line, set back from the stage lip
ROW_X0, ROW_X1, NUNIT = -18.5, 18.5, 14
F_FIRE0, F_FIRE1 = 40, 76       # first and last unit fire
F_NET0, F_NET1 = 116, 143       # hides winched off (inside the smoke)
F_CLEAR, CLEAR_SPREAD, CLEAR_LEN = 136, 18, 20
F_FX = 176
SMOKE_H = 17.0
SAFFRON, GREEN = (1.0, 0.36, 0.03), (0.02, 0.36, 0.2)      # placeholders for the two brand colours

SHOTS = [(1, (-18.5, 1.5, 11.5), (GX - 0.2, GY - 1.2, DECK_H + 3.2)),          # raised, on the guest and the signal desk
         (F_TOUCH + 4, (-17.5, 3.5, 11.2), (GX + 1.6, GY + 0.6, DECK_H + 2.6)),    # the lever, first unit fires
         (F_FIRE1 + 6, (-3.0, 27.0, 13.0), (1.0, -4.0, DECK_H + 5.0)),         # pulling back with the smoke line
         (F_NET0 + 6, (0, 40.0, 7.8), (0, -8.0, 10.0)),                        # centre aisle, whole stage in smoke
         (F_CLEAR + 20, (0, 39.0, 7.4), (0, -10.0, 9.4)),
         (END, (0, 26.0, 6.6), (0, -10.8, 8.0))]                               # slow push for the hero hold


# ------------------------------------------------------------------- smoke --
def smoke_mat(name, color, density, seed=0.0, noise_scale=1.5, falloff=0.45, emit=0.06):
    """Copy of fx._volume_mat for coloured daytime smoke: soft sides, fades toward the top, density is a named
    node so it can be keyframed. Returns (material, density socket)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    for n in list(N):
        if n.type != "OUTPUT_MATERIAL":
            N.remove(n)
    out = [n for n in N if n.type == "OUTPUT_MATERIAL"][0]
    vol = N.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (*color, 1)
    vol.inputs["Anisotropy"].default_value = 0.25
    if "Emission Color" in vol.inputs:
        vol.inputs["Emission Color"].default_value = (*color, 1)
        vol.inputs["Emission Strength"].default_value = emit
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Generated"], sep.inputs[0])

    def math_(op, a=None, b=None, va=None, vb=None):
        n = N.new("ShaderNodeMath")
        n.operation = op
        if a is not None:
            L.new(a, n.inputs[0])
        elif va is not None:
            n.inputs[0].default_value = va
        if b is not None:
            L.new(b, n.inputs[1])
        elif vb is not None:
            n.inputs[1].default_value = vb
        return n.outputs[0]

    top = math_("POWER", math_("SUBTRACT", None, sep.outputs["Z"], va=1.0), vb=falloff)

    def edge(sock):                       # 1 in the middle, 0 at both faces
        d = math_("ABSOLUTE", math_("SUBTRACT", sock, vb=0.5))
        return math_("SUBTRACT", None, math_("POWER", math_("MULTIPLY", d, vb=2.0), vb=3.0), va=1.0)

    mp = N.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (seed, seed * 0.7, seed * 0.3)
    L.new(tc.outputs["Object"], mp.inputs[0])
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = noise_scale
    nz.inputs["Detail"].default_value = 6.0
    nz.inputs["Roughness"].default_value = 0.65
    L.new(mp.outputs[0], nz.inputs["Vector"])
    rmp = N.new("ShaderNodeMapRange")
    rmp.inputs[1].default_value = 0.12
    rmp.inputs[2].default_value = 0.55
    L.new(nz.outputs[0], rmp.inputs[0])
    a = math_("MULTIPLY", top, rmp.outputs[0])
    dn = N.new("ShaderNodeMath")
    dn.operation = "MULTIPLY"
    dn.name = "density"
    L.new(a, dn.inputs[0])
    dn.inputs[1].default_value = density
    L.new(dn.outputs[0], vol.inputs["Density"])
    L.new(vol.outputs[0], out.inputs["Volume"])
    return m, dn.inputs[1]


def _vol_box(c, name, w, d, h, material, seed=0):
    """Billowing plume volume (feet), origin at the centre of its base: a stack of overlapping puffs, so the
    outline is lumpy like real smoke instead of a box."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    n = max(5, int(h / 2.2))
    for k in range(n):
        t = (k + 0.5) / n
        r = (w / 2) * rnd.uniform(0.82, 1.08) * (0.8 + 0.3 * t)
        cz = max(r * 0.75, h * t * rnd.uniform(0.93, 1.05))
        mtx = Matrix.Translation((rnd.uniform(-0.2, 0.2) * w * FT, rnd.uniform(-0.12, 0.12) * d * FT, cz * FT)) @ \
            Matrix.Diagonal((r * FT, d / 2 * rnd.uniform(0.9, 1.15) * FT, r * rnd.uniform(0.85, 1.1) * FT, 1))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=mtx)
    for k in range(n * 3):                      # smaller puffs break up the outline
        r = (w / 2) * rnd.uniform(0.38, 0.62)
        mtx = Matrix.Translation((rnd.uniform(-0.42, 0.42) * w * FT, rnd.uniform(-0.3, 0.3) * d * FT, rnd.uniform(r * 0.6, h * 1.04) * FT)) @ \
            Matrix.Diagonal((r * FT, r * rnd.uniform(0.8, 1.1) * FT, r * rnd.uniform(0.8, 1.15) * FT, 1))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1.0, matrix=mtx)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material)
    return link(bpy.data.objects.new(name, me), c)


def smoke_column(c, i, x, color, f_on, f_clear, sg):
    """One unit's plume: stands up from the floor unit, billows, then is pushed outward (sg) and thins to nothing."""
    m, dens = smoke_mat(f"vol_smoke_{i}", color, 0.0, seed=i * 1.7)
    o = _vol_box(c, "smoke_plume", 7.4, 5.4, SMOKE_H * (0.86 + 0.24 * ((i * 7) % 5) / 4), m, seed=i)
    base = P(x, ROW_Y, DECK_H)
    D = 26.0
    key(o, 1, hide=True)
    key(o, f_on - 1, hide=True)
    key(o, f_on, hide=False, loc=base, scale=(0.3, 0.5, 0.04))
    key(o, f_on + 9, scale=(0.72, 0.8, 0.5))
    key(o, f_on + 24, scale=(1, 1, 1))
    key(o, f_clear, loc=base, scale=(1.12, 1.25, 1.1))
    key(o, f_clear + CLEAR_LEN, loc=P(x + sg * 7.0, ROW_Y - 1.5, DECK_H + 1.5), scale=(1.5, 1.6, 1.2))
    key(o, f_clear + CLEAR_LEN + 1, hide=True)
    for f, v in ((f_on, D * 1.3), (f_on + 24, D), (f_clear, D * 0.8), (f_clear + CLEAR_LEN, 0.0)):
        dens.default_value = v
        dens.keyframe_insert("default_value", frame=f)
    return o


def smoke_unit(c, x, f_on, lamp):
    """Floor smoke unit: olive steel trough with a mesh top and an armed/fired lamp facing the audience."""
    z = DECK_H
    box(c, "smoke_unit", x - 0.85, x + 0.85, ROW_Y - 0.5, ROW_Y + 0.5, z, z + 0.55, m_["olive"], 0.03)
    box(c, "smoke_unit_grille", x - 0.7, x + 0.7, ROW_Y - 0.36, ROW_Y + 0.36, z + 0.55, z + 0.58, m_["grille"])
    show_from(box(c, "smoke_unit_lamp", x - 0.5, x + 0.5, ROW_Y + 0.5, ROW_Y + 0.53, z + 0.2, z + 0.38, lamp), f_on)


def marker_plume(c, x, y, color, f, i):
    """Slim marker plume at an upstage corner, leaning with the breeze. Fires after the reveal is complete."""
    m, dens = smoke_mat(f"vol_marker_{i}", color, 16.0, seed=20 + i * 3.3, noise_scale=2.6, falloff=0.9)
    o = _vol_box(c, "marker_plume", 3.8, 3.8, 19.0, m, seed=50 + i)
    box(c, "marker_unit", x - 0.6, x + 0.6, y - 0.6, y + 0.6, DECK_H, DECK_H + 0.55, m_["olive"], 0.03)
    key(o, 1, hide=True)
    key(o, f - 1, hide=True)
    key(o, f, hide=False, loc=P(x, y, DECK_H + 0.5), scale=(0.4, 0.4, 0.05))
    key(o, f + 16, scale=(0.8, 0.8, 0.7))
    key(o, END, scale=(1.25, 1.1, 1.0))
    o.rotation_euler = (0, math.radians(7 if x > 0 else -7), 0)


# --------------------------------------------------------------- camo hide --
def _rsq(x, y, n=4.0):
    return (abs(x) ** n + abs(y) ** n) ** (1.0 / n)


def net_mat():
    """Camouflage net: disruptive blotches in three field colours, alpha-hashed open mesh."""
    m = bpy.data.materials.new("camo_net")
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = N["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.85
    tc = N.new("ShaderNodeTexCoord")
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 1.9
    nz.inputs["Detail"].default_value = 2.0
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, (0.035, 0.05, 0.025, 1)
    els[1].position, els[1].color = 0.43, (0.13, 0.16, 0.06, 1)
    for pos, col in ((0.53, (0.30, 0.25, 0.13, 1)), (0.62, (0.075, 0.10, 0.045, 1))):
        e = els.new(pos)
        e.color = col
    L.new(nz.outputs[0], ramp.inputs[0])
    L.new(ramp.outputs[0], b.inputs["Base Color"])
    vo = N.new("ShaderNodeTexVoronoi")
    vo.inputs["Scale"].default_value = 11.0
    L.new(tc.outputs["Object"], vo.inputs["Vector"])
    gt = N.new("ShaderNodeMath")
    gt.operation = "GREATER_THAN"
    gt.inputs[1].default_value = 0.30
    L.new(vo.outputs["Distance"], gt.inputs[0])
    L.new(gt.outputs[0], b.inputs["Alpha"])
    for k, v in (("surface_render_method", "DITHERED"), ("blend_method", "HASHED")):
        try:
            setattr(m, k, v)
        except Exception:
            pass
    m.use_backface_culling = False
    m.diffuse_color = (0.12, 0.15, 0.06, 1)
    return m


def camo_hide(c, p, netm, liner, leafs, idx):
    """Camouflage hide over one product: garnished net over a shade-cloth liner, peaked on a light ridge prop
    above the product and pegged out to weighted deck plates. A winch line on the upstage edge drags the whole
    hide back over the product and down to a catch trough at the foot of the LED raiser."""
    rnd = random.Random(11 + idx)
    a = p["size"] / 2 + 0.95                 # clear of the plinth
    H = PL + p["h"] + 1.1
    run = 3.3
    E = a + run
    x0, y0, z0 = p["x"], p["y"], DECK_H

    def hz(x, y, lift=0.0):
        d = _rsq(x, y) - a
        if d <= 0:
            r = _rsq(x, y) / a
            return H + lift + 0.35 * (1 - r * r)          # shallow crown on the ridge prop
        u = min(d / run, 1.0)
        th = math.atan2(y, x)
        sag = (1 - u) ** 1.75
        return max(0.03, (H + lift) * sag + 0.22 * math.sin(7 * th) * u * (1 - u) * 4 * 0.4)

    def surf(name, material, n, shrink, lift):
        bm = bmesh.new()
        g = [[None] * (n + 1) for _ in range(n + 1)]
        for i in range(n + 1):
            for j in range(n + 1):
                x, y = -E + 2 * E * i / n, -E + 2 * E * j / n
                r = _rsq(x, y)
                if r > E:                                  # pull the grid corners in to a rounded edge
                    x, y = x * E / r, y * E / r
                z = hz(x, y, lift) + (0.05 * math.sin(3.1 * x + 1.7 * y) + 0.04 * math.sin(4.3 * y - 2.2 * x) if lift == 0 else 0)
                g[i][j] = bm.verts.new((x * shrink * FT, -y * shrink * FT, max(0.02, z) * FT))
        for i in range(n):
            for j in range(n):
                try:
                    bm.faces.new((g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]))
                except ValueError:
                    pass
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        for f in me.polygons:
            f.use_smooth = True
        me.materials.append(material)
        o = link(bpy.data.objects.new(name, me), c)
        o.location = P(x0, y0, z0)
        return o

    liner_o = surf("hide_liner", liner, 40, 0.985, -0.12)
    net_o = surf("hide_net", netm, 56, 1.0, 0.0)
    # scrim garnish: strips of fabric tied into the net, lifting off the surface so the hide has depth in sun
    bm = bmesh.new()
    for k in range(2600):
        x, y = rnd.uniform(-E, E), rnd.uniform(-E, E)
        if _rsq(x, y) > E - 0.15:
            continue
        z = hz(x, y) + 0.06
        e = 0.05
        nrm = Vector(((hz(x - e, y) - hz(x + e, y)) / (2 * e), -(hz(x, y - e) - hz(x, y + e)) / (2 * e) * -1, 1.0))
        nrm = Vector((nrm.x, -nrm.y, nrm.z)).normalized()        # plan y -> Blender -y
        t = nrm.orthogonal().normalized()
        t = (Matrix.Rotation(rnd.uniform(0, 6.28), 3, nrm) @ t)
        s = nrm.cross(t)
        L_, W_ = rnd.uniform(0.35, 0.75) * FT, rnd.uniform(0.12, 0.24) * FT
        pc = Vector((x * FT, -y * FT, z * FT))
        tilt = nrm * rnd.uniform(0.02, 0.09)
        vs = [bm.verts.new(pc - t * L_ - s * W_), bm.verts.new(pc + t * L_ - s * W_ + tilt),
              bm.verts.new(pc + t * L_ + s * W_ + tilt), bm.verts.new(pc - t * L_ + s * W_)]
        f = bm.faces.new(vs)
        f.material_index = k % len(leafs)
    me = bpy.data.meshes.new("hide_garnish")
    bm.to_mesh(me)
    bm.free()
    for lm in leafs:
        me.materials.append(lm)
    gar_o = link(bpy.data.objects.new("hide_garnish", me), c)
    gar_o.location = P(x0, y0, z0)
    # winch edge: everything collapses toward the upstage hem and is dragged to the catch trough
    piv = empty(c, f"hide_winch_{idx}", P(x0, y0 - E, z0))
    for o in (liner_o, net_o, gar_o):
        parent(o, piv)
    f0 = F_NET0 + idx * 3
    key(piv, 1, loc=P(x0, y0 - E, z0), scale=(1, 1, 1))
    key(piv, f0, loc=P(x0, y0 - E, z0), scale=(1, 1, 1))
    key(piv, f0 + 6, scale=(1.0, 0.92, 0.9))                                    # lines take up, the hide goes taut
    key(piv, F_NET1 - 4, loc=P(x0, -18.6, z0), scale=(0.8, 0.22, 0.2))
    key(piv, F_NET1, loc=P(x0, -18.9, z0 + 0.2), scale=(0.62, 0.06, 0.05))
    for o in (liner_o, net_o, gar_o):
        key(o, 1, hide=False)
        key(o, F_NET1, hide=False)
        key(o, F_NET1 + 1, hide=True)
    # fixed hardware: weighted peg plates round the hem (stay, low and small), winch lines, catch trough
    for k in range(10):
        th = 2 * math.pi * (k + 0.5) / 10
        rr = E / max((abs(math.cos(th)) ** 4 + abs(math.sin(th)) ** 4) ** 0.25, 1e-6) - 0.1
        px, py = x0 + rr * math.cos(th), y0 + rr * math.sin(th)
        if py > -19.0:
            box(c, "hide_peg_plate", px - 0.3, px + 0.3, py - 0.3, py + 0.3, z0, z0 + 0.09, m_["steel_dark"], 0.01)
    for sx in (-0.55, 0.55):
        tube(c, "winch_line", [P(x0 + sx * E, y0 - E + 0.2, z0 + 0.06), P(x0 + sx * E * 0.8, -18.9, z0 + 0.5)], 0.008, m_["steel_dark"])
    box(c, "catch_trough", x0 - E * 0.72, x0 + E * 0.72, -19.7, -18.75, z0, z0 + 1.0, m_["olive"], 0.03)
    return E


# ------------------------------------------------------------ desk, guest ---
def signal_desk(c, lamp):
    """Field signal desk: olive transit case on a stand with one painted lever and a whip aerial."""
    z = DECK_H
    for sx in (-1, 1):
        for sy in (-1, 1):
            tube(c, "desk_leg", [P(GX + sx * 1.15, GY + sy * 0.7, z), P(GX + sx * 0.95, GY + sy * 0.55, z + 2.3)], 0.022, m_["steel_dark"])
    box(c, "desk_case", GX - 1.3, GX + 1.3, GY - 0.8, GY + 0.8, z + 2.3, z + 3.05, m_["olive"], 0.04)
    for sx in (-1.3, 1.3):
        box(c, "desk_case_corner", sx + GX - 0.08, sx + GX + 0.08, GY - 0.84, GY + 0.84, z + 2.26, z + 3.09, m_["steel_dark"], 0.02)
    box(c, "desk_plate", GX - 1.05, GX + 1.05, GY - 0.6, GY + 0.6, z + 3.05, z + 3.08, m_["steel_dark"])
    text(c, "desk_label", "SIGNAL", P(GX, GY + 0.805, z + 2.68), 0.075, m_["whiteink"], spacing=1.6)
    box(c, "desk_lamp_off", GX - 0.85, GX - 0.55, GY - 0.15, GY + 0.15, z + 3.08, z + 3.16, m_["grille"], 0.02)
    show_from(box(c, "desk_lamp_on", GX - 0.83, GX - 0.57, GY - 0.13, GY + 0.13, z + 3.16, z + 3.2, lamp), F_TOUCH)
    tube(c, "desk_aerial", [P(GX - 1.15, GY - 0.6, z + 3.05), P(GX - 1.2, GY - 0.7, z + 9.5)], 0.012, m_["steel_dark"])
    hp = empty(c, "lever_pivot", P(GX + 0.2, GY, z + 3.1))
    parent(box(c, "lever_boss", GX + 0.02, GX + 0.38, GY - 0.16, GY + 0.16, z + 3.08, z + 3.26, m_["steel_dark"], 0.03), hp)
    parent(box(c, "lever_arm", GX + 0.15, GX + 0.25, GY - 0.05, GY + 0.05, z + 3.15, z + 4.0, m_["steel"], 0.015), hp)
    parent(box(c, "lever_grip", GX + 0.06, GX + 0.34, GY - 0.1, GY + 0.1, z + 3.95, z + 4.3, m_["signal_red"], 0.04), hp)
    key(hp, 1, rot=(math.radians(34), 0, 0))
    key(hp, F_TOUCH - 8, rot=(math.radians(34), 0, 0))
    key(hp, F_TOUCH, rot=(math.radians(-36), 0, 0))
    # field cable from the desk to the first smoke unit
    tube(c, "signal_cable", [P(GX + 1.0, GY, z + 2.3), P(GX + 1.4, GY + 0.4, z + 0.05), P(ROW_X0 - 1.5, ROW_Y, z + 0.05), P(ROW_X1, ROW_Y + 0.62, z + 0.05)], 0.02, m_["rubber"])


def _guest(c):
    """Copy of cl.guest re-blocked: enters from the stage-right wing, throws the lever, steps back upstage toward
    the wing (upwind of the smoke line, clear of the hides) and turns to watch."""
    suit = mat("guest_suit", (0.20, 0.23, 0.30), 0.62)
    skin = mat("guest_skin", (0.60, 0.47, 0.38), 0.6)
    stand = (GX - 0.05, GY - 1.5)
    start, away = (-27.0, -10.5), (-26.3, -8.6)
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
    a0, a1, b0, b1 = 2, F_TOUCH - 12, F_TOUCH + 22, F_TOUCH + 62
    face = math.radians(-28)                    # walking downstage and slightly on-stage
    key(root, a0, loc=P(start[0], start[1], DECK_H), rot=(0, 0, face))
    key(root, a1 - 4, rot=(0, 0, face))
    key(root, a1, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b1, loc=P(away[0], away[1], DECK_H), rot=(0, 0, math.radians(-38)))    # backs away, turned to the stage
    for (fa, fb) in ((a0, a1), (b0, b1)):
        f, k = fa, 0
        while f <= fb:
            sw = 0 if f + 5 > fb else math.radians(22) * (1 if k % 2 == 0 else -1)
            key(legs[0], f, rot=(sw, 0, 0))
            key(legs[1], f, rot=(-sw, 0, 0))
            key(arm_l, f, rot=(sw * 0.7, 0, 0))
            f += 5
            k += 1
    key(arm_r, a1, rot=(0, 0, 0))                                   # take the lever, throw it forward
    key(arm_r, F_TOUCH - 8, rot=(math.radians(-58), 0, 0))
    key(arm_r, F_TOUCH, rot=(math.radians(-82), 0, 0))
    key(arm_r, b0 - 8, rot=(math.radians(-82), 0, 0))
    key(arm_r, b0, rot=(0, 0, 0))
    return root


def wind_machine(c, x, y, yaw, f_on, lamp):
    """Drum fan on a low cradle (aimed across the stage), with a run lamp from the clear cue."""
    z = DECK_H
    piv = empty(c, "wind_machine", P(x, y, z))
    parts = [box(c, "fan_cradle", x - 0.5, x + 0.5, y - 1.3, y + 1.3, z, z + 0.3, m_["steel_dark"], 0.02)]
    me = V.cyl_mesh("fan_drum", 1.25 * FT, 1.1 * FT, 28, axis="Y")
    me.transform(Matrix.Rotation(math.pi / 2, 4, "Z"))
    me.materials.append(m_["olive"])
    d = link(bpy.data.objects.new("fan_drum", me), c)
    d.location = P(x, y, z + 1.6)
    parts.append(d)
    me2 = V.cyl_mesh("fan_face", 1.12 * FT, 1.14 * FT, 28, axis="Y")
    me2.transform(Matrix.Rotation(math.pi / 2, 4, "Z"))
    me2.materials.append(m_["grille"])
    d2 = link(bpy.data.objects.new("fan_face", me2), c)
    d2.location = P(x, y, z + 1.6)
    parts.append(d2)
    parts.append(show_from(box(c, "fan_lamp", x - 0.2, x + 0.2, y + 1.3, y + 1.33, z + 0.08, z + 0.22, lamp), f_on))
    for o in parts:
        parent(o, piv)
    piv.rotation_euler = (0, 0, yaw)


def dressing(c):
    """Forward-position dressing, kept sparse and formal: stacked transit cases and marker posts at the wings."""
    z = DECK_H
    for sg in (-1, 1):
        x = sg * 25.2
        box(c, "transit_case", x - 1.6, x + 1.6, -17.6, -15.4, z, z + 1.5, m_["olive"], 0.05)
        box(c, "transit_case", x - 1.3, x + 1.3, -17.4, -15.6, z + 1.5, z + 2.7, m_["olive_dark"], 0.05)
        for yy in (-17.6, -15.4):
            box(c, "case_band", x - 1.63, x + 1.63, yy - 0.03, yy + 0.03, z + 0.55, z + 0.75, m_["steel_dark"])
        if sg > 0:
            box(c, "transit_case", x - 1.5, x + 0.9, -13.9, -12.3, z, z + 1.3, m_["olive_dark"], 0.05)


def _led(c, glow):
    """LED wall: black until F_WAKE, then thin rising lines and a calm warm field. No text."""
    yf = -DECK_D - 0.5
    z0, H, W = V.LED_Z0, V.LED_H, V.LED_W
    n = 17
    for i in range(n):
        x = -W / 2 + (i + 0.5) * W / n
        d = abs(i - (n - 1) / 2) / (n / 2)
        b = origin_to(box(c, "led_line", x - 0.1, x + 0.1, yf - 0.01, yf, z0 + 0.4, z0 + H - 0.4, glow), "bottom")
        fa = F_WAKE + round(d * 14)
        key(b, 1, hide=True)
        key(b, fa - 1, hide=True)
        key(b, fa, hide=False, scale=(1, 1, 0.02))
        key(b, fa + 16, scale=(1, 1, 1))
    field = emissive("smk_led_field", (0.012, 0.03, 0.022), 1.0)
    show_from(box(c, "led_field", -W / 2, W / 2, yf - 0.02, yf - 0.012, z0, z0 + H, field), F_RETURN)
    for zz in (z0 + H * 0.2, z0 + H * 0.84):
        r = box(c, "led_rule", -W / 2 + 0.5, W / 2 - 0.5, yf - 0.01, yf, zz - 0.07, zz + 0.07, glow)
        key(r, 1, hide=True)
        key(r, F_RETURN - 1, hide=True)
        key(r, F_RETURN, hide=False, scale=(0.01, 1, 1))
        key(r, F_RETURN + 16, scale=(1, 1, 1))


# ------------------------------------------------------------------- build --
def build(c):
    m_["olive"] = mat("field_olive", (0.105, 0.125, 0.06), 0.62, 0.0)
    m_["olive_dark"] = mat("field_olive_dark", (0.06, 0.075, 0.04), 0.66, 0.0)
    m_["signal_red"] = mat("lever_red", (0.62, 0.04, 0.03), 0.4, coat=0.4)
    armed = emissive("unit_fired", (1.0, 0.55, 0.1), 22)
    go = emissive("signal_go", (0.2, 1.0, 0.35), 26)
    ledg = emissive("smk_led", (1.0, 0.6, 0.2), 4.5)
    liner = mat("hide_liner", (0.035, 0.045, 0.025), 0.9)
    leafs = [mat("scrim_olive", (0.11, 0.15, 0.05), 0.85), mat("scrim_dark", (0.04, 0.06, 0.03), 0.85),
             mat("scrim_khaki", (0.34, 0.29, 0.16), 0.85), mat("scrim_brown", (0.13, 0.09, 0.05), 0.85)]
    for lm in leafs:
        lm.use_backface_culling = False
    netm = net_mat()
    ee = bpy.context.scene.eevee                 # finer volumes so the smoke is not blocky (this concept only)
    for k, v in (("volumetric_tile_size", "4"), ("volumetric_samples", 128), ("volumetric_sample_distribution", 0.7),
                 ("use_volumetric_shadows", True), ("volumetric_shadow_samples", 32), ("volumetric_ray_depth", 16)):
        if hasattr(ee, k):
            try:
                setattr(ee, k, v)
            except Exception:
                pass

    products(c)
    for i, p in enumerate(PRODUCTS):
        camo_hide(c, p, netm, liner, leafs, i)
        product_light(c, p, F_CLEAR + 6)
    signal_desk(c, go)
    dressing(c)
    _led(c, ledg)

    # the smoke line: units fire one after another across the stage (this is the visible signal travel)
    xs = [ROW_X0 + (ROW_X1 - ROW_X0) * i / (NUNIT - 1) for i in range(NUNIT)]
    for i, x in enumerate(xs):
        f_on = round(F_FIRE0 + (F_FIRE1 - F_FIRE0) * i / (NUNIT - 1))
        smoke_unit(c, x, f_on, armed)
        f_clear = round(F_CLEAR + CLEAR_SPREAD * abs(x) / ROW_X1)
        smoke_column(c, i, x, SAFFRON if x < 0 else GREEN, f_on, f_clear, -1 if x < 0 else 1)
    # wind machines at centre, behind the smoke line, aimed outward: they part the wall from the centre
    for sg in (-1, 1):
        wind_machine(c, sg * 1.7 - 0.5, -5.4, math.radians(-14 * sg), F_CLEAR - 4, go)
    marker_plume(c, -25.6, -13.0, SAFFRON, F_FX, 0)
    marker_plume(c, 25.6, -9.8, GREEN, F_FX, 1)
    _guest(c)
