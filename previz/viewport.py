"""Open a previz .blend in the Blender window in Material Preview, looking through the audience camera.
Usage: blender <file.blend> --python previz/viewport.py"""
import bpy

def setup():
    sc = bpy.context.scene
    cam = bpy.data.objects.get("cam_seat") or bpy.data.objects.get("cam_concept") or bpy.data.objects.get("cam_front_wide")
    if cam:
        sc.camera = cam
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == "VIEW_3D":
                sp = area.spaces.active
                sp.shading.type = "MATERIAL"
                sp.shading.use_scene_world = True
                sp.shading.use_scene_lights = True
                sp.overlay.show_overlays = False
                sp.clip_end = 800
                sp.region_3d.view_perspective = "CAMERA"
    return None

bpy.app.timers.register(setup, first_interval=1.0)
