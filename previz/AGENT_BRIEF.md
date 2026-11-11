# Brief for concept workers (read fully before touching anything)

You own ONE reveal concept for a client pitch at 10:00 today. Hard stop for your work: **35 minutes** from when you start.
The client-facing user has rejected earlier passes as "tacky" and built-from-guesswork. Your job is to make your one
concept correct to its spec, clear to read, and good-looking, and to PROVE it by looking at rendered frames yourself,
repeatedly. Never report something works unless you looked at the frame that shows it.

## The show
Outdoor, daytime, the venue plaza. Stage deck 56 ft wide x 20 ft deep, 3 ft high; 56 x 20 ft LED wall upstage on a 2.5 ft
raiser (plain black until its cue; NEVER any text on it). Side truss banners left and right. Seated audience in front,
centre aisle. Two products on white plinths: 5 x 5 ft footprint at x=-10.5 and 7 x 7 ft at x=+9.5, both at y=-11
(placeholder silver forms; heights assumed 5 ft and 6 ft; plinth 1.2 ft).

## Coordinates and timeline
Plan feet: x right (audience view), y toward the audience (stage front edge is y=0, upstage is negative, LED wall
face at about y=-20.5), z up from the ground. `P(x, y, z)` converts to Blender metres. Deck top is `DECK_H` (3 ft).
24 fps, 240 frames (10 s): guest cue `F_TOUCH`=36 · signal travels 40-84 · LED wall wakes `F_WAKE`=84 to
`F_RETURN`=120 · signal returns to the products 120-136 · reveal starts `F_REVEAL`=138 · effects about 175-180 ·
hero hold to 240. You may shift beats inside your concept if it reads better, but the LED wall must stay black
until at least frame 84 and the reveal must be clearly complete before the effects fire.

## Files
- `previz/c_<name>.py` — YOURS. `build(c)` creates the concept in collection `c`. Optional module globals:
  `SHOTS = [(frame, (cam x,y,z), (target x,y,z)), ...]` to define the camera move (plan feet);
  `OWN_GUEST = True` if you create the guest yourself instead of the default `cl.guest`.
- `previz/cl.py` — shared helpers (`key`, `show_from`, `hide_from`, `empty`, `parent`, `origin_to`, `emissive`,
  `lit_path`, `pulse_head`, `fascia_run`, `lit_fin`, `console`, `led_wake`, `product_light`, `finale`, `fog_floor`,
  `guest`, `camera`, `products`, `arc_shell`, constants). READ it. DO NOT EDIT it, nor `venue.py`, `fx.py`,
  `hero.py`, `concepts.py`, `export_glb.py` — five other workers depend on them. If a helper is not right for you,
  copy it into your own file under a new name and change the copy.
- `src/data/concepts.ts` — the written spec for your concept (find `id: '<name>'`). READ IT FIRST. Fields:
  audience, stageDesign, concealment, guest, sequence, mitigation. Deliberate deviations already agreed: two
  products not three; daylight not a dark room; no text on the LED wall.
- Do not write into `previz/out/`. Use your own output folder: `/tmp/claude-501/agent_<name>/`.

## How to check your work (do this at least 4 times)
```
cd /Users/akash/Documents/Qoder/2026-11-10/a47ca9bb
blender -b -P previz/concepts.py -- --concept <name> --stills --frames 10,37,62,84,110,138,150,165,185,235 \
  --w 960 --h 540 --out /tmp/claude-501/agent_<name> 2>&1 | grep -E "BUILT|STILLS|Error|line [0-9]+, in"
```
(A harmless `ValueError: list.remove(x)` traceback at Blender exit is normal.) Then tile the stills with ffmpeg into
one contact sheet and READ the image. Judge: is the product hidden before the reveal from this camera AND would it be
from a side seat; does the guest visibly do the cue; can you SEE the signal travel; does the mechanism read mid-motion;
is the product clear and well lit in the hero frame; is anything clipping, floating, mirrored, blown out or too dark;
does the camera show the action. Fix and repeat. Renders share one laptop GPU with five other workers: keep to
960x540 stills, never render the full animation, never use Cycles.

## Standards for every concept
- **Camera** (the user said the camera motion was "nothing"): design a real move in `SHOTS` — open on the guest and
  console, follow the signal across the deck, arrive at a centred audience view of the WHOLE stage for the reveal,
  then a slow push toward the products for the hero hold. Smooth, no whip moves, never passing through objects.
  The web viewer replays this same path, so it must look intentional.
- **Signal**: the cue must visibly travel from the console to the stage and the products (`lit_path`,
  `pulse_head`, `fascia_run`), not just lights switching on.
- **Guest**: walks in, performs the cue at frame 36, moves clear of all moving scenery, stays out of the hero frame's
  centre. No teleporting.
- **Hero frame (235)**: both products fully visible, readable against the background, not buried in confetti/sparks,
  nothing in front of them. Keep effects tasteful (`finale` already has reduced confetti upstage and sparks at the
  upstage corners; you may tune by copying it).
- **Buildable**: everything must be something a crew could build outdoors on this deck (wind, clearances, guest
  safety). No magic. If the spec's primary mechanism cannot work here, use the spec's own mitigation and say so.
- Real-feeling materials via `m_[...]` / `V.pbr` / `mat`; no flat emissive-everything; nothing that reads as stacked
  boxes or clip art.

## Report back (short)
1. What the concept now shows, beat by beat. 2. What you changed. 3. Exactly which frames you looked at in your last
round and what you saw. 4. Anything still wrong or unverified. 5. One-line real-world build note for the client.
