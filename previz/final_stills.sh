#!/bin/zsh
# After the film pipeline: one final-quality (path-traced) hero still per concept, copied into the review page.
# usage: nohup previz/final_stills.sh [concepts...] > previz/out/final_stills_log.txt 2>&1 &
cd "$(dirname "$0")/.."
while ! grep -q PIPELINE_DONE previz/out/final_log.txt 2>/dev/null; do sleep 15; done
mkdir -p public/review/stills
for c in ${@:-pulse revolve cargo unseen ignition stageproduct}; do
  blender -b -P previz/concepts.py -- --concept $c --nosave --final 235 --samples 72 --out /Volumes/KINGSTON/launch-previz/finals 2>&1 | grep -E "FINAL|Error|line [0-9]+, in [a-z_]+$" | grep -v unregister
  src=/Volumes/KINGSTON/launch-previz/finals/$c/final_235.png
  [ -f "$src" ] && sips -s format jpeg -s formatOptions 88 "$src" --out public/review/stills/${c}_final.jpg >/dev/null 2>&1 && mkdir -p client-share/final-stills && cp public/review/stills/${c}_final.jpg "client-share/final-stills/$c.jpg" && echo "STILL $c done $(date +%H:%M)"
done
echo "STILLS_DONE $(date +%H:%M)"
