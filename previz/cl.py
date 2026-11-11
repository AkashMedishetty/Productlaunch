"""Shared library for the six reveal concepts (helpers only; each concept lives in previz/c_<name>.py).

Original description: Six reveal concepts on the shared outdoor venue, built from the written specs in src/data/concepts.ts.

Run:  blender -b -P previz/concepts.py -- --concept pulse [--stills] [--anim] [--w 1280 --h 720]
Concepts: pulse, ignition, cargo, revolve, unseen, stageproduct
Two products (5 x 5 ft and 7 x 7 ft footprints; heights ASSUMED).
Timeline, 24 fps, 240 frames:
  36 guest input · 40-84 signal travels · 84-120 LED wall wakes · 120-136 return to the products
  138 reveal starts · ~180 reveal complete, effects fire · 240 hero hold
"""
import bpy, bmesh, math, sys, os, time
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import venue as V
import fx
import hero
from venue import P, FT, DECK_H, DECK_D, box, tube, text, truss, link, collection, mat

FPS, END = 24, 240
F_TOUCH, F_WAKE, F_RETURN, F_REVEAL, F_OPEN = 36, 84, 120, 138, 178
PRODUCTS = hero.PRODUCTS
PL = hero.PLINTH_H
CONCEPTS = ("pulse", "ignition", "cargo", "revolve", "unseen", "stageproduct")
CX, CY = -0.5, -3.2          # guest console position, front centre of the deck


m_ = {}          # shared material table, filled by concepts.py before a concept is built


# ------------------------------------------------------------------ helpers --
def key(o, f, loc=None, rot=None, scale=None, hide=None):
    if loc is not None:
        o.location = loc
        o.keyframe_insert("location", frame=f)
    if rot is not None:
        o.rotation_euler = rot
        o.keyframe_insert("rotation_euler", frame=f)
    if scale is not None:
        o.scale = scale
        o.keyframe_insert("scale", frame=f)
    if hide is not None:
        o.hide_render = hide
        o.hide_viewport = hide
        o.keyframe_insert("hide_render", frame=f)
        o.keyframe_insert("hide_viewport", frame=f)


def show_from(o, f, until=None):
    key(o, 1, hide=True)
    key(o, f - 1, hide=True)
    key(o, f, hide=False)
    if until:
        key(o, until, hide=True)
    return o


def hide_from(o, f):
    key(o, 1, hide=False)
    key(o, f - 1, hide=False)
    key(o, f, hide=True)
    return o


def empty(c, name, loc):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    link(o, c)
    bpy.context.view_layer.update()
    return o


def parent(child, par):
    bpy.context.view_layer.update()
    child.parent = par
    child.matrix_parent_inverse = par.matrix_world.inverted()
    return child


def origin_to(o, where):
    """Move the object's origin to the top / bottom / a side of its bounds without moving the mesh."""
    me = o.data
    lo = Vector((min(v.co[i] for v in me.vertices) for i in range(3)))
    hi = Vector((max(v.co[i] for v in me.vertices) for i in range(3)))
    d = Vector((0, 0, 0))
    if where == "top":
        d.z = hi.z
    elif where == "bottom":
        d.z = lo.z
    elif where == "left":
        d.x = lo.x
    elif where == "right":
        d.x = hi.x
    me.transform(Matrix.Translation(-d))
    o.location += d
    return o


def emissive(name, color, strength=30.0):
    return mat(name, color, 0.4, emit=color, strength=strength)


