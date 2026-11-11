#!/bin/zsh
# Unattended: films, stills and web export for the new concepts whose source and spec both exist.
cd "$(dirname "$0")/.."
while ! grep -q PIPELINE_DONE previz/out/final_log.txt 2>/dev/null; do sleep 20; done
for c in sunwall smokescreen; do
  for i in $(seq 1 30); do [ -f previz/c_$c.py ] && [ -f previz/specs/$c.json ] && break; sleep 30; done
  [ -f previz/c_$c.py ] && [ -f previz/specs/$c.json ] || { echo "$c not ready, skipped"; continue; }
  F=/Volumes/KINGSTON/launch-previz/frames/$c; [ -d /Volumes/KINGSTON/launch-previz ] || F=previz/out/$c/frames
  rm -rf "$F"
  if blender -b -P previz/concepts.py -- --concept $c --anim --w 1280 --h 720 --frames-dir "$F" 2>&1 | grep -q "ANIM $c"; then
    ffmpeg -y -loglevel error -framerate 24 -i "$F"/f_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart previz/out/$c/$c.mp4 && echo "MP4 $c done $(date +%H:%M)"
    for pair in "cue 1.6" "signal 2.9" "reveal 6.6" "hero 9.7"; do set -- ${=pair}; ffmpeg -y -loglevel error -ss $2 -i previz/out/$c/$c.mp4 -frames:v 1 -q:v 3 public/review/stills/${c}_$1.jpg; done
    rm -rf "$F"
    NO_VENUE=1 bash previz/export_all.sh > /dev/null 2>&1; echo "export for $c attempted"
  else echo "$c render FAILED"; fi
done
echo "EXTRAS_DONE $(date +%H:%M)"
