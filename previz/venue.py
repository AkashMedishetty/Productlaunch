"""Shared outdoor venue for the launch previz, built from the the venue layout draft.

Run:  blender -b -P previz/venue.py -- [--render] [--cycles CAM] [--out previz/out]

All plan dimensions come from the layout draft, in feet, origin at stage front-centre,
+y toward the audience. Blender space is metres with the audience at -Y.
Values marked ASSUMED are not on the drawing and need confirming.
"""
import bpy, bmesh, math, sys, os, time, random
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
FT = 0.3048

# ---- confirmed by the drawing (feet) ---------------------------------------
STAGE_W, STAGE_D = 56.0, 24.0
LED_W, LED_H = 56.0, 20.0
RAISER_D, RAISER_H = 4.0, 2.5
AREA_W, AREA_D = 60.0, 80.0
AISLE_W = 6.0
DECK_D = STAGE_D - RAISER_D
# ---- ASSUMED (not on the drawing) ------------------------------------------
DECK_H = 3.0
SIDE_TRUSS_H = 22.0
SUN_DIR = Vector((-0.22, -0.92, 0.0))   # horizontal direction toward the sun (front-left of stage)
BRAND = "BRAND HERE"
LED_Z0 = DECK_H + RAISER_H


def P(x, y, z=0.0):
    """Plan feet (x right, y toward audience, z up) -> Blender metres."""
    return Vector((x * FT, -y * FT, z * FT))


# ---------------------------------------------------------------- materials --
def _principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree, m.node_tree.nodes["Principled BSDF"]


def mat(name, color, rough=0.6, metal=0.0, emit=None, strength=1.0, alpha=1.0, coat=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m, nt, b = _principled(name)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        m.surface_render_method = "BLENDED"
    m.diffuse_color = (*color, alpha)
    return m


def pbr(name, tex, scale=1.0, tint=None, tint_mix=1.0, rough_add=0.0, bump=1.0, metal=None):
    """Textured material from a Poly Haven set, box-projected in object space (no UVs needed)."""
    m = bpy.data.materials.get(name)
    if m:
        return m
    d = os.path.join(ASSETS, "tex", tex)
    if not os.path.isdir(d):
        return mat(name, tint or (0.5, 0.5, 0.5))
    m, nt, b = _principled(name)
    N, L = nt.nodes, nt.links
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])

    def img(fn, srgb):
        p = os.path.join(d, fn)
        if not os.path.exists(p):
            return None
        n = N.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(p, check_existing=True)
        n.image.colorspace_settings.name = "sRGB" if srgb else "Non-Color"
        n.projection = "BOX"
        n.projection_blend = 0.25
        L.new(mp.outputs[0], n.inputs[0])
        return n

    diff = img("diff.jpg", True)
    if diff:
        if tint:
            mx = N.new("ShaderNodeMix")
            mx.data_type = "RGBA"
            mx.blend_type = "MULTIPLY"
            mx.inputs[0].default_value = tint_mix
            L.new(diff.outputs[0], mx.inputs[6])
            mx.inputs[7].default_value = (*tint, 1)
            L.new(mx.outputs[2], b.inputs["Base Color"])
        else:
            L.new(diff.outputs[0], b.inputs["Base Color"])
    elif tint:
        b.inputs["Base Color"].default_value = (*tint, 1)
    arm = img("arm.jpg", False)
    rgh = img("rough.jpg", False)
    src = None
    if arm:
        sep = N.new("ShaderNodeSeparateColor")
        L.new(arm.outputs[0], sep.inputs[0])
        src = sep.outputs[1]
        if metal is None:
            L.new(sep.outputs[2], b.inputs["Metallic"])
    elif rgh:
        src = rgh.outputs[0]
    if src:
        if rough_add:
            ad = N.new("ShaderNodeMath")
            ad.operation = "ADD"
            ad.use_clamp = True
            ad.inputs[1].default_value = rough_add
            L.new(src, ad.inputs[0])
            src = ad.outputs[0]
        L.new(src, b.inputs["Roughness"])
    if metal is not None:
        b.inputs["Metallic"].default_value = metal
    nor = img("nor.jpg", False)
    if nor:
        nm = N.new("ShaderNodeNormalMap")
        nm.inputs["Strength"].default_value = bump
        L.new(nor.outputs[0], nm.inputs["Color"])
        L.new(nm.outputs[0], b.inputs["Normal"])
    c = tint or (0.5, 0.5, 0.5)
    m.diffuse_color = (*c, 1)
    return m


def M():
    return dict(
        paving=pbr("paving", "pavement_02", 0.9, tint=(0.62, 0.60, 0.58)),
        carpet=pbr("carpet_grey", "dirty_carpet", 0.6, tint=(0.34, 0.36, 0.40), rough_add=0.1),
        aisle=pbr("carpet_aisle", "velour_velvet", 1.2, tint=(0.62, 0.035, 0.06)),
        deck=pbr("deck_carpet", "dirty_carpet", 0.7, tint=(0.17, 0.17, 0.185), rough_add=0.15),
        ply=pbr("ply_edge", "plywood", 0.8, tint=(0.10, 0.10, 0.10)),
        skirt=pbr("skirt_cloth", "fabric_pattern_07", 3.0, tint=(0.025, 0.025, 0.03), bump=0.6),
        steel=mat("truss_alu", (0.78, 0.79, 0.80), 0.28, 1.0),
        steel_dark=mat("steel_dark", (0.16, 0.16, 0.17), 0.45, 1.0),
        black=mat("black_gear", (0.018, 0.018, 0.02), 0.42, 0.0, coat=0.25),
        rubber=mat("black_rubber", (0.012, 0.012, 0.012), 0.85),
        grille=mat("grille", (0.035, 0.035, 0.04), 0.32, 0.9),
        lens=mat("lens_glass", (0.02, 0.03, 0.05), 0.04, 0.0, emit=(0.5, 0.7, 1.0), strength=0.6, coat=1.0),
        led=mat("led_bg", (0.006, 0.006, 0.007), 0.22, coat=0.5),
        ledtext=mat("led_text", (1, 1, 1), 0.4, emit=(1, 1, 1), strength=9.0),
        ledaccent=mat("led_accent", (1, 0.45, 0.1), 0.4, emit=(1.0, 0.42, 0.08), strength=14.0),
        ledback=mat("led_back", (0.03, 0.03, 0.035), 0.5, 0.6),
        flex=pbr("flex_banner", "fabric_pattern_07", 4.0, tint=(0.93, 0.93, 0.91), bump=0.25, rough_add=-0.25),
        flex_dark=pbr("flex_dark", "fabric_pattern_07", 4.0, tint=(0.03, 0.035, 0.05), bump=0.25, rough_add=-0.25),
        ink=mat("ink", (0.02, 0.02, 0.03), 0.55),
        whiteink=mat("white_ink", (0.95, 0.95, 0.95), 0.55),
        cloth=pbr("white_cloth", "fabric_pattern_07", 5.0, tint=(0.92, 0.92, 0.90), bump=0.5),
        chair=pbr("chair_cover", "fabric_pattern_07", 6.0, tint=(0.90, 0.89, 0.86), bump=0.5),
        chrome=mat("chrome", (0.85, 0.80, 0.62), 0.22, 1.0),
        wood=pbr("wood", "plywood", 1.2, tint=(0.55, 0.36, 0.22)),
        pot=mat("planter_grc", (0.80, 0.79, 0.76), 0.55),
        hedge=mat("hedge", (0.05, 0.16, 0.045), 0.75),
        glass=mat("glass_facade", (0.20, 0.30, 0.38), 0.12, 0.35, coat=1.0),
        concrete=pbr("concrete", "concrete_floor_01", 0.3, tint=(0.85, 0.85, 0.85)),
        plinth=mat("plinth_white", (0.90, 0.90, 0.90), 0.22, coat=0.6),
        product=mat("product_block", (0.42, 0.44, 0.47), 0.28, 1.0),
        acrylic=mat("acrylic", (0.92, 0.95, 1.0), 0.03, alpha=0.22, coat=1.0),
        appliance=mat("appliance_white", (0.88, 0.89, 0.90), 0.32, coat=0.4),
        placeholder=mat("placeholder_zone", (0.9, 0.5, 0.08), 0.6, alpha=0.3),
    )