def pulse_head(c, pts, f0, f1, glow):
    """The signal itself: a bright head that travels the route (plan feet, xyz) and throws light on the deck."""
    me = V.boxes_mesh("pulse_head", [(0, 0, 0, 0.42, 0.42, 0.14)], 0.05, 3)
    me.materials.append(glow)
    o = link(bpy.data.objects.new("pulse_head", me), c)
    li = bpy.data.lights.new("pulse_glow", "POINT")
    li.energy = 900
    li.color = glow.diffuse_color[:3]
    li.shadow_soft_size = 0.3
    lo = link(bpy.data.objects.new("pulse_glow", li), c)
    o.location = lo.location = P(*pts[0])
    lo.location.z += 0.35
    parent(lo, o)
    d = [0.0]
    for a, b in zip(pts, pts[1:]):
        d.append(d[-1] + math.dist(a, b))
    prefs = bpy.context.preferences.edit
    old = prefs.keyframe_new_interpolation_type
    prefs.keyframe_new_interpolation_type = "LINEAR"
    for q, dd in zip(pts, d):
        key(o, f0 + (f1 - f0) * dd / max(d[-1], 1e-6), loc=P(*q))
    prefs.keyframe_new_interpolation_type = old
    for ob in (o, lo):
        key(ob, 1, hide=True)
        key(ob, int(f0) - 1, hide=True)
        key(ob, int(f0), hide=False)
        key(ob, int(f1) + 1, hide=True)
    return o


def fascia_run(c, f0, f1, glow):
    """The same signal on the stage front, where every seat can see it: runs from centre out to both wings."""
    n = 22
    for i in range(n):
        for sg in (-1, 1):
            xa = CX + sg * i * 27.0 / n
            xb = CX + sg * (i + 1) * 27.0 / n - sg * 0.06
            show_from(box(c, "fascia_pixels", min(xa, xb), max(xa, xb), 0.03, 0.07, DECK_H - 0.5, DECK_H - 0.3, glow), int(f0 + i * (f1 - f0) / n))


def lit_path(c, pts, f0, f1, glow, z=DECK_H, w=0.3):
    """Addressable LED channel on the deck: aluminium extrusion + pixels that light in order f0..f1."""
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
    pulse_head(c, [(x, y, z + 0.22) for x, y in pts], f0, f1, glow)


def lit_fin(c, x, y, z0, z1, f0, f1, glow):
    """Vertical scenic fin carrying the signal up into the LED wall."""
    box(c, "fin_body", x - 0.35, x + 0.35, y - 0.5, y + 0.1, z0, z1, m_["black"], 0.01)
    n = max(1, round((z1 - z0) / 1.2))
    for i in range(n):
        a, b = z0 + (z1 - z0) * i / n, z0 + (z1 - z0) * (i + 1) / n
        show_from(box(c, "fin_pixels", x - 0.3, x + 0.3, y + 0.1, y + 0.13, a, b, glow), f0 + round(i * (f1 - f0) / n))
    pulse_head(c, [(x, y + 0.35, z0 + 0.3), (x, y + 0.35, z1)], f0, f1, glow)


def console(c, label, glow, kind="palm"):
    """Low ceremonial console at the front of the stage; its top lights when the guest acts."""
    z = DECK_H
    box(c, "console_base", CX - 1.5, CX + 1.5, CY - 0.95, CY + 0.95, z, z + 0.18, m_["black"], 0.01)
    box(c, "console_body", CX - 1.25, CX + 1.25, CY - 0.75, CY + 0.75, z + 0.18, z + 2.95, m_["plinth"], 0.03)
    box(c, "console_top", CX - 1.35, CX + 1.35, CY - 0.85, CY + 0.85, z + 2.95, z + 3.08, m_["black"], 0.012)
    box(c, "console_pad", CX - 0.7, CX + 0.7, CY - 0.5, CY + 0.5, z + 3.08, z + 3.1, m_["grille"])
    show_from(box(c, "console_pad_lit", CX - 0.66, CX + 0.66, CY - 0.46, CY + 0.46, z + 3.1, z + 3.12, glow), F_TOUCH)
    show_from(box(c, "console_halo", CX - 1.27, CX + 1.27, CY + 0.75, CY + 0.78, z + 0.3, z + 0.42, glow), F_TOUCH)
    text(c, "console_label", label, P(CX, CY + 0.785, z + 2.0), 0.075, m_["ink"], spacing=1.6)
    if kind == "handle":
        hp = empty(c, "handle_pivot", P(CX, CY, z + 3.1))
        parent(box(c, "handle_boss", CX - 0.2, CX + 0.2, CY - 0.2, CY + 0.2, z + 3.1, z + 3.35, m_["chrome"], 0.03), hp)
        parent(box(c, "handle_arm", CX - 0.07, CX + 0.9, CY - 0.07, CY + 0.07, z + 3.35, z + 3.5, m_["chrome"], 0.02), hp)
        key(hp, F_TOUCH - 10, rot=(0, 0, 0))
        key(hp, F_TOUCH + 4, rot=(0, 0, math.radians(-90)))
    if kind == "core":
        core = box(c, "core_module", CX - 0.3, CX + 0.3, CY - 0.3, CY + 0.3, z + 3.12, z + 3.7, m_["chrome"], 0.04)
        key(core, F_TOUCH - 14, loc=core.location + Vector((0, 0, 0.45)))
        key(core, F_TOUCH, loc=core.location - Vector((0, 0, 0.45)))


