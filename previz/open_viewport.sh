#!/bin/zsh
# Open a concept in the Blender viewport (no rendering). usage: previz/open_viewport.sh pulse
D="$(cd "$(dirname "$0")" && pwd)"
open -na Blender --args "$D/out/${1:-pulse}/${1:-pulse}.blend" --python "$D/viewport.py"
