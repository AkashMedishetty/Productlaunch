"""Reveal effects shared by every concept: low fog, CO2 jets, cold-spark fountains, confetti, show spots.

All positions are plan feet (see venue.P). Geometry is static per call; pass `t` (seconds since the cue)
to pose time-dependent effects so the same functions serve stills and frame-by-frame animation.
"""
import bpy, bmesh, math, random
from mathutils import Vector, Matrix
from venue import P, FT, DECK_H, link, mat


def _volume_mat(name, density, color=(1, 1, 1), noise_scale=1.2, falloff=2.0, aniso=0.35, seed=0.0):
    m = bpy.data.materials.get(name)
    if m:
        return m
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
    vol.inputs["Anisotropy"].default_value = aniso
    tc = N.new("ShaderNodeTexCoord")
    sep = N.new("ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Generated"], sep.inputs[0])
    inv = N.new("ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    L.new(sep.outputs["Z"], inv.inputs[1])
    pw = N.new("ShaderNodeMath")
    pw.operation = "POWER"
    pw.inputs[1].default_value = falloff
    L.new(inv.outputs[0], pw.inputs[0])
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (seed, seed * 0.7, 0)
    L.new(tc.outputs["Object"], mp.inputs[0])
    nz = N.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = noise_scale
    nz.inputs["Detail"].default_value = 5.0
    nz.inputs["Roughness"].default_value = 0.62
    L.new(mp.outputs[0], nz.inputs["Vector"])
    rmp = N.new("ShaderNodeMapRange")
    rmp.inputs[1].default_value = 0.38
    rmp.inputs[2].default_value = 0.72
    L.new(nz.outputs[0], rmp.inputs[0])
    mul = N.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    L.new(pw.outputs[0], mul.inputs[0])
    L.new(rmp.outputs[0], mul.inputs[1])
    mul2 = N.new("ShaderNodeMath")
    mul2.operation = "MULTIPLY"
    mul2.inputs[1].default_value = density
    L.new(mul.outputs[0], mul2.inputs[0])
    L.new(mul2.outputs[0], vol.inputs["Density"])
    L.new(vol.outputs[0], out.inputs["Volume"])
    return m


def low_fog(col, x0, x1, y0, y1, z0, height=3.2, density=0.55, name="low_fog", seed=0.0):
    """Heavy low-lying fog rolling across the deck (chilled fog / dry ice)."""
    a, b = P(x0, y0, z0), P(x1, y1, z0 + height)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((abs(b.x - a.x), abs(b.y - a.y), abs(b.z - a.z), 1)))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(_volume_mat(f"vol_{name}", density, noise_scale=0.9, falloff=2.2, seed=seed))
    o = bpy.data.objects.new(name, me)
    o.location = (a + b) / 2
    return link(o, col)


def co2_jet(col, x, y, z0, height=16.0, t=0.6, name="co2_jet"):
    """Vertical CO2 jet: tight at the nozzle, billowing at the top. t = seconds since firing (0..2)."""
    grow = min(1.0, t / 0.35)
    h = height * FT * grow
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.10, radius2=0.55 + 0.5 * min(t, 1.5), depth=h,
                          matrix=Matrix.Translation((0, 0, h / 2)))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(_volume_mat("vol_co2", 11.0 * max(0.25, 1 - t / 2.2), noise_scale=3.5, falloff=0.9, aniso=0.5, seed=x))
    o = bpy.data.objects.new(name, me)
    o.location = P(x, y, z0)
    box_ = bpy.data.objects.new("co2_nozzle", _unit_box(0.22, 0.22, 0.3))
    box_.data.materials.append(mat("black_gear", (0.018, 0.018, 0.02)))
    box_.location = P(x, y, z0) + Vector((0, 0, 0.15))
    link(box_, col)
    return link(o, col)


def _unit_box(sx, sy, sz):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Diagonal((sx, sy, sz, 1)))
    me = bpy.data.meshes.new("fx_box")
    bm.to_mesh(me)
    bm.free()
    return me