def led_wake(c, glow, f0=F_WAKE, f1=F_RETURN):
    """The LED wall goes from black to a launch sequence: columns rise, then a calm lit field. No text."""
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
    field = emissive("led_field", (0.012, 0.035, 0.09), 1.0)
    bloom = emissive("led_bloom", (0.06, 0.16, 0.36), 1.6)
    show_from(box(c, "led_field", -W / 2, W / 2, yf - 0.012, yf - 0.002, z0, z0 + H, field), f1 + 6)
    # two slim horizontal light rules across the wall instead of blocks behind the products
    for zz in (z0 + H * 0.22, z0 + H * 0.78):
        show_from(box(c, "led_rule", -W / 2 + 1.5, W / 2 - 1.5, yf - 0.006, yf + 0.004, zz - 0.06, zz + 0.06, glow), f1 + 6)


def product_light(c, p, f, glow_strength=14.0):
    """Hard hero light on the product from the reveal onward (reads in daylight as a lit edge + pool)."""
    li = bpy.data.lights.new("hero_spot", "SPOT")
    li.energy = 9000
    li.spot_size = math.radians(34)
    li.spot_blend = 0.4
    o = bpy.data.objects.new("hero_spot", li)
    o.location = P(p["x"], p["y"] + 9, DECK_H + 21)
    o.rotation_euler = (P(p["x"], p["y"], DECK_H + PL + p["h"] / 2) - o.location).to_track_quat("-Z", "Y").to_euler()
    link(o, c)
    show_from(o, f)


def finale(c, f=F_OPEN, sparks=True):
    """Shared reveal effects: fog spill, CO2 at each product, cold sparks on the stage edge, confetti."""
    for p in PRODUCTS:
        s = p["size"] / 2 + 1.6
        for sx in (-s, s):
            j = fx.co2_jet(c, p["x"] + sx, p["y"] + 1.0, DECK_H, height=15, t=0.9)
            origin_to(j, "bottom")
            key(j, 1, hide=True)
            key(j, f - 1, hide=True)
            key(j, f, hide=False, scale=(0.5, 0.5, 0.05))
            key(j, f + 8, scale=(1, 1, 1))
            key(j, f + 34, scale=(1.5, 1.5, 1.15))
            key(j, f + 35, hide=True)
    if sparks:
        for i, x in enumerate((-26.5, -23, 23, 26.5)):
            vs = [fx.spark_fountain(c, x, -17.5, DECK_H, height=15, count=520, t=1.0, seed=40 + i * 7 + k) for k in range(3)]
            for k, o in enumerate(vs):
                key(o, 1, hide=True)
                for fr in range(f, END + 1):
                    key(o, fr, hide=((fr - f) % 3 != k))
    for i, p in enumerate(PRODUCTS):
        o = fx.confetti(c, p["x"] - 14, p["x"] + 14, -19, -12.5, DECK_H + 13, 40, count=800, seed=3 + i, name=f"confetti_{i}", size=0.72)
        key(o, 1, hide=True)
        key(o, f + 3, hide=True)
        key(o, f + 4, hide=False, loc=Vector((0, 0, 2.5)))
        key(o, END, loc=Vector((0.6, -0.4, -3.2)))


