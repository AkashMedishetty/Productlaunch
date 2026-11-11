#!/bin/zsh
# Render every concept: stills or animation + mp4.  usage: previz/render_all.sh stills|anim [w h]
cd "$(dirname "$0")/.."
MODE=${1:-stills}; W=${2:-1280}; H=${3:-720}
for c in ${=CONCEPTS:-pulse ignition cargo revolve unseen stageproduct}; do
  blender -b -P previz/concepts.py -- --concept $c --$MODE --w $W --h $H 2>&1 | grep -E "BUILT|STILL|ANIM|Traceback|Error|line [0-9]+, in [a-z_]+$" | grep -v unregister
  if [ "$MODE" = anim ]; then
    ffmpeg -y -loglevel error -framerate 24 -i previz/out/$c/frames/f_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart previz/out/$c/$c.mp4 && echo "MP4 $c done"
  fi
done
echo ALL_DONE
