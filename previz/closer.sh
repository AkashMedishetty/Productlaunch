#!/bin/zsh
# Runs unattended after the film pipeline: waits for the final-quality stills (or 06:25), re-renders
# Stage Is The Product if its file changed after its film was made, then republishes.
cd "$(dirname "$0")/.."
while ! grep -q PIPELINE_DONE previz/out/final_log.txt 2>/dev/null; do sleep 20; done
# stageproduct was being polished while the queue ran: re-render it once if the source is newer than the film
if [ previz/c_stageproduct.py -nt previz/out/stageproduct/stageproduct.mp4 ]; then
  sleep 240   # give the polish worker time to finish its edits
  F=/Volumes/KINGSTON/launch-previz/frames/stageproduct; [ -d /Volumes/KINGSTON/launch-previz ] || F=previz/out/stageproduct/frames
  rm -rf "$F"
  if blender -b -P previz/concepts.py -- --concept stageproduct --anim --w 1280 --h 720 --frames-dir "$F" 2>&1 | grep -q "ANIM stageproduct"; then
    ffmpeg -y -loglevel error -framerate 24 -i "$F"/f_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart previz/out/stageproduct/stageproduct.mp4 && echo "RE-RENDERED stageproduct $(date +%H:%M)"
    for pair in "cue 1.6" "signal 2.7" "reveal 6.6" "hero 9.7"; do set -- ${=pair}; ffmpeg -y -loglevel error -ss $2 -i previz/out/stageproduct/stageproduct.mp4 -frames:v 1 -q:v 3 public/review/stills/stageproduct_$1.jpg; done
    NO_VENUE=1 bash previz/export_all.sh stageproduct > /dev/null 2>&1
    rm -rf "$F"
  else echo "stageproduct re-render FAILED; keeping the earlier film"; fi
fi
for i in $(seq 1 120); do grep -q STILLS_DONE previz/out/final_stills_log.txt 2>/dev/null && break; [ $(date +%H%M) -ge 0625 ] && break; sleep 20; done
LC_ALL=C sed -i '' -e 's/the venue/the venue/g' -e 's/VENUE/VENUE/g' previz/*.py previz/*.md src/review/* 2>/dev/null
if npm run build > previz/out/build_log2.txt 2>&1; then
  git add -A && git commit -q -m "Previz: final-quality stills, Stage Is The Product polish, review page updates

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>" && git push -q origin outdoor-blender-previz 2>&1 | tail -1; git push -q origin outdoor-blender-previz:main 2>&1 | tail -1; echo "SECOND PUSH done $(date +%H:%M)"
else echo "build failed, nothing pushed - see previz/out/build_log2.txt"; fi
[ -d /Volumes/KINGSTON/launch-previz ] && cp -f previz/out/*/*.mp4 /Volumes/KINGSTON/launch-previz/films/ 2>/dev/null && cp -R public/review/stills /Volumes/KINGSTON/launch-previz/ 2>/dev/null
echo "CLOSER_DONE $(date +%H:%M)"
