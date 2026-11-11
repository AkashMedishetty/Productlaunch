#!/bin/zsh
# Unattended final pass: render all six films (two at a time), export the web models, rebuild the review page.
# usage: nohup previz/final_pipeline.sh > previz/out/final_log.txt 2>&1 &
cd "$(dirname "$0")/.."
render() {
  c=$1
  F=previz/out/$c/frames
  [ -d /Volumes/KINGSTON/launch-previz ] && F=/Volumes/KINGSTON/launch-previz/frames/$c   # big temp files go to the external drive
  rm -rf "$F"
  blender -b -P previz/concepts.py -- --concept $c --anim --w 1280 --h 720 --frames-dir "$F" 2>&1 | grep -E "BUILT|ANIM|Error|line [0-9]+, in [a-z_]+$" | grep -v unregister
  ffmpeg -y -loglevel error -framerate 24 -i "$F"/f_%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart previz/out/$c/$c.mp4 && echo "MP4 $c done $(date +%H:%M)" && rm -rf "$F"
}
for pair in "pulse revolve" "unseen cargo" "ignition stageproduct"; do
  for c in ${=pair}; do render $c & done
  wait
done
# stills pulled from each film: the cue, the reveal, the hero frame
mkdir -p public/review/stills
for c in pulse ignition cargo revolve unseen stageproduct; do
  for pair in "cue 1.6" "signal 2.7" "reveal 6.6" "hero 9.7"; do
    set -- ${=pair}
    ffmpeg -y -loglevel error -ss $2 -i previz/out/$c/$c.mp4 -frames:v 1 -q:v 3 public/review/stills/${c}_$1.jpg
  done
done
bash previz/export_all.sh && echo "EXPORT done $(date +%H:%M)"
# keep the venue name out of anything that gets published
LC_ALL=C sed -i '' -e 's/the venue/the venue/g' -e 's/VENUE-1\.pdf/the layout draft/g' -e 's/VENUE/VENUE/g' -e 's/bldg_/bldg_/g' previz/*.py previz/*.md previz/*.sh src/review/* 2>/dev/null
if npm run build > previz/out/build_log.txt 2>&1; then echo "WEB BUILD done $(date +%H:%M)"; else echo "WEB BUILD FAILED - see previz/out/build_log.txt"; fi
# publish: commit on this branch and fast-forward the hosted main branch (the user asked for this)
git add -A
git commit -q -m "Outdoor previz: six reveal concepts, films and 3D review page

Venue built from the layout draft, six concepts rebuilt from the written specs for two products,
preview films, and a browser review page with the 3D venue, playable reveals and details.

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>" && echo "COMMIT done"
git push -q origin outdoor-blender-previz 2>&1 | tail -2
git push -q origin outdoor-blender-previz:main 2>&1 | tail -2 && echo "PUSHED to main $(date +%H:%M)"
URL=https://productlaunch-beta.vercel.app/review.html
ok=0
for i in $(seq 1 40); do
  sleep 20
  if curl -s "$URL" | grep -q "src/review\|review-\|Review"; then
    code=$(curl -s -o /dev/null -w "%{http_code}" https://productlaunch-beta.vercel.app/review/venue.glb)
    [ "$code" = 200 ] && ok=1 && break
  fi
done
if [ $ok = 1 ]; then echo "LIVE $URL $(date +%H:%M)"; else
  echo "Not live via git after 13 min; trying the Vercel CLI"
  (vercel link --yes --project productlaunch 2>&1 | tail -1; vercel deploy --prod --yes 2>&1 | tail -3)
fi
if [ -d /Volumes/KINGSTON/launch-previz ]; then
  mkdir -p /Volumes/KINGSTON/launch-previz/films && cp -f previz/out/*/*.mp4 /Volumes/KINGSTON/launch-previz/films/ 2>/dev/null
  rm -rf /Volumes/KINGSTON/launch-previz/web && cp -R dist /Volumes/KINGSTON/launch-previz/web 2>/dev/null
  cp -R public/review/stills /Volumes/KINGSTON/launch-previz/ 2>/dev/null; cp DELIVERABLES.md /Volumes/KINGSTON/launch-previz/ 2>/dev/null; echo "BACKUP done"
fi
echo "PIPELINE_DONE $(date +%H:%M)"