def spark_fountain(col, x, y, z0, height=14.0, count=900, t=1.0, seed=1, name="cold_spark"):
    """Cold-spark fountain (sparkular): streaks along ballistic paths, drawn as camera-facing quads."""
    rnd = random.Random(seed)
    g = 9.81
    v0 = math.sqrt(2 * g * height * FT)
    bm = bmesh.new()
    cam_dir = Vector((0, -1, 0))
    for _ in range(count):
        ang = rnd.gauss(0, 0.11)
        az = rnd.uniform(0, 2 * math.pi)
        sp = v0 * rnd.uniform(0.55, 1.0)
        v = Vector((math.sin(ang) * math.cos(az) * sp, math.sin(ang) * math.sin(az) * sp, math.cos(ang) * sp))
        age = rnd.uniform(0, min(t, 2 * sp / g * 0.92))
        p = v * age + Vector((0, 0, -0.5 * g * age * age))
        vel = v + Vector((0, 0, -g * age))
        streak = vel * rnd.uniform(0.012, 0.03)
        w = rnd.uniform(0.003, 0.007)
        side = streak.cross(cam_dir)
        if side.length < 1e-6:
            continue
        side = side.normalized() * w
        vs = [bm.verts.new(p - side), bm.verts.new(p + side), bm.verts.new(p + streak + side * 0.3), bm.verts.new(p + streak - side * 0.3)]
        bm.faces.new(vs)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat("spark_emit", (1.0, 0.72, 0.36), 0.5, emit=(1.0, 0.70, 0.34), strength=160.0))
    o = bpy.data.objects.new(name, me)
    o.location = P(x, y, z0)
    unit = bpy.data.objects.new("spark_unit", _unit_box(0.22, 0.22, 0.24))
    unit.data.materials.append(mat("black_gear", (0.018, 0.018, 0.02)))
    unit.location = P(x, y, z0) + Vector((0, 0, 0.12))
    link(unit, col)
    return link(o, col)


def confetti(col, x0, x1, y0, y1, z0, z1, count=7000, seed=3, t=1.6, name="confetti", size=1.0):
    """Tissue + metallic confetti mid-fall. Three materials; pieces 2 x 5 cm scaled up slightly to read at distance."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    a, b = P(x0, y0, z0), P(x1, y1, z1)
    lo = Vector((min(a.x, b.x), min(a.y, b.y), min(a.z, b.z)))
    hi = Vector((max(a.x, b.x), max(a.y, b.y), max(a.z, b.z)))
    for i in range(count):
        # denser high and centre, thinning as it falls and drifts
        u = rnd.betavariate(2.2, 2.2)
        p = Vector((lo.x + (hi.x - lo.x) * u, rnd.uniform(lo.y, hi.y), lo.z + (hi.z - lo.z) * rnd.betavariate(2.4, 1.5)))
        rot = Matrix.Rotation(rnd.uniform(0, 6.28), 3, "Z") @ Matrix.Rotation(rnd.uniform(0, 6.28), 3, "X") @ Matrix.Rotation(rnd.uniform(0, 6.28), 3, "Y")
        w, h = rnd.uniform(0.022, 0.03) * size, rnd.uniform(0.055, 0.075) * size
        curl = rnd.uniform(-0.012, 0.012)
        pts = [Vector((-w, -h, 0)), Vector((w, -h, 0)), Vector((w, 0, curl)), Vector((-w, 0, curl)), Vector((w, h, 0)), Vector((-w, h, 0))]
        vs = [bm.verts.new(p + rot @ q) for q in pts]
        f1 = bm.faces.new((vs[0], vs[1], vs[2], vs[3]))
        f2 = bm.faces.new((vs[3], vs[2], vs[4], vs[5]))
        k = 0 if i % 5 < 2 else (1 if i % 5 < 4 else 2)
        f1.material_index = f2.material_index = k
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat("confetti_gold", (1.0, 0.72, 0.26), 0.22, 1.0))
    me.materials.append(mat("confetti_white", (0.95, 0.95, 0.93), 0.6))
    me.materials.append(mat("confetti_silver", (0.9, 0.9, 0.92), 0.18, 1.0))
    o = bpy.data.objects.new(name, me)
    return link(o, col)


def show_spot(col, loc, aim, watts=2500, color=(1.0, 0.93, 0.82), angle=16, name="show_spot"):
    li = bpy.data.lights.new(name, "SPOT")
    li.energy = watts
    li.color = color
    li.spot_size = math.radians(angle)
    li.spot_blend = 0.35
    li.shadow_soft_size = 0.06
    o = bpy.data.objects.new(name, li)
    o.location = loc
    o.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return link(o, col)