def fog_floor(c, f, density=0.6):
    o = fx.low_fog(c, -27, 27, -19.5, 0.4, DECK_H, height=3.6, density=density)
    origin_to(o, "bottom")
    key(o, 1, hide=True)
    key(o, f - 1, hide=True)
    key(o, f, hide=False, scale=(1, 1, 0.15))
    key(o, f + 40, scale=(1, 1, 1))
    return o


def guest(c):
    """Chief guest (neutral previz mannequin): walks in from stage left, performs the cue at F_TOUCH, steps back."""
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
    a0, a1, b0, b1 = 2, F_TOUCH - 8, F_TOUCH + 34, F_TOUCH + 96
    start, away = (-20.0, -5.5), (-13.5, -3.4)
    key(root, a0, loc=P(start[0], start[1], DECK_H), rot=(0, 0, math.radians(90)))
    key(root, a1 - 5, rot=(0, 0, math.radians(90)))
    key(root, a1, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b0, loc=P(stand[0], stand[1], DECK_H), rot=(0, 0, 0))
    key(root, b1, loc=P(away[0], away[1], DECK_H), rot=(0, 0, math.radians(35)))
    for (fa, fb) in ((a0, a1), (b0, b1)):          # walk cycle: legs and the free arm swing
        f, k = fa, 0
        while f <= fb:
            sw = 0 if f + 5 > fb else math.radians(24) * (1 if k % 2 == 0 else -1)
            key(legs[0], f, rot=(sw, 0, 0))
            key(legs[1], f, rot=(-sw, 0, 0))
            key(arm_l, f, rot=(sw * 0.7, 0, 0))
            f += 5
            k += 1
    key(arm_r, a1, rot=(0, 0, 0))                    # the cue: palm onto the console
    key(arm_r, F_TOUCH, rot=(math.radians(-43), 0, 0))
    key(arm_r, b0 - 6, rot=(math.radians(-43), 0, 0))
    key(arm_r, b0 + 2, rot=(0, 0, 0))
    return root


def camera(shots=None):
    sc = bpy.context.scene
    cam = bpy.data.cameras.new("cam_concept")
    cam.lens = 24
    cam.clip_end = 800
    co = bpy.data.objects.new("cam_concept", cam)
    sc.collection.objects.link(co)
    tg = bpy.data.objects.new("cam_target", None)
    sc.collection.objects.link(tg)
    con = co.constraints.new("TRACK_TO")
    con.target = tg
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    shots = shots or [(1, (-13, 9, 12.5), (CX, CY - 1.5, DECK_H + 3.4)),        # raised, on the guest and console
             (F_TOUCH + 6, (-11, 8, 11.5), (CX, CY - 2.5, DECK_H + 3.0)),
             (F_WAKE, (-6, 22, 15), (0, -13, 8)),                       # rising to follow the signal upstage
             (F_REVEAL - 12, (0, 41, 6.6), (0, -10, 10.5)),             # settling into the centre aisle seat
             (END, (0, 33, 5.6), (0, -10, 10.5))]
    for f, a, b in shots:
        key(co, f, loc=P(*a))
        key(tg, f, loc=P(*b))
    sc.camera = co


def products(c):
    for p in PRODUCTS:
        hero.product(c, m_, p)


# ------------------------------------------------------------------ concepts --
def arc_shell(name, r, h, a0, a1, material, seg=64, thick=0.06):
    bm = bmesh.new()
    lo, hi = [], []
    for k in range(seg + 1):
        a = a0 + (a1 - a0) * k / seg
        lo.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, 0)))
        hi.append(bm.verts.new((math.cos(a) * r, math.sin(a) * r, h)))
    for k in range(seg):
        bm.faces.new((lo[k], lo[k + 1], hi[k + 1], hi[k]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p_ in me.polygons:
        p_.use_smooth = True
    me.materials.append(material)
    o = bpy.data.objects.new(name, me)
    md = o.modifiers.new("solid", "SOLIDIFY")
    md.thickness = thick
    md.offset = 0
    return o