# ---------------------------------------------------------------- geometry --
def link(obj, col):
    col.objects.link(obj)
    return obj


def collection(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


def boxes_mesh(name, boxes, bevel=0.0, seg=2):
    """boxes: (cx, cy, cz, sx, sy, sz[, rotx]) in metres, local space."""
    bm = bmesh.new()
    for bx in boxes:
        cx, cy, cz, sx, sy, sz = bx[:6]
        mt = Matrix.Translation((cx, cy, cz))
        if len(bx) > 6:
            mt = mt @ Matrix.Rotation(bx[6], 4, "X")
        bmesh.ops.create_cube(bm, size=1.0, matrix=mt @ Matrix.Diagonal((sx, sy, sz, 1)))
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=seg, affect="EDGES", profile=0.5)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if bevel:
        for p in me.polygons:
            p.use_smooth = True
    return me


def box(col, name, x0, x1, y0, y1, z0, z1, material, bevel=0.0):
    """Axis-aligned box given in plan feet."""
    a, b = P(x0, y0, z0), P(x1, y1, z1)
    c = (a + b) / 2
    s = Vector((abs(b.x - a.x), abs(b.y - a.y), abs(b.z - a.z)))
    me = boxes_mesh(name, [(0, 0, 0, s.x, s.y, s.z)], bevel)
    o = bpy.data.objects.new(name, me)
    o.location = c
    me.materials.append(material)
    return link(o, col)


def inst(col, name, me, x, y, z=0.0, rot=0.0, scale=1.0):
    o = bpy.data.objects.new(name, me)
    o.location = P(x, y, z)
    o.rotation_euler.z = rot
    o.scale = (scale, scale, scale)
    return link(o, col)


def cyl_mesh(name, r, depth, seg=24, r2=None, axis="Z"):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    if axis == "Y":
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=Matrix.Rotation(math.pi / 2, 3, "X"))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = len(p.vertices) == 4
    return me


def truss(col, name, a, b, material, size=0.29, tube=0.025, seg_len=2.0):
    """Box truss between two Blender-space points: chords, lacing, end frames, couplers."""
    a, b = Vector(a), Vector(b)
    axis = b - a
    L = axis.length
    axis.normalize()
    up = Vector((0, 0, 1)) if abs(axis.z) < 0.9 else Vector((1, 0, 0))
    u = axis.cross(up).normalized()
    v = axis.cross(u).normalized()
    h = size / 2
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = tube
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    corners = [(-h, -h), (h, -h), (h, h), (-h, h)]

    def spline(pts, r=1.0, cyclic=False):
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for p, q in zip(sp.points, pts):
            p.co = (*q, 1)
            p.radius = r
        sp.use_cyclic_u = cyclic

    for cx, cy in corners:
        o = u * cx + v * cy
        spline([a + o, b + o])
    nseg = max(1, round(L / seg_len))
    sl = L / nseg
    for s in range(nseg):
        s0 = a + axis * (s * sl)
        n = max(2, round(sl / size))
        step = (sl - 0.08) / n
        for i in range(4):
            c0, c1 = corners[i], corners[(i + 1) % 4]
            pts = []
            for k in range(n + 1):
                c = c0 if (k + i) % 2 == 0 else c1
                pts.append(s0 + axis * (0.04 + k * step) + u * c[0] + v * c[1])
            spline(pts, 0.42)
        for e in (0.04, sl - 0.04):
            spline([s0 + axis * e + u * cx + v * cy for cx, cy in corners], 0.42, True)
    for s in range(nseg + 1):
        for cx, cy in corners:
            c = a + axis * (s * sl) + u * cx + v * cy
            spline([c - axis * 0.035, c + axis * 0.035], 1.35)
    o = bpy.data.objects.new(name, cu)
    cu.materials.append(material)
    return link(o, col)


def tube(col, name, pts, r, material, cyclic=False):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 2
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts):
        p.co = (*q, 1)
    sp.use_cyclic_u = cyclic
    cu.materials.append(material)
    return link(bpy.data.objects.new(name, cu), col)


def text(col, name, body, loc, size, material, rot=(math.pi / 2, 0, 0), extrude=0.003, align="CENTER", spacing=1.0):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    cu.extrude = extrude
    cu.space_character = spacing
    o = bpy.data.objects.new(name, cu)
    o.location = loc
    o.rotation_euler = rot
    cu.materials.append(material)
    return link(o, col)


# ----------------------------------------------------------------- fixtures --
def moving_head_mesh(m):
    me = bpy.data.meshes.get("moving_head")
    if me:
        return me
    bm = bmesh.new()

    def cube(c, s, mi=0):
        r = bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(c) @ Matrix.Diagonal((*s, 1)))
        for f in {f for vv in r["verts"] for f in vv.link_faces}:
            f.material_index = mi

    # hangs below origin: clamp, base, yoke, head
    cube((0, 0, -0.03), (0.05, 0.10, 0.06))
    cube((0, 0, -0.12), (0.32, 0.26, 0.11))
    cube((-0.17, 0, -0.33), (0.045, 0.14, 0.34))
    cube((0.17, 0, -0.33), (0.045, 0.14, 0.34))
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=0.012, segments=2, affect="EDGES")
    rot = Matrix.Translation((0, 0, -0.40)) @ Matrix.Rotation(math.radians(58), 4, "X")
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.125, radius2=0.14, depth=0.34, matrix=rot)
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.118, radius2=0.118, depth=0.012,
                              matrix=rot @ Matrix.Translation((0, 0, 0.172)))
    for f in {f for vv in r["verts"] for f in vv.link_faces}:
        f.material_index = 1
    me = bpy.data.meshes.new("moving_head")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m["black"])
    me.materials.append(m["lens"])
    for p in me.polygons:
        p.use_smooth = True
    return me


