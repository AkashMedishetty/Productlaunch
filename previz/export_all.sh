#!/bin/bash
# Re-export every concept + the shared venue to public/review/ for the browser
# review page, and copy films, stills and extra-concept specs next to them.
# Safe to re-run after the .blend files are regenerated. No rendering; nothing
# is saved to the .blend.
#   bash previz/export_all.sh              # six core concepts + extras + venue
#   bash previz/export_all.sh pulse        # just one (venue is exported with the first)
#   NO_VENUE=1 bash previz/export_all.sh cargo   # one concept, keep the existing venue.glb
# Extras: every previz/specs/<id>.json whose previz/out/<id>/<id>.blend exists is
# exported too, its spec copied to public/review/specs/, and listed in extra.json.
set -uo pipefail
cd "$(dirname "$0")/.."
BLENDER="${BLENDER:-/opt/homebrew/bin/blender}"
OUT=public/review
CORE=(pulse ignition cargo revolve unseen stageproduct)
is_core() { local x; for x in "${CORE[@]}"; do [ "$x" = "$1" ] && return 0; done; return 1; }

# extras that are ready (spec + blend)
EXTRAS=()
for spec in previz/specs/*.json; do
  [ -f "$spec" ] || continue
  id="$(basename "$spec" .json)"
  is_core "$id" && continue
  [ -f "previz/out/$id/$id.blend" ] && EXTRAS+=("$id")
done

CONCEPTS=("$@")
if [ ${#CONCEPTS[@]} -eq 0 ]; then
  CONCEPTS=("${CORE[@]}")
  [ ${#EXTRAS[@]} -gt 0 ] && CONCEPTS+=("${EXTRAS[@]}")
fi
mkdir -p "$OUT/media" "$OUT/stills" "$OUT/specs"

jpg() { # src dst maxpx : convert when the source exists and is newer than dst
  [ -f "$1" ] || return 0
  [ -f "$2" ] && [ ! "$1" -nt "$2" ] && return 0
  sips -s format jpeg -s formatOptions 80 -Z "$3" "$1" --out "$2" >/dev/null 2>&1 || true
}

first=1; fail=0
for c in "${CONCEPTS[@]}"; do
  blend="previz/out/$c/$c.blend"
  if [ ! -f "$blend" ]; then echo "MISSING $blend"; fail=1; continue; fi
  flags=(--concept "$c"); [ $first -eq 1 ] && [ -z "${NO_VENUE:-}" ] && flags+=(--venue)
  ok=0
  for attempt in 1 2; do   # a blend may be mid-write by the render pipeline: retry once
    rm -f "$OUT/.ok_$c"
    "$BLENDER" -b "$blend" -P previz/export_glb.py -- "${flags[@]}" --stamp "$OUT/.ok_$c" 2>&1 \
      | grep -E "^\[export_glb|Error|SystemExit" | grep -v "^Traceback"
    if [ -f "$OUT/.ok_$c" ]; then ok=1; rm -f "$OUT/.ok_$c"; break; fi
    echo "export of $c did not finish (attempt $attempt)"; sleep 5
  done
  if [ $ok -eq 1 ]; then first=0; else echo "FAILED $c"; fail=1; fi
done

# films, stills and specs for everything that has a GLB
ALL=("${CORE[@]}"); [ ${#EXTRAS[@]} -gt 0 ] && ALL+=("${EXTRAS[@]}")
for c in "${ALL[@]}"; do
  d="previz/out/$c"
  [ -f "$d/$c.mp4" ] && { [ ! -f "$OUT/media/$c.mp4" ] || [ "$d/$c.mp4" -nt "$OUT/media/$c.mp4" ]; } && cp -f "$d/$c.mp4" "$OUT/media/$c.mp4"
  jpg "$d/still_030.png" "$OUT/stills/${c}_cue.jpg" 1280
  jpg "$d/still_100.png" "$OUT/stills/${c}_signal.jpg" 1280
  jpg "$d/still_150.png" "$OUT/stills/${c}_reveal.jpg" 1280
  jpg "$d/still_235.png" "$OUT/stills/${c}_hero.jpg" 1280
  jpg "previz/out/hero/${c}_seat.png" "$OUT/stills/${c}_final.jpg" 1920
done

# extra.json: extras that actually have a GLB, in spec order
json="["; sep=""
if [ ${#EXTRAS[@]} -gt 0 ]; then
  for id in "${EXTRAS[@]}"; do
    if [ -f "$OUT/$id.glb" ]; then
      cp -f "previz/specs/$id.json" "$OUT/specs/$id.json"
      json="$json$sep\"$id\""; sep=","
    fi
  done
fi
echo "$json]" > "$OUT/extra.json"
echo "extra.json: $(cat "$OUT/extra.json")"

ls -la "$OUT" "$OUT/media" | grep -vE "^total|^d"
exit $fail
