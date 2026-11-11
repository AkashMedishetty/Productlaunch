"""Export a previz .blend to web-ready GLBs for the browser review page.

  blender -b previz/out/<c>/<c>.blend -P previz/export_glb.py -- --concept <c> [--venue]

Writes (relative to the project root):
  public/review/<c>.glb    only collection "concept_<c>", one merged animation clip
  public/review/<c>.json   camera path (glTF Y-up) sampled every 10 frames
  public/review/venue.glb  (with --venue) everything else, static, joined
  public/review/venue.json (with --venue) preset cameras + tree stand-in positions

Everything is done on the in-memory copy of the file. The .blend is never saved.
No rendering happens here.
"""
import argparse
import json
import math
import os
import sys
import time

import bmesh
import bpy
from mathutils import Vector

HIDDEN_SCALE = 1e-4
MAX_EMISSION = 4.0
PLANT_TRIS = 4000          # target triangles per plant after decimation
SKIP_PREFIXES = ("low_fog", "fog_spill", "co2_jet")   # volumes: film only
TREE_PREFIX = "tree"
PLANT_PREFIX = "plant"
GEOM_TYPES = {"MESH", "CURVE", "FONT", "SURFACE", "META"}
TEX_COLOUR_PX = 1024       # max size of base-colour textures in the GLB
TEX_DATA_PX = 512          # max size of normal / roughness / metal textures
JPEG_QUALITY = 82
CAMERA_STEP = 2            # frames between camera path samples
HDRI = os.path.join("previz", "assets", "hdri", "kloofendal_43d_clear_puresky_4k.hdr")

T0 = time.time()


def log(*a):
    print("[export_glb %6.1fs]" % (time.time() - T0), *a, flush=True)


def yup(v):
    """Blender Z-up -> glTF Y-up, same as the exporter's +Y up option."""
    return [round(v[0], 4), round(v[2], 4), round(-v[1], 4)]


# ----------------------------------------------------------------- animation
def channelbag(idblock):
    """Blender 5.x layered/slotted action -> the channelbag for this ID."""
    ad = idblock.animation_data
    if not ad or not ad.action:
        return None
    act, slot = ad.action, ad.action_slot
    if slot is None:
        return None
    for layer in act.layers:
        for strip in layer.strips:
            cb = strip.channelbag(slot)
            if cb is not None:
                return cb
    return None


def is_animated(o):
    cb = channelbag(o)
    return bool(cb and len(cb.fcurves)) or bool(o.animation_data and o.animation_data.drivers)


VIS_INFO = {}   # object name -> dict(pattern, base, pure) for objects converted below


def bake_visibility_to_scale(o, f0, f1):
    """Keyframed hide_render/hide_viewport -> CONSTANT scale keys, merged with
    any existing scale animation. Returns True if the object was converted."""
    cb = channelbag(o)
    if cb is None:
        return False
    hide = None
    for path in ("hide_render", "hide_viewport"):
        hide = next((f for f in cb.fcurves if f.data_path == path), None)
        if hide:
            break
    if hide is None:
        return False
    scale_fc = {f.array_index: f for f in cb.fcurves if f.data_path == "scale"}
    base = tuple(o.scale)
    frames = list(range(f0, f1 + 1))
    vals = [[], [], []]
    for f in frames:
        hidden = hide.evaluate(f) >= 0.5
        for i in range(3):
            s = scale_fc[i].evaluate(f) if i in scale_fc else base[i]
            vals[i].append(HIDDEN_SCALE if hidden else s)
    VIS_INFO[o.name] = dict(
        pattern=tuple(hide.evaluate(f) >= 0.5 for f in frames), base=base,
        pure=not scale_fc and all(f.data_path in ("hide_render", "hide_viewport") for f in cb.fcurves))
    for f in [f for f in cb.fcurves if f.data_path in ("hide_render", "hide_viewport", "scale")]:
        cb.fcurves.remove(f)
    for i in range(3):
        fc = cb.fcurves.new("scale", index=i)
        fc.keyframe_points.add(len(frames))
        flat = []
        for f, v in zip(frames, vals[i]):
            flat += [float(f), v]
        fc.keyframe_points.foreach_set("co", flat)
        for kp in fc.keyframe_points:
            kp.interpolation = "CONSTANT"
        fc.update()
    return True