def par_mesh(m):
    me = bpy.data.meshes.get("led_par")
    if me:
        return me
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.10, radius2=0.115, depth=0.20)
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.10, radius2=0.10, depth=0.01,
                              matrix=Matrix.Translation((0, 0, 0.102)))
    for f in {f for vv in r["verts"] for f in vv.link_faces}:
        f.material_index = 1
    r = bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0, 0, -0.02)) @ Matrix.Diagonal((0.27, 0.03, 0.2, 1)))
    me = bpy.data.meshes.new("led_par")
    bm.to_mesh(me)
    bm.free()
    me.materials.append(m["black"])
    me.materials.append(m["lens"])
    for p in me.polygons:
        p.use_smooth = len(p.vertices) == 4
    return me


def par_can(col, name, loc, aim, m):
    o = bpy.data.objects.new(name, par_mesh(m))
    o.location = loc
    o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("Z", "Y").to_euler()
    return link(o, col)


def moving_head(col, name, loc, m, yaw=0.0):
    o = bpy.data.objects.new(name, moving_head_mesh(m))
    o.location = loc
    o.rotation_euler.z = yaw
    return link(o, col)


# ------------------------------------------------------------------ imports --
def import_model(asset):
    """Import a Poly Haven glTF once; return one joined mesh datablock (origin on the floor)."""
    key = f"asset_{asset}"
    if key in bpy.data.meshes:
        return bpy.data.meshes[key]
    path = os.path.join(ASSETS, "models", asset, asset + ".gltf")
    if not os.path.exists(path):
        return None
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    new_names = [o.name for o in new]
    meshes = [o for o in new if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    j = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    me = j.data
    me.name = key
    for n in new_names:
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
    return me


# ------------------------------------------------------------------- venue --
def build_ground(m):
    c = collection("ground")
    box(c, "plaza", -260, 260, -200, 260, -0.3, 0, m["paving"])
    box(c, "carpet_area", -AREA_W / 2, AREA_W / 2, 0, 56, 0, 0.035, m["carpet"])
    box(c, "aisle", -AISLE_W / 2, AISLE_W / 2, 3.7, 56, 0.035, 0.06, m["aisle"])
    # carpet edge tape
    for x in (-AREA_W / 2, AREA_W / 2):
        box(c, "carpet_tape", x - 0.1, x + 0.1, 0, 56, 0.035, 0.04, m["rubber"])
    box(c, "carpet_tape", -AREA_W / 2, AREA_W / 2, 55.9, 56.1, 0.035, 0.04, m["rubber"])
    return c


def build_stage(m):
    c = collection("stage")
    hw = STAGE_W / 2
    # deck: carpeted top over ply, aluminium nosing, cloth skirt
    box(c, "deck_top", -hw, hw, -DECK_D, 0, DECK_H - 0.06, DECK_H, m["deck"])
    box(c, "deck_ply", -hw, hw, -DECK_D, 0, DECK_H - 0.3, DECK_H - 0.06, m["ply"])
    box(c, "deck_nosing", -hw - 0.02, hw + 0.02, -0.03, 0.05, DECK_H - 0.14, DECK_H + 0.012, m["steel"], 0.004)
    box(c, "skirt_front", -hw, hw, -0.06, 0.02, 0.02, DECK_H - 0.14, m["skirt"])
    box(c, "skirt_L", -hw - 0.02, -hw + 0.06, -DECK_D, 0, 0.02, DECK_H - 0.14, m["skirt"])
    box(c, "skirt_R", hw - 0.06, hw + 0.02, -DECK_D, 0, 0.02, DECK_H - 0.14, m["skirt"])
    # 4 x 8 ft deck module joints
    for i in range(1, 14):
        x = -hw + i * 4
        box(c, "deck_joint", x - 0.012, x + 0.012, -DECK_D, 0, DECK_H, DECK_H + 0.004, m["rubber"])
    # scaffold legs
    for x in range(-28, 29, 4):
        for y in (-0.6, -6.5, -13, -19.4):
            box(c, "leg", x - 0.07, x + 0.07, y - 0.07, y + 0.07, 0, DECK_H - 0.3, m["steel_dark"])
    # centre steps onto the aisle and wing steps, with aluminium nosing
    n = 4
    tread = 0.92
    for i in range(n):
        h = DECK_H * (i + 1) / (n + 1)
        y1 = (n - i) * tread
        box(c, f"step_c{i}", -3, 3, 0.02, y1, 0, h, m["deck"])
        box(c, f"step_c_nose{i}", -3.02, 3.02, y1 - 0.06, y1 + 0.02, h - 0.05, h + 0.01, m["steel"], 0.003)
        for s in (-1, 1):
            xa, xb = s * (hw + 0.02), s * (hw + (n - i) * tread)
            box(c, f"step_s{i}", min(xa, xb), max(xa, xb), -9, -5, 0, h, m["deck"])
            xn = xb
            box(c, f"step_s_nose{i}", xn - 0.04, xn + 0.04, -9.02, -4.98, h - 0.05, h + 0.01, m["steel"], 0.003)
    # LED raiser + wall
    box(c, "led_raiser", -hw, hw, -STAGE_D, -DECK_D, 0, LED_Z0, m["skirt"])
    box(c, "led_raiser_cap", -hw, hw, -STAGE_D, -DECK_D + 0.04, LED_Z0 - 0.06, LED_Z0, m["deck"])
    yf = -DECK_D - 0.55
    box(c, "led_wall", -LED_W / 2, LED_W / 2, yf - 0.28, yf, LED_Z0, LED_Z0 + LED_H, m["led"])
    box(c, "led_back", -LED_W / 2, LED_W / 2, yf - 0.36, yf - 0.28, LED_Z0, LED_Z0 + LED_H, m["ledback"])
    box(c, "led_frame_top", -LED_W / 2 - 0.08, LED_W / 2 + 0.08, yf - 0.36, yf + 0.02, LED_Z0 + LED_H, LED_Z0 + LED_H + 0.08, m["black"])
    for s in (-1, 1):
        box(c, "led_frame_side", s * LED_W / 2 - 0.08 * (s < 0), s * LED_W / 2 + 0.08 * (s > 0), yf - 0.36, yf + 0.02, LED_Z0, LED_Z0 + LED_H, m["black"])
    seam = mat("led_seam", (0.02, 0.02, 0.022), 0.6)
    cab = 1.6404  # 500 mm cabinet
    for i in range(1, int(LED_W / cab) + 1):
        x = -LED_W / 2 + i * cab
        if x < LED_W / 2 - 0.1:
            box(c, "seam_v", x - 0.004, x + 0.004, yf, yf + 0.004, LED_Z0, LED_Z0 + LED_H, seam)
    for j in range(1, int(LED_H / cab) + 1):
        z = LED_Z0 + j * cab
        box(c, "seam_h", -LED_W / 2, LED_W / 2, yf, yf + 0.004, z - 0.004, z + 0.004, seam)
    # LED ground-support: uprights, rear braces with ballast, header truss
    top = LED_Z0 + LED_H + 1.4
    yb = -STAGE_D + 0.2
    for x in (-27.6, -18.4, -9.2, 0, 9.2, 18.4, 27.6):
        truss(c, "led_upright", P(x, yb, 0), P(x, yb, top), m["steel"], 0.29)
        truss(c, "led_brace", P(x, yb - 9, 0.5), P(x, yb - 0.6, top * 0.7), m["steel"], 0.22, 0.02)
        box(c, "led_base", x - 1.3, x + 1.3, yb - 1.3, yb + 1.3, 0, 0.1, m["steel_dark"])
        box(c, "ballast", x - 1.6, x + 1.6, yb - 10.4, yb - 7.6, 0, 1.6, m["concrete"], 0.02)
    truss(c, "led_header", P(-28.2, yb, top), P(28.2, yb, top), m["steel"], 0.29)
    truss(c, "led_rear_tie", P(-27.6, yb - 9, 0.5), P(27.6, yb - 9, 0.5), m["steel"], 0.22, 0.02)
    # fascia branding on the skirt
    for x in (-20, 20):
        text(c, "fascia_brand", BRAND, P(x, 0.035, DECK_H * 0.46), 0.36, m["whiteink"], spacing=1.12)
    return c


def build_led_content(c, m, yf):
    """Placeholder launch artwork on the LED: brand line, rule, sub-line, corner marks."""
    zc = LED_Z0 + LED_H * 0.5
    text(c, "led_brand", BRAND, P(0, yf, zc + 1.6), 2.35, m["ledtext"], extrude=0.0, spacing=1.06)
    box(c, "led_rule", -9, 9, yf - 0.01, yf, zc - 2.05, zc - 1.95, m["ledaccent"])
    text(c, "led_sub", "PRODUCT LAUNCH", P(0, yf, zc - 3.6), 0.62, m["ledtext"], extrude=0.0, spacing=1.5)
    text(c, "led_tl", "LOGO", P(-LED_W / 2 + 3.2, yf, LED_Z0 + LED_H - 1.9), 0.36, m["ledtext"], extrude=0.0, spacing=1.4)
    text(c, "led_tr", "GOVT. EMBLEM", P(LED_W / 2 - 4.4, yf, LED_Z0 + LED_H - 1.9), 0.30, m["ledtext"], extrude=0.0, spacing=1.3)
    for s in (-1, 1):
        x = s * (LED_W / 2 - 1.2)
        box(c, "led_mark", min(x, x - s * 1.6), max(x, x - s * 1.6), yf - 0.01, yf, LED_Z0 + 1.1, LED_Z0 + 1.18, m["ledaccent"])
        box(c, "led_mark", x - 0.04, x + 0.04, yf - 0.01, yf, LED_Z0 + 1.1, LED_Z0 + 2.7, m["ledaccent"])


def build_side_truss(m):
    """Side truss runs 20.5 ft front-to-back at x = +/-29.1 ft (drawing)."""
    c = collection("side_truss")
    H = SIDE_TRUSS_H
    for s in (-1, 1):
        x = s * 29.1
        ya, yb = -0.64, -21.17
        truss(c, "side_post_f", P(x, ya, 0.1), P(x, ya, H), m["steel"], 0.29)
        truss(c, "side_post_b", P(x, yb, 0.1), P(x, yb, H), m["steel"], 0.29)
        truss(c, "side_top", P(x, ya, H), P(x, yb, H), m["steel"], 0.29)
        truss(c, "side_mid", P(x, ya, 3.4), P(x, yb, 3.4), m["steel"], 0.29)
        for y in (ya, yb):
            box(c, "base_plate", x - 1.4, x + 1.4, y - 1.4, y + 1.4, 0, 0.1, m["steel_dark"], 0.004)
            # outrigger + ballast for wind (outdoor)
            truss(c, "outrigger", P(x + s * 0.5, y, 0.5), P(x + s * 6.5, y, 0.5), m["steel"], 0.22, 0.02)
            truss(c, "kicker", P(x + s * 6.2, y, 0.6), P(x + s * 0.4, y, 12), m["steel"], 0.22, 0.02)
            box(c, "ballast", x + s * 5.2, x + s * 8.2, y - 1.4, y + 1.4, 0, 1.6, m["concrete"], 0.02)
        # flex banner laced into the frame with bungee ties
        b0, b1, z0, z1 = yb + 0.9, ya - 0.9, 4.4, H - 1.0
        box(c, "side_banner", x - 0.012, x + 0.012, b0, b1, z0, z1, m["flex_dark"])
        box(c, "side_banner_hem", x - 0.016, x + 0.016, b0, b1, z1 - 0.12, z1, m["flex_dark"])
        k = 0
        yy = b0
        while yy <= b1 + 0.01:
            for zz, zt in ((z1, H - 0.48), (z0, 3.88)):
                tube(c, "bungee", [P(x, yy, zz), P(x, yy, zt)], 0.006, m["rubber"])
            yy += 1.5
            k += 1
        zz = z0
        while zz <= z1 + 0.01:
            for yv, yt in ((b0, yb + 0.48), (b1, ya - 0.48)):
                tube(c, "bungee", [P(x, yv, zz), P(x, yt, zz)], 0.006, m["rubber"])
            zz += 1.5
        rz = math.pi / 2 if s < 0 else -math.pi / 2
        bx = x - s * 0.02
        zc = (z0 + z1) / 2
        text(c, "side_brand", BRAND, P(bx, (ya + yb) / 2, zc + 1.2), 0.62, m["whiteink"], rot=(math.pi / 2, 0, rz), spacing=1.08)
        text(c, "side_sub", "PRODUCT LAUNCH", P(bx, (ya + yb) / 2, zc - 0.9), 0.2, m["whiteink"], rot=(math.pi / 2, 0, rz), spacing=1.5)
        box(c, "side_rule", bx - 0.004, bx + 0.004, (ya + yb) / 2 - 3.2, (ya + yb) / 2 + 3.2, zc - 0.05, zc + 0.02, m["ledaccent"])
        # moving heads under the top chord, LED pars on the mid chord
        for k in range(5):
            y = ya + (yb - ya) * (k + 0.5) / 5
            moving_head(c, "side_mh", P(x, y, H - 0.5), m, yaw=(-math.pi / 2 if s < 0 else math.pi / 2))
        for k in range(4):
            y = ya + (yb - ya) * (k + 0.5) / 4
            par_can(c, "side_par", P(x - s * 0.7, y, 3.4), P(0, -10, DECK_H + 5), m)
    return c


def build_header_lights(m):
    c = collection("header_lights")
    top = LED_Z0 + LED_H + 1.4
    for i in range(10):
        x = -25.2 + i * 5.6
        moving_head(c, "header_mh", P(x, -STAGE_D + 0.2, top - 0.5), m, yaw=math.pi)
    return c


def build_stage_dressing(m):
    c = collection("stage_dressing")
    # podium (drawing: 2 x 1 ft at x -18.45..-16.45, stage front edge) — acrylic lectern on a plinth
    x0, x1 = -18.45, -16.45
    box(c, "podium_body", x0, x1, -2.1, -1.0, DECK_H, DECK_H + 3.55, m["plinth"], 0.012)
    box(c, "podium_top", x0 - 0.2, x1 + 0.2, -2.35, -0.85, DECK_H + 3.55, DECK_H + 3.66, m["black"], 0.006)
    box(c, "podium_inlay", x0 + 0.15, x1 - 0.15, -1.0, -0.985, DECK_H + 0.5, DECK_H + 3.2, m["flex_dark"])
    text(c, "podium_brand", BRAND, P(-17.45, -0.975, DECK_H + 2.2), 0.082, m["whiteink"], spacing=1.1)
    for dx in (-0.35, 0.35):
        tube(c, "podium_mic", [P(-17.45 + dx, -1.9, DECK_H + 3.66), P(-17.45 + dx, -1.75, DECK_H + 4.35), P(-17.45 + dx * 0.6, -1.5, DECK_H + 4.6)], 0.006, m["black"])
    # two product launch positions (drawing: 3.4 x 1.5 ft footprints)
    for i, (xa, xb) in enumerate(((-6.57, -3.20), (4.52, 7.90))):
        box(c, f"launch_plinth_{i}", xa, xb, -14.87, -13.40, DECK_H, DECK_H + 2.4, m["plinth"], 0.012)
        box(c, f"launch_plinth_base_{i}", xa - 0.15, xb + 0.15, -15.02, -13.25, DECK_H, DECK_H + 0.18, m["black"], 0.006)
    # five display-product tables on the ground in front of stage
    for i, (xa, xb) in enumerate(((-14.68, -11.30), (-9.81, -6.43), (4.07, 7.44), (9.21, 12.59), (14.31, 17.68))):
        xm = (xa + xb) / 2
        box(c, f"display_plinth_{i}", xa, xb, 0.36, 1.83, 0.04, 1.3, m["plinth"], 0.012)
        box(c, f"display_item_{i}", xm - 0.55, xm + 0.55, 0.62, 1.58, 1.3, 2.05, m["product"], 0.03)
        box(c, f"display_case_{i}", xa + 0.12, xb - 0.12, 0.46, 1.73, 1.3, 2.6, m["acrylic"])
        text(c, f"display_label_{i}", f"DISPLAY {i + 1:02d}", P(xm, 1.845, 0.75), 0.06, m["ink"], spacing=1.4)
    return c


def speaker(c, x, y, m):
    box(c, "sub", x - 0.95, x + 0.95, y - 1.0, y + 1.0, 0.04, 2.1, m["black"], 0.012)
    box(c, "sub_grille", x - 0.85, x + 0.85, y + 1.0, y + 1.03, 0.2, 1.95, m["grille"])
    tube(c, "pole", [P(x, y, 2.1), P(x, y, 5.2)], 0.018, m["steel_dark"])
    box(c, "top", x - 0.68, x + 0.68, y - 0.62, y + 0.62, 5.2, 7.6, m["black"], 0.012)
    box(c, "top_grille", x - 0.6, x + 0.6, y + 0.62, y + 0.65, 5.32, 7.48, m["grille"])


def light_stand(c, x, y, m, aim):
    H = 11.0
    tube(c, "stand_mast", [P(x, y, 0.4), P(x, y, H)], 0.022, m["steel_dark"])
    tube(c, "stand_mast_lower", [P(x, y, 0.4), P(x, y, 5.5)], 0.03, m["black"])
    for a in range(3):
        ang = a * 2.094 + 0.5
        foot = P(x + math.cos(ang) * 2.6, y + math.sin(ang) * 2.6, 0.03)
        tube(c, "stand_leg", [P(x, y, 3.2), foot], 0.014, m["black"])
        tube(c, "stand_strut", [P(x, y, 0.9), (P(x, y, 3.2) + foot) / 2], 0.009, m["black"])
        box(c, "sandbag", x + math.cos(ang) * 2.2 - 0.5, x + math.cos(ang) * 2.2 + 0.5, y + math.sin(ang) * 2.2 - 0.3,
            y + math.sin(ang) * 2.2 + 0.3, 0.03, 0.4, m["rubber"], 0.06)
    tube(c, "t_bar", [P(x - 2.3, y, H), P(x + 2.3, y, H)], 0.02, m["black"])
    for k in (-1.9, -0.65, 0.65, 1.9):
        par_can(c, "stand_par", P(x + k, y, H + 0.5), aim, m)


def build_tech(m):
    c = collection("tech")
    speaker(c, -22.95, 1.25, m)
    speaker(c, 22.2, 1.15, m)
    light_stand(c, -31.45, 7.5, m, P(-6, -10, DECK_H + 4))
    light_stand(c, 27.5, 2.85, m, P(6, -10, DECK_H + 4))
    # console: U-shaped desk, 4 + 8 + 4 ft runs (drawing, stage left), dressed in black cloth
    for xa, xb, ya, yb in ((-35.24, -31.24, 3.73, 4.23), (-31.74, -31.24, -3.78, 4.22), (-35.24, -31.24, -4.26, -3.76)):
        box(c, "console_desk", xa, xb, ya, yb, 0.04, 2.9, m["skirt"])
    box(c, "console_top", -33.9, -31.7, -3.3, 3.3, 2.5, 2.6, m["black"], 0.006)
    for xa, xb in ((-33.9, -33.75), (-31.85, -31.7)):
        for ya in (-3.3, 3.15):
            box(c, "console_leg", xa, xb, ya, ya + 0.15, 0.04, 2.5, m["steel_dark"])
    box(c, "lighting_desk", -33.6, -32.0, -2.8, -0.4, 2.6, 2.95, m["black"], 0.02)
    box(c, "audio_desk", -33.6, -32.0, 0.2, 2.9, 2.6, 2.9, m["black"], 0.02)
    scr = mat("screen_on", (0.02, 0.02, 0.03), 0.2, emit=(0.15, 0.35, 0.6), strength=2.0)
    for y in (-2.3, -1.0, 1.0, 2.2):
        box(c, "monitor", -33.75, -33.7, y - 0.55, y + 0.55, 3.2, 3.95, scr)
        box(c, "monitor_back", -33.8, -33.75, y - 0.57, y + 0.57, 3.18, 3.97, m["black"])
    # cable ramp from console to the stage edge
    box(c, "cable_ramp", -31.2, -28.6, -0.8, 0.5, 0.035, 0.2, m["rubber"], 0.04)
    # Raised vehicle display platforms flanking the front of house (the angled "Ranger" shapes on the plan).
    # Plan draws them 4 x 12 ft; widened to 7.5 x 15 ft here so a vehicle fits — size to be confirmed.
    car = import_model("covered_car")
    for pts in (((-26.03, 6.09), (-22.08, 17.43), (-25.86, 18.74), (-29.81, 7.41)),
                ((26.38, 5.41), (20.81, 16.04), (24.35, 17.9), (29.92, 7.27))):
        cx = sum(q[0] for q in pts) / 4
        cy = sum(q[1] for q in pts) / 4
        ang = math.atan2(-(pts[1][1] - pts[0][1]), pts[1][0] - pts[0][0])   # long axis, Blender space
        L, W, Hh = 15.0 * FT, 7.5 * FT, 1.5 * FT
        for nm, me in (("vehicle_platform_skirt", boxes_mesh("vp_skirt", [(0, 0, Hh / 2 - 0.02, L, W, Hh - 0.04)])),
                       ("vehicle_platform_top", boxes_mesh("vp_top", [(0, 0, Hh - 0.02, L + 0.04, W + 0.04, 0.04)])),
                       ("vehicle_platform_trim", boxes_mesh("vp_trim", [(0, 0, Hh - 0.05, L + 0.07, W + 0.07, 0.03)]))):
            me.materials.append(m["skirt"] if "skirt" in nm else (m["deck"] if "top" in nm else m["steel"]))
            o = link(bpy.data.objects.new(nm, me), c)
            o.location = P(cx, cy, 0.035)
            o.rotation_euler.z = ang
        rm = boxes_mesh("vp_ramp", [(0, 0, 0, 1.1, W * 0.5, 0.03, 0.0)])
        rm.materials.append(m["steel"])
        ro = link(bpy.data.objects.new("vehicle_platform_ramp", rm), c)
        ro.location = P(cx, cy, 0.035) + Vector((math.cos(ang), math.sin(ang), 0)) * (L / 2 + 0.5) + Vector((0, 0, Hh / 2))
        ro.rotation_euler = (0, math.atan2(Hh, 1.1) * (1 if True else -1), ang)
        if car:
            vs = [v.co for v in car.vertices]
            dx = max(v.x for v in vs) - min(v.x for v in vs)
            dy = max(v.y for v in vs) - min(v.y for v in vs)
            long_len = max(dx, dy)
            o = link(bpy.data.objects.new("vehicle_covered_TBC", car), c)
            sc_ = (13.0 * FT) / long_len
            o.scale = (sc_, sc_, sc_)
            o.location = P(cx, cy, 0.035) + Vector((0, 0, Hh))
            o.rotation_euler.z = ang + (math.pi / 2 if dy > dx else 0)
        text(c, "vehicle_label", "VEHICLE DISPLAY", P(cx, cy, 0.035) + Vector((math.sin(ang), -math.cos(ang), 0)) * (W / 2 + 0.012) + Vector((0, 0, Hh * 0.5)),
             0.09, m["whiteink"], rot=(math.pi / 2, 0, ang), spacing=1.5)
    return c


def chair_mesh(m):
    """Banquet chair with a fitted cover."""
    s = 0.43
    cover = boxes_mesh("chair_cover", [
        (0, 0, 0.455, s, s, 0.085),
        (0, s / 2 - 0.005, 0.74, s - 0.02, 0.05, 0.56, math.radians(-7)),
        (0, 0, 0.24, s - 0.01, s - 0.01, 0.38)], 0.03, 3)
    cover.materials.append(m["chair"])
    return cover


def table_mesh(m):
    """5 ft round with a floor-length cloth: flat top, softly pleated skirt."""
    r, h = 2.5 * FT, 0.75
    bm = bmesh.new()
    seg = 72
    top = [bm.verts.new((math.cos(i * 2 * math.pi / seg) * r, math.sin(i * 2 * math.pi / seg) * r, h)) for i in range(seg)]
    bm.faces.new(top)
    mid = [bm.verts.new((math.cos(i * 2 * math.pi / seg) * (r + 0.015), math.sin(i * 2 * math.pi / seg) * (r + 0.015), h - 0.03)) for i in range(seg)]
    bot = []
    for i in range(seg):
        a = i * 2 * math.pi / seg
        rr = r + 0.07 + 0.045 * math.sin(a * 12) + 0.015 * math.sin(a * 5 + 1)
        bot.append(bm.verts.new((math.cos(a) * rr, math.sin(a) * rr, 0.04)))
    for i in range(seg):
        j = (i + 1) % seg
        bm.faces.new((top[i], mid[i], mid[j], top[j]))
        bm.faces.new((mid[i], bot[i], bot[j], mid[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new("round_table")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(m["cloth"])
    return me


def build_audience(m):
    c = collection("audience")
    ch = chair_mesh(m)
    xs_l = [-25.09 + i * 2.316 for i in range(10)]
    xs_r = [4.18 + i * 2.316 for i in range(10)]
    for y in (34.36, 38.36, 42.36, 46.36):
        for x in xs_l + xs_r:
            inst(c, "chair", ch, x, y, 0.035, rot=math.pi)
    # VIP sofas and tables (Poly Haven models, sized to the drawn footprints)
    s2 = import_model("sofa_02")
    s1 = import_model("modern_arm_chair_01")
    ct = import_model("coffee_table_round_01")
    for y in (26.37, 30.35):
        for x in (-19.12, -11.82, 11.83, 19.13):
            if s2:
                inst(c, "sofa2", s2, x, y, 0.035, rot=math.pi, scale=1.0)
        for x in (-6.2, 6.21):
            if s1:
                inst(c, "sofa1", s1, x, y, 0.035, rot=math.pi, scale=1.0)
    for x in (-19.12, -11.82, -6.2, 6.21, 11.83, 19.13):
        if ct:
            inst(c, "teapoy", ct, x, 22.27, 0.035, scale=0.62)
    # round tables at the back with 6 covered chairs each
    tm = table_mesh(m)
    for tx in (-20.93, -12.16, 12.10, 20.87):
        inst(c, "round_table", tm, tx, 51.0, 0.035)
        for k in range(6):
            a = k * math.pi / 3 + math.pi / 6
            inst(c, "chair", ch, tx + math.cos(a) * 3.55, 51.0 + math.sin(a) * 3.55, 0.035, rot=-a + math.pi / 2)
        box(c, "centrepiece", tx - 0.25, tx + 0.25, 50.75, 51.25, 2.5, 3.2, m["product"], 0.02)
    # media riser at the back with tripods
    box(c, "media_riser", -8.07, 7.93, 52, 56, 0.035, 1.5, m["deck"])
    box(c, "media_riser_skirt", -8.07, 7.93, 51.96, 52, 0.035, 1.4, m["skirt"])
    for x in (-5, -1.5, 2, 5.5):
        for a in range(3):
            ang = a * 2.094
            tube(c, "tripod_leg", [P(x, 53.6, 5.6), P(x + math.cos(ang) * 1.3, 53.6 + math.sin(ang) * 1.3, 1.5)], 0.012, m["black"])
        box(c, "camera_body", x - 0.3, x + 0.3, 52.9, 54.1, 5.6, 6.3, m["black"], 0.02)
        o = link(bpy.data.objects.new("camera_lens", cyl_mesh("cam_lens", 0.05, 0.22, 20, axis="Y")), c)
        o.location = P(x, 52.6, 5.95)
        if not o.data.materials:
            o.data.materials.append(m["black"])
    return c


def build_services(m):
    c = collection("services")
    vent = mat("vent_dark", (0.05, 0.05, 0.055), 0.5)
    for s in (-1, 1):
        for y0 in (49.15, 40.29):
            xa, xb = (27.0, 30.0) if s > 0 else (-30.06, -27.06)
            box(c, "cooler", xa, xb, y0, y0 + 4, 0.25, 5.4, m["appliance"], 0.05)
            xf = xa if s > 0 else xb
            box(c, "cooler_grille", xf - 0.03, xf + 0.03, y0 + 0.35, y0 + 3.65, 2.2, 5.0, vent)
            for cx in (xa + 0.4, xb - 0.4):
                for cy in (y0 + 0.4, y0 + 3.6):
                    box(c, "cooler_castor", cx - 0.12, cx + 0.12, cy - 0.12, cy + 0.12, 0.03, 0.25, m["rubber"])
        for y0 in (32.1, 25.8):
            xa, xb = (29.0, 30.0) if s > 0 else (-30.06, -29.06)
            box(c, "tower_ac", xa, xb, y0 + 0.9, y0 + 2.1, 0.04, 6.0, m["appliance"], 0.04)
            xf = xa if s > 0 else xb
            box(c, "tower_ac_vent", xf - 0.02, xf + 0.02, y0 + 1.05, y0 + 1.95, 3.6, 5.6, vent)
    # planters with clipped hedging + potted plants (drawing: 3 x 10 ft beds)
    pp = import_model("potted_plant_02")
    for s in (-1, 1):
        for y0 in (26.39, 9.13):
            xa, xb = (30.0, 33.0) if s > 0 else (-33.06, -30.06)
            box(c, "planter", xa, xb, y0, y0 + 10, 0, 1.7, m["pot"], 0.03)
            box(c, "planter_soil", xa + 0.15, xb - 0.15, y0 + 0.15, y0 + 9.85, 1.5, 1.6, mat("soil", (0.05, 0.035, 0.025), 0.95))
            if pp:
                random.seed(int(y0 * 7 + s))
                for k in range(4):
                    for dx in (1.5,):
                        o = inst(c, "plant", pp, xa + dx + random.uniform(-0.2, 0.2), y0 + 1.3 + k * 2.45, 1.45,
                                 rot=random.uniform(0, 6.28), scale=random.uniform(1.15, 1.4))
            else:
                box(c, "hedge", xa + 0.2, xb - 0.2, y0 + 0.2, y0 + 9.8, 1.6, 4.2, m["hedge"], 0.1)
    # side dining counters along the left edge, clothed
    for y0 in (11.41, 15.96, 20.51, 25.07, 29.62, 34.18, 38.73, 43.28):
        box(c, "dining_counter", -40, -38, y0, y0 + 4, 0, 2.5, m["cloth"], 0.01)
        box(c, "chafing", -39.6, -38.4, y0 + 0.8, y0 + 3.2, 2.5, 3.1, m["steel"], 0.04)
    # standee wall on the public passage side
    box(c, "standee_wall", 39.08, 39.79, 11.13, 47.21, 0, 8.0, m["flex_dark"])
    for k in range(4):
        yc = 15.5 + k * 9
        text(c, "standee_brand", BRAND, P(39.06, yc, 5.0), 0.34, m["whiteink"], rot=(math.pi / 2, 0, -math.pi / 2), spacing=1.1)
    # registration desk + main entrance arch (behind the LED, per drawing)
    box(c, "registration_desk", 26.44, 28.44, -31.64, -28.64, 0, 3.4, m["plinth"], 0.02)
    box(c, "registration_backdrop", 25.30, 26.30, -34.14, -26.14, 0, 8.0, m["flex_dark"])
    for xa, xb in ((25.05, 27.05), (39.05, 41.05)):
        box(c, "arch_leg", xa, xb, -55.54, -45.54, 0, 12, m["flex_dark"])
    box(c, "arch_top", 25.05, 41.05, -45.52, -43.52, 9.5, 12, m["flex_dark"])
    text(c, "arch_brand", BRAND, P(33.05, -43.5, 10.75), 0.4, m["whiteink"], spacing=1.1)
    return c


def build_building(m):
    """the venue building mass behind the LED. Footprint from the drawing; height and facade ASSUMED."""
    c = collection("building")
    xa, xb, ya, yb, H = -14.6, 14.6, -25.35, -44.92, 58
    box(c, "bldg_core", xa + 0.3, xb - 0.3, yb + 0.3, ya - 0.3, 0, H, m["glass"])
    for z in range(0, H + 1, 12):
        box(c, "bldg_slab", xa - 0.4, xb + 0.4, yb - 0.4, ya + 0.4, max(z - 0.6, 0), z + 0.6, m["concrete"])
    n = 14
    for i in range(n + 1):
        x = xa + i * (xb - xa) / n
        box(c, "bldg_mullion", x - 0.08, x + 0.08, ya - 0.02, ya + 0.22, 0, H, m["steel_dark"])
    for z in range(4, H, 4):
        if z % 12:
            box(c, "bldg_transom", xa, xb, ya - 0.02, ya + 0.16, z - 0.06, z + 0.06, m["steel_dark"])
    # perimeter trees to give the plaza a horizon
    tr = None  # import_model("tree_small_02")
    if tr:
        random.seed(4)
        for (x, y) in ():   # background trees disabled: 2M polygons each, too heavy for this laptop under load
            inst(c, "tree", tr, x, y, 0, rot=random.uniform(0, 6.28), scale=random.uniform(1.5, 2.1))
    return c


def hdri_sun_azimuth(img):
    """Brightest column of an equirect HDRI -> azimuth (radians) of the sun in Blender world space."""
    import numpy as np
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    lum = px.reshape(h, w, 4)[:, :, :3].sum(axis=2)
    iy, ix = np.unravel_index(int(lum.argmax()), lum.shape)
    u, v = (ix + 0.5) / w, (iy + 0.5) / h
    phi = (u - 0.5) * 2 * math.pi
    return math.atan2(math.sin(phi), -math.cos(phi)), (v - 0.5) * math.pi


def build_world():
    sc = bpy.context.scene
    w = bpy.data.worlds.new("World")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes["Background"]
    path = os.path.join(ASSETS, "hdri", "kloofendal_43d_clear_puresky_4k.hdr")
    if os.path.exists(path):
        img = bpy.data.images.load(path)
        az, el = hdri_sun_azimuth(img)
        want = math.atan2(SUN_DIR.y, SUN_DIR.x)
        env = nt.nodes.new("ShaderNodeTexEnvironment")
        env.image = img
        tc = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.vector_type = "POINT"
        mp.inputs["Rotation"].default_value = (0, 0, want - az)
        nt.links.new(tc.outputs["Generated"], mp.inputs[0])
        nt.links.new(mp.outputs[0], env.inputs[0])
        nt.links.new(env.outputs[0], bg.inputs[0])
        bg.inputs[1].default_value = 1.0
        print(f"HDRI sun azimuth {math.degrees(az):.1f} elev {math.degrees(el):.1f} -> rotated to {math.degrees(want):.1f}")
        for k, v in (("sun_threshold", 10.0), ("use_sun_shadow", True), ("sun_angle", math.radians(1.0))):
            if hasattr(w, k):
                setattr(w, k, v)
    else:
        bg.inputs[0].default_value = (0.5, 0.65, 0.9, 1)


def add_camera(name, loc, target, lens=28, fstop=None):
    cam = bpy.data.cameras.new(name)
    cam.lens = lens
    cam.sensor_width = 36
    cam.clip_start = 0.05
    cam.clip_end = 800
    o = bpy.data.objects.new(name, cam)
    o.location = loc
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    if fstop:
        cam.dof.use_dof = True
        cam.dof.focus_distance = (Vector(target) - Vector(loc)).length
        cam.dof.aperture_fstop = fstop
    bpy.context.scene.collection.objects.link(o)
    return o


def build_cameras():
    return {
        "front_wide": add_camera("cam_front_wide", P(0, 47, 5.4), P(0, -14, 11.5), 24),
        "vip_seat": add_camera("cam_vip_seat", P(-10, 23.5, 4.3), P(2, -14, 11), 26, 5.6),
        "aerial_34": add_camera("cam_aerial_34", P(-64, 80, 46), P(0, 8, 5), 30),
        "stage_left": add_camera("cam_stage_left", P(-37, 14, 7.5), P(6, -13, 10), 24),
        "hero_low": add_camera("cam_hero_low", P(13, 13, 3.4), P(-3, -15, 12.5), 22, 4.0),
        "plan": add_camera("cam_plan", P(0, 12, 200), P(0, 12.01, 0), 50),
    }


def setup_render(sc, w=1280, h=720, engine="EEVEE", samples=None):
    if engine == "CYCLES":
        sc.render.engine = "CYCLES"
        cy = sc.cycles
        cy.samples = samples or 96
        cy.use_adaptive_sampling = True
        cy.adaptive_threshold = 0.03
        cy.use_denoising = True
        cy.max_bounces = 6
        cy.transparent_max_bounces = 8
        try:
            prefs = bpy.context.preferences.addons["cycles"].preferences
            prefs.compute_device_type = "METAL"
            prefs.get_devices()
            for d in prefs.devices:
                d.use = True
            cy.device = "GPU"
        except Exception as e:
            print("GPU setup failed, CPU render:", e)
    else:
        for e in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
            try:
                sc.render.engine = e
                break
            except TypeError:
                continue
        ee = sc.eevee
        for k, v in (("taa_render_samples", samples or 48), ("use_shadows", True), ("use_raytracing", True),
                     ("shadow_ray_count", 2), ("shadow_step_count", 6), ("use_gtao", True)):
            if hasattr(ee, k):
                setattr(ee, k, v)
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    sc.view_settings.exposure = -0.05
    sc.unit_settings.system = "IMPERIAL"


def build_all():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    m = M()
    build_ground(m)
    build_stage(m)
    build_side_truss(m)
    build_header_lights(m)
    build_stage_dressing(m)
    build_tech(m)
    build_audience(m)
    build_services(m)
    build_building(m)
    build_world()
    cams = build_cameras()
    setup_render(bpy.context.scene)
    return m, cams


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

    def arg(k, d=None):
        return argv[argv.index(k) + 1] if k in argv else d

    out = arg("--out", os.path.join(HERE, "out"))
    os.makedirs(out, exist_ok=True)
    t0 = time.time()
    m, cams = build_all()
    sc = bpy.context.scene
    print(f"BUILT in {time.time() - t0:.1f}s, {len(bpy.data.objects)} objects")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, "venue.blend"))
    only = arg("--cams")
    if "--render" in argv:
        for name, cam in cams.items():
            if only and name not in only.split(","):
                continue
            t = time.time()
            sc.camera = cam
            sc.render.filepath = os.path.join(out, f"venue_{name}.png")
            bpy.ops.render.render(write_still=True)
            print(f"RENDERED {name} in {time.time() - t:.1f}s")
    if "--cycles" in argv:
        name = arg("--cycles")
        setup_render(sc, int(arg("--w", 1920)), int(arg("--h", 1080)), "CYCLES", int(arg("--samples", 96)))
        sc.camera = cams[name]
        sc.render.filepath = os.path.join(out, f"proof_{name}.png")
        t = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"CYCLES {name} {sc.render.resolution_x}x{sc.render.resolution_y} {sc.cycles.samples}spp in {time.time() - t:.1f}s")
