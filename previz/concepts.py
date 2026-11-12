"""Entry point: build one concept on the shared venue and optionally render it.

Run:  blender -b -P previz/concepts.py -- --concept pulse [--stills] [--frames 20,37,62] [--anim] [--w 1280 --h 720] [--out DIR]
Concepts: pulse, ignition, cargo, revolve, unseen, stageproduct  (each in previz/c_<name>.py; helpers in previz/cl.py)
"""
import bpy, sys, os, time, importlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import venue as V
import cl


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []

    def arg(k, d=None):
        return argv[argv.index(k) + 1] if k in argv else d

    name = arg("--concept", "pulse")
    # at most two builds at a time on this 16 GB laptop: wait for one of two lock files
    import fcntl
    lock = None
    while lock is None:
        for i in (0, 1, 2):
            fh = open(f"/tmp/claude-501/previz_lock_{i}", "w")
            try:
                fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
                lock = fh
                break
            except OSError:
                fh.close()
        if lock is None:
            time.sleep(3)
    out = os.path.join(arg("--out", os.path.join(HERE, "out")), name)
    os.makedirs(out, exist_ok=True)
    t0 = time.time()
    mats, cams = V.build_all()
    cl.m_.clear()
    cl.m_.update(mats)
    sc = bpy.context.scene
    for o in list(bpy.data.objects):
        if o.name.startswith("launch_plinth"):
            bpy.data.objects.remove(o, do_unlink=True)
    mod = importlib.import_module(f"c_{name}")
    cc = cl.collection(f"concept_{name}")
    mod.build(cc)
    if not getattr(mod, "OWN_GUEST", False):
        cl.guest(cc)
    cl.camera(getattr(mod, "SHOTS", None))
    sc.frame_start, sc.frame_end = 1, cl.END
    sc.render.fps = cl.FPS
    V.setup_render(sc, int(arg("--w", 1280)), int(arg("--h", 720)), "EEVEE", int(arg("--samples", 16)))
    if hasattr(sc.eevee, "volumetric_end"):
        sc.eevee.volumetric_end = 90
    sc.frame_set(1)
    print(f"BUILT {name} in {time.time() - t0:.1f}s, {len(bpy.data.objects)} objects")
    bpy.context.preferences.filepaths.save_version = 0      # no .blend1 backups: disk is tight
    if "--nosave" not in argv and os.path.abspath(out).startswith(os.path.join(HERE, "out")):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, f"{name}.blend"))
    if "--stills" in argv:
        frames = [int(f) for f in arg("--frames", "20,37,62,100,150,235").split(",")]
        for f in frames:
            sc.frame_set(f)
            sc.render.filepath = os.path.join(out, f"still_{f:03d}.png")
            bpy.ops.render.render(write_still=True)
        print(f"STILLS {name} done")
    if "--final" in argv:      # final-quality path-traced stills, e.g. --cycles 150,235
        V.setup_render(sc, int(arg("--w", 1920)), int(arg("--h", 1080)), "CYCLES", int(arg("--samples", 96)))
        sc.cycles.volume_bounces = 1
        sc.view_settings.exposure = float(arg("--exposure", -0.35))
        for f in [int(x) for x in arg("--final").split(",")]:
            sc.frame_set(f)
            sc.render.filepath = os.path.join(out, f"final_{f:03d}.png")
            t = time.time()
            bpy.ops.render.render(write_still=True)
            print(f"FINAL {name} f{f} in {time.time() - t:.0f}s")
    if "--anim" in argv:
        sc.render.image_settings.file_format = "JPEG"
        sc.render.image_settings.quality = 92
        sc.render.filepath = os.path.join(arg("--frames-dir", os.path.join(out, "frames")), "f_")
        t = time.time()
        bpy.ops.render.render(animation=True)
        print(f"ANIM {name} {cl.END} frames in {time.time() - t:.1f}s")


if __name__ == "__main__":
    main()