# ----------------------------------------------------------------- materials
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def average_image_colour(img):
    """Mean colour (linear) of an image texture, alpha weighted. None on failure."""
    try:
        tmp = img.copy()
        tmp.scale(24, 24)
        px = list(tmp.pixels)
        bpy.data.images.remove(tmp)
        n = len(px) // 4
        if n == 0:
            return None
        r = g = b = w = 0.0
        for i in range(n):
            a = px[i * 4 + 3]
            r += px[i * 4] * a
            g += px[i * 4 + 1] * a
            b += px[i * 4 + 2] * a
            w += a
        if w < 1e-6:
            return None
        col = [r / w, g / w, b / w]
        if img.colorspace_settings.name == "sRGB" and not img.is_float:
            col = [srgb_to_linear(c) for c in col]
        if max(col) < 1e-4:
            return None
        return col
    except Exception as e:  # missing file, unpacked asset, ...
        log("  avg colour failed for", img.name, e)
        return None


def follow_to_image(sock, depth=0):
    if not sock.is_linked or depth > 6:
        return None
    node = sock.links[0].from_node
    if node.type == "TEX_IMAGE":
        return node
    for inp in node.inputs:
        r = follow_to_image(inp, depth + 1)
        if r:
            return r
    return None


def rebuild_materials():
    """Replace every node tree by a plain Principled BSDF the glTF exporter
    understands. Base colour = diffuse_color (or, for UV-mapped asset textures
    where diffuse_color was never set, the texture's mean colour)."""
    volume_only = set()
    box_scale = {}
    for m in bpy.data.materials:
        if m.node_tree and any(n.type == "TEX_IMAGE" and n.image for n in m.node_tree.nodes):
            outs = [n for n in m.node_tree.nodes if n.type == "OUTPUT_MATERIAL"]
            if any(o.inputs["Surface"].is_linked for o in outs):
                # textured: keep the node tree. Box-projected sets are rewired to UVs
                # (the UVs themselves are generated per mesh in box_project_uvs).
                sc = convert_box_material(m)
                if sc is not None:
                    box_scale[m.name] = sc
                continue
        col = list(m.diffuse_color)
        rough, metal, alpha = m.roughness, m.metallic, col[3]
        em_col, em_str = (0.0, 0.0, 0.0), 0.0
        nt = m.node_tree
        if nt:
            outs = [n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"]
            if outs and any(o.inputs["Volume"].is_linked for o in outs) and not any(
                    o.inputs["Surface"].is_linked for o in outs):
                volume_only.add(m.name)
                continue
            p = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
            e = next((n for n in nt.nodes if n.type == "EMISSION"), None)
            if p:
                rough = p.inputs["Roughness"].default_value
                metal = p.inputs["Metallic"].default_value
                if not p.inputs["Alpha"].is_linked:
                    alpha = min(alpha, p.inputs["Alpha"].default_value)
                es = p.inputs["Emission Strength"].default_value
                if es > 0.0:
                    em_col = tuple(p.inputs["Emission Color"].default_value[:3])
                    em_str = es
                # diffuse_color left at the 0.8 default but a UV (FLAT) texture
                # drives base colour: use the texture's mean colour instead.
                if all(abs(c - 0.8) < 0.01 for c in col[:3]):
                    tex = follow_to_image(p.inputs["Base Color"])
                    if tex and tex.image and getattr(tex, "projection", "FLAT") == "FLAT":
                        avg = average_image_colour(tex.image)
                        if avg:
                            col[:3] = avg
            elif e:
                em_col = tuple(e.inputs["Color"].default_value[:3])
                em_str = e.inputs["Strength"].default_value
                col[:3] = em_col
        else:
            m.use_nodes = True
            nt = m.node_tree
        nt.nodes.clear()
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
        bsdf.inputs["Base Color"].default_value = (col[0], col[1], col[2], 1.0)
        bsdf.inputs["Roughness"].default_value = rough
        bsdf.inputs["Metallic"].default_value = metal
        bsdf.inputs["Alpha"].default_value = alpha
        if em_str > 0.0:
            bsdf.inputs["Emission Color"].default_value = (*em_col, 1.0)
            bsdf.inputs["Emission Strength"].default_value = min(em_str, MAX_EMISSION)
        else:
            bsdf.inputs["Emission Strength"].default_value = 0.0
        if alpha < 0.999:
            for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
                try:
                    setattr(m, attr, val)
                except Exception:
                    pass
    return volume_only, box_scale


def convert_box_material(m):
    """venue.pbr() material: Object coords -> Mapping(scale) -> BOX image textures.
    Rewire to plain UV lookups the glTF exporter understands and return the
    tiling scale (None if the material has no box-projected texture)."""
    nt = m.node_tree
    box = [n for n in nt.nodes if n.type == "TEX_IMAGE" and n.image and n.projection == "BOX"]
    if not box:
        return None
    scale = 1.0
    for n in box:
        sock = n.inputs[0]
        if sock.is_linked and sock.links[0].from_node.type == "MAPPING":
            scale = sock.links[0].from_node.inputs["Scale"].default_value[0]
            break
    for n in box:
        n.projection = "FLAT"
        for l in list(n.inputs[0].links):
            nt.links.remove(l)          # unlinked vector = active UV map
    for n in nt.nodes:
        # tint: Mix(MULTIPLY, fac) -> fold the factor into the tint so fac == 1
        if n.type == "MIX" and n.blend_type == "MULTIPLY" and not n.inputs[0].is_linked:
            fac = n.inputs[0].default_value
            if fac < 0.999:
                b = n.inputs[7].default_value
                n.inputs[7].default_value = tuple(1.0 + (b[i] - 1.0) * fac for i in range(3)) + (1.0,)
                n.inputs[0].default_value = 1.0
        # roughness offset (Math ADD) is not exportable: feed the texture straight in
        if n.type == "BSDF_PRINCIPLED":
            r = n.inputs["Roughness"]
            if r.is_linked and r.links[0].from_node.type == "MATH":
                math_node = r.links[0].from_node
                if math_node.inputs[0].is_linked:
                    src = math_node.inputs[0].links[0].from_socket
                    nt.links.remove(r.links[0])
                    nt.links.new(src, r)
            es = n.inputs["Emission Strength"]
            if not es.is_linked:
                es.default_value = min(es.default_value, MAX_EMISSION)
    return scale


def box_project_uvs(objs, box_scale):
    """Cube-project object-space coordinates into a UV layer for every face that
    uses a (former) box-projected material: uv = the two non-dominant axes * tiling."""
    done = set()
    faces = 0
    for o in objs:
        if o.type != "MESH":
            continue
        me = o.data
        scales = [box_scale.get(s.material.name) if s.material else None for s in o.material_slots]
        if not any(sc is not None for sc in scales) or me.name in done:
            continue
        done.add(me.name)
        uv = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        if uv is None:
            continue
        osx, osy, osz = (abs(v) or 1.0 for v in o.scale)
        verts, loops, data = me.vertices, me.loops, uv.data
        for p in me.polygons:
            sc = scales[p.material_index] if p.material_index < len(scales) else None
            if sc is None:
                continue
            n = p.normal
            ax, ay, az = abs(n.x) / osx, abs(n.y) / osy, abs(n.z) / osz
            for li in p.loop_indices:
                c = verts[loops[li].vertex_index].co
                x, y, z = c.x * osx * sc, c.y * osy * sc, c.z * osz * sc
                if az >= ax and az >= ay:
                    data[li].uv = (x, y)
                elif ax >= ay:
                    data[li].uv = (y, z)
                else:
                    data[li].uv = (x, z)
            faces += 1
    return faces


def unify_uv_names(objs):
    """Joining merges UV layers by name: give every mesh exactly one layer called UVMap."""
    seen = set()
    for o in objs:
        if o.type != "MESH" or o.data.name in seen:
            continue
        seen.add(o.data.name)
        me = o.data
        if not me.uv_layers:
            me.uv_layers.new(name="UVMap")
        else:
            act = me.uv_layers.active or me.uv_layers[0]
            keep = act.name
            for l in [l for l in me.uv_layers if l.name != keep]:
                me.uv_layers.remove(l)
            me.uv_layers[0].name = "UVMap"


def shrink_images(objs):
    """Downscale the textures used by these objects, in memory only."""
    n = 0
    for o in objs:
        for slot in getattr(o, "material_slots", []):
            m = slot.material
            if not m or not m.node_tree:
                continue
            for node in m.node_tree.nodes:
                if node.type != "TEX_IMAGE" or not node.image:
                    continue
                img = node.image
                try:
                    w, h = img.size
                    if w == 0 or h == 0:
                        continue
                    lim = TEX_COLOUR_PX if img.colorspace_settings.name == "sRGB" else TEX_DATA_PX
                    if max(w, h) > lim:
                        k = lim / max(w, h)
                        img.scale(max(1, int(w * k)), max(1, int(h * k)))
                        n += 1
                except Exception as e:
                    log("  could not scale", img.name, e)
    return n


def export_sky(root, out_dir):
    """Small equirect of the render sky for image-based lighting + sun position."""
    src = os.path.join(root, HDRI)
    if not os.path.exists(src):
        log("no HDRI at", src)
        return None
    try:
        import numpy as np
        img = bpy.data.images.load(src, check_existing=False)
        W, H = 1024, 512
        img.scale(W, H)
        px = np.empty(W * H * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = px.reshape(H, W, 4)
        lum = px[:, :, 0] * 0.2126 + px[:, :, 1] * 0.7152 + px[:, :, 2] * 0.0722
        row, colm = np.unravel_index(int(np.argmax(lum)), lum.shape)
        dst = os.path.join(out_dir, "sky.hdr")
        img.file_format = "HDR"
        img.filepath_raw = dst
        img.save()
        bpy.data.images.remove(img)
        log("wrote", dst, "%.2f MB" % (os.path.getsize(dst) / 1e6), "sun uv", colm / W, row / H)
        return dict(file="sky.hdr", sunU=round((colm + 0.5) / W, 4), sunV=round((row + 0.5) / H, 4))
    except Exception as e:
        log("sky export failed:", e)
        return None


# ------------------------------------------------------------------ geometry
def select_only(objs, active=None):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    ok = []
    for o in objs:
        try:
            o.select_set(True)
            ok.append(o)
        except RuntimeError:
            pass
    if ok:
        bpy.context.view_layer.objects.active = active or ok[0]
    return ok


def tri_count(o):
    return sum(len(p.vertices) - 2 for p in o.data.polygons) if o.type == "MESH" else 0


def curves_to_mesh(objs):
    curves = [o for o in objs if o.type in ("CURVE", "FONT", "SURFACE", "META")]
    seen = set()
    for o in curves:
        d = o.data
        if d.name in seen:
            continue
        seen.add(d.name)
        if hasattr(d, "bevel_resolution"):
            d.bevel_resolution = min(d.bevel_resolution, 1)
        if hasattr(d, "resolution_u"):
            d.resolution_u = min(d.resolution_u, 3 if o.type == "FONT" else 6)
            if hasattr(d, "render_resolution_u"):
                d.render_resolution_u = 0
    with_mods = [o for o in objs if o.type == "MESH" and len(o.modifiers)]
    todo = curves + with_mods
    if todo:
        select_only(todo)
        bpy.ops.object.convert(target="MESH")
    return len(curves), len(with_mods)


def decimate_plants(objs):
    plants = [o for o in objs if o.type == "MESH" and o.name.startswith(PLANT_PREFIX)]
    done = {}
    for o in plants:
        src = o.data
        if src.name not in done:
            tris = sum(len(p.vertices) - 2 for p in src.polygons)
            if tris <= PLANT_TRIS * 1.5:
                done[src.name] = src
            else:
                mod = o.modifiers.new("web_decimate", "DECIMATE")
                mod.ratio = PLANT_TRIS / tris
                dg = bpy.context.evaluated_depsgraph_get()
                new = bpy.data.meshes.new_from_object(o.evaluated_get(dg), depsgraph=dg)
                o.modifiers.remove(mod)
                new.name = src.name + "_web"
                done[src.name] = new
                log("  plant mesh", src.name, tris, "->",
                    sum(len(p.vertices) - 2 for p in new.polygons), "tris")
        o.data = done[src.name]
    return len(plants)


def join(objs, name):
    objs = [o for o in objs if o.type == "MESH"]
    if not objs:
        return None
    if len(objs) > 1:
        sel = select_only(objs, objs[0])
        bpy.ops.object.join()
        del sel
    res = bpy.context.view_layer.objects.active if len(objs) > 1 else objs[0]
    res.name = name
    res.data.name = name
    return res


def merge_same_visibility(objs, f0):
    """Objects whose ONLY animation is on/off visibility and that switch at exactly
    the same frames (LED pixels in a chase, rim lights...) are joined into one
    object per timing pattern. Cuts draw calls from hundreds to tens.
    Returns the new object list."""
    has_children = {o.parent.name for o in bpy.data.objects if o.parent}
    groups = {}
    for o in objs:
        info = VIS_INFO.get(o.name)
        if (info and info["pure"] and o.type == "MESH" and o.parent is None
                and o.name not in has_children and not o.constraints):
            groups.setdefault(info["pattern"], []).append(o)
    gone = set()
    merged = 0
    for pattern, members in groups.items():
        if len(members) < 2:
            continue
        j = members[0]
        gone |= {o.name for o in members[1:]}
        for o in members:
            o.animation_data_clear()
            o.scale = VIS_INFO[o.name]["base"]
        # merge geometry with bmesh (no operators: hundreds of bpy.ops joins are very slow)
        from mathutils import Matrix
        sx, sy, sz = j.scale
        inv = (Matrix.LocRotScale(j.location, j.rotation_euler, (sx, sy, sz))).inverted()
        if j.rotation_mode == "QUATERNION":
            inv = (Matrix.LocRotScale(j.location, j.rotation_quaternion, (sx, sy, sz))).inverted()
        bm = bmesh.new()
        mats = []
        for o in members:
            if o.rotation_mode == "QUATERNION":
                mw = Matrix.LocRotScale(o.location, o.rotation_quaternion, o.scale)
            else:
                mw = Matrix.LocRotScale(o.location, o.rotation_euler, o.scale)
            remap = []
            for slot in o.material_slots:
                m = slot.material
                if m not in mats:
                    mats.append(m)
                remap.append(mats.index(m))
            nv, nf = len(bm.verts), len(bm.faces)
            bm.from_mesh(o.data)
            bm.verts.ensure_lookup_table()
            bm.faces.ensure_lookup_table()
            bmesh.ops.transform(bm, matrix=inv @ mw, verts=bm.verts[nv:])
            flip = (inv @ mw).determinant() < 0
            for f in bm.faces[nf:]:
                if remap:
                    f.material_index = remap[min(f.material_index, len(remap) - 1)]
                if flip:
                    f.normal_flip()
        me = bpy.data.meshes.new(j.name + "_merged")
        bm.to_mesh(me)
        bm.free()
        for m in mats:
            me.materials.append(m)
        j.data = me
        for o in members[1:]:
            bpy.data.objects.remove(o, do_unlink=True)
        base = tuple(j.scale)
        prev = None
        for i, hidden in enumerate(pattern):
            if hidden != prev:
                j.scale = (HIDDEN_SCALE,) * 3 if hidden else base
                j.keyframe_insert("scale", frame=f0 + i)
                prev = hidden
        j.scale = base
        cb = channelbag(j)
        if cb:
            for fc in cb.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"
                fc.update()
        merged += 1
    out = []
    for o in objs:
        try:
            if o.name not in gone:
                out.append(o)
        except ReferenceError:
            pass
    return out, merged, len(gone)


def remove(objs):
    for o in list(objs):
        bpy.data.objects.remove(o, do_unlink=True)


def export(path, objs, animated, scene):
    select_only(objs)
    kw = dict(
        filepath=path, export_format="GLB", use_selection=True,
        export_yup=True, export_apply=True,
        export_cameras=False, export_lights=False, export_extras=False,
        export_texcoords=True, export_normals=True, export_tangents=False,
        export_materials="EXPORT", export_image_format="JPEG",   # alpha images stay PNG
        export_image_quality=JPEG_QUALITY, export_jpeg_quality=JPEG_QUALITY,
        export_skins=False, export_morph=False,
        export_animations=animated,
    )
    if animated:
        kw.update(
            export_animation_mode="SCENE",      # one clip, every object baked together
            export_anim_scene_split_object=False,
            export_force_sampling=True, export_frame_step=1,
            export_frame_range=True,            # scene start..end only
            export_optimize_animation_size=False,   # keep per-frame keys: visibility steps stay crisp
            export_bake_animation=False,
            export_anim_slide_to_zero=True,
        )
    props = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
    kw = {k: v for k, v in kw.items() if k in props}
    bpy.ops.export_scene.gltf(**kw)
    log("wrote", path, "%.2f MB" % (os.path.getsize(path) / 1e6))


# ---------------------------------------------------------------------- main
def camera_json(scene, concept, out_dir):
    cam = bpy.data.objects.get("cam_concept")
    tgt = bpy.data.objects.get("cam_target")
    if not cam:
        log("no cam_concept, skipping camera json")
        return
    frames, pos, target = [], [], []
    f0, f1 = scene.frame_start, scene.frame_end
    fl = list(range(f0, f1 + 1, CAMERA_STEP))
    if fl[-1] != f1:
        fl.append(f1)
    for f in fl:
        scene.frame_set(f)
        mw = cam.matrix_world
        p = mw.translation.copy()
        t = tgt.matrix_world.translation.copy() if tgt else p + mw.to_3x3() @ Vector((0, 0, -15))
        frames.append(f)
        pos.append(yup(p))
        target.append(yup(t))
    scene.frame_set(f0)
    d = cam.data
    aspect = scene.render.resolution_x / max(1, scene.render.resolution_y)
    vfov = 2 * math.degrees(math.atan((d.sensor_width / 2) / d.lens / max(aspect, 1e-6)))
    data = dict(concept=concept, fps=scene.render.fps / scene.render.fps_base,
                frameStart=f0, frameEnd=f1,
                duration=(f1 - f0) / (scene.render.fps / scene.render.fps_base),
                fov=round(vfov, 2), frames=frames, position=pos, target=target)
    path = os.path.join(out_dir, concept + ".json")
    with open(path, "w") as fh:
        json.dump(data, fh)
    log("wrote", path)


def venue_json(scene, venue_objs, out_dir, sky=None):
    cams = {}
    focus = Vector((0.0, 3.0, 2.5))
    for o in venue_objs:
        if o.type == "CAMERA" and o.name != "cam_concept":
            mw = o.matrix_world
            p = mw.translation.copy()
            fwd = (mw.to_3x3() @ Vector((0, 0, -1))).normalized()
            dist = max(4.0, (focus - p).dot(fwd))
            cams[o.name] = dict(position=yup(p), target=yup(p + fwd * dist))
    trees = []
    for o in venue_objs:
        if o.type == "MESH" and o.name.startswith(TREE_PREFIX):
            pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
            mn = Vector((min(p[i] for p in pts) for i in range(3)))
            mx = Vector((max(p[i] for p in pts) for i in range(3)))
            c = (mn + mx) / 2
            trees.append(dict(base=yup(Vector((c.x, c.y, mn.z))), height=round(mx.z - mn.z, 3),
                              radius=round(max(mx.x - mn.x, mx.y - mn.y) / 2, 3)))
    path = os.path.join(out_dir, "venue.json")
    with open(path, "w") as fh:
        json.dump(dict(cameras=cams, trees=trees, sky=sky), fh)
    log("wrote", path, len(cams), "cameras", len(trees), "trees")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--concept", required=True)
    ap.add_argument("--venue", action="store_true")
    ap.add_argument("--out", default=None)
    ap.add_argument("--stamp", default=None, help="file to touch when the export finished without error")
    args = ap.parse_args(argv)

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = args.out or os.path.join(root, "public", "review")
    os.makedirs(out_dir, exist_ok=True)

    scene = bpy.context.scene
    f0, f1 = scene.frame_start, scene.frame_end
    col = bpy.data.collections.get("concept_" + args.concept)
    if col is None:
        raise SystemExit("collection concept_%s not found in %s" % (args.concept, bpy.data.filepath))

    concept_objs = list(col.all_objects)
    cset = set(concept_objs)
    venue_objs = [o for o in scene.objects if o not in cset]

    camera_json(scene, args.concept, out_dir)
    if args.venue:
        venue_json(scene, venue_objs, out_dir, export_sky(root, out_dir))

    volume_mats, box_scale = rebuild_materials()
    log("box-projected texture materials -> UV:", sorted(box_scale))
    log("materials rebuilt; volume-only:", sorted(volume_mats))

    def unwanted(o):
        if o.name.startswith(SKIP_PREFIXES):
            return True
        if o.type in ("LIGHT", "CAMERA", "VOLUME", "SPEAKER", "LIGHT_PROBE"):
            return True
        if o.type in GEOM_TYPES and hasattr(o.data, "materials") and len(o.data.materials) and all(
                m is not None and m.name in volume_mats for m in o.data.materials):
            return True
        return False

    # ---- concept ---------------------------------------------------------
    drop = [o for o in concept_objs if unwanted(o)]
    concept_objs = [o for o in concept_objs if o not in set(drop)]
    log("concept: dropping", len(drop), "objects (volumes/lights)")
    remove(drop)

    baked = sum(1 for o in concept_objs if bake_visibility_to_scale(o, f0, f1))
    log("concept: visibility -> scale on", baked, "objects")
    # statically hidden, never shown: not part of the look
    static_hidden = [o for o in concept_objs if o.hide_render and not is_animated(o)]
    concept_objs = [o for o in concept_objs if o not in set(static_hidden)]
    remove(static_hidden)

    if not args.venue:
        remove(venue_objs)
        venue_objs = []
    else:
        vdrop = [o for o in venue_objs
                 if unwanted(o) or o.name.startswith(TREE_PREFIX)
                 or (o.type == "EMPTY") or (o.hide_render and o.type in GEOM_TYPES)]
        venue_objs = [o for o in venue_objs if o not in set(vdrop)]
        log("venue: dropping", len(vdrop), "objects (trees/cameras/lights/hidden)")
        remove(vdrop)

    for o in concept_objs + venue_objs:
        o.hide_viewport = False
        o.hide_render = False
        o.hide_select = False
        try:
            o.hide_set(False)
        except RuntimeError:
            pass
    scene.frame_set(f0)

    log("concept: converted curves/modifiers", curves_to_mesh(concept_objs))
    log("concept: box-UV faces", box_project_uvs(concept_objs, box_scale),
        "images scaled", shrink_images(concept_objs))
    unify_uv_names(concept_objs)
    names = [o.name for o in concept_objs]
    n_before = len(names)
    safe = [bpy.data.objects[n] for n in names if n in bpy.data.objects]
    concept_objs, n_groups, n_gone = merge_same_visibility(safe, f0)
    log("concept: same-timing visibility groups merged: %d groups absorbed %d of %d objects" % (
        n_groups, n_gone, n_before))
    has_children = {o.parent for o in bpy.data.objects if o.parent}
    static = [o for o in concept_objs
              if o.type == "MESH" and not is_animated(o) and o.parent is None
              and o not in has_children and not o.constraints]
    static_names = {o.name for o in static}
    rest = [o for o in concept_objs if o.name not in static_names]
    joined = join(static, args.concept + "_static")
    final = rest + ([joined] if joined else [])
    log("concept: %d static objects joined, %d separate (animated/parented), %d tris" % (
        len(static_names), len(rest), sum(tri_count(o) for o in final)))
    export(os.path.join(out_dir, args.concept + ".glb"), final, True, scene)

    # ---- venue -----------------------------------------------------------
    if args.venue:
        log("venue: converted curves/modifiers", curves_to_mesh(venue_objs))
        log("venue: plants decimated:", decimate_plants(venue_objs))
        log("venue: box-UV faces", box_project_uvs(venue_objs, box_scale),
            "images scaled", shrink_images(venue_objs))
        unify_uv_names(venue_objs)
        meshes = [o for o in venue_objs if o.type == "MESH"]
        v = join(meshes, "venue")
        log("venue: joined %d objects, %d tris, %d materials" % (
            len(meshes), tri_count(v), len(v.data.materials)))
        export(os.path.join(out_dir, "venue.glb"), [v], False, scene)

    if args.stamp:
        open(args.stamp, "w").write("ok")
    log("done (nothing saved to the .blend)")


if __name__ == "__main__":
    main()
