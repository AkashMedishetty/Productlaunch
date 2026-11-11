# Previz notes — read before touching previz/concepts.py

## User feedback on the first Pulse film (2026-11-12 00:40) — MUST FIX in all six concepts
1. **The signal is not visible.** The floor LED path is a thin strip on a 3 ft deck seen from a seated
   eye height of ~4.5 ft, so it is almost edge-on and reads as nothing. It also just "switches on".
   Fix: make it a travelling pulse (a bright head with a fading tail that moves console -> stage ->
   LED wall -> back to each product), wide enough to read (>= 0.6 ft), and show it from a camera
   that can see the deck: open on a raised 3/4 shot near the console, follow the pulse across the
   deck, then settle into the audience-seat view for the reveal.
   Real-world note to tell the client: from the seats a floor-only path is hard to see, so the
   path should also run along the stage front fascia and up a vertical fin.
2. **There is no person.** The cue is a chief guest walking to the console and placing a palm on
   it (or turning the handle / seating the core). Every concept must show a figure walking in,
   performing the action at frame ~36, and stepping back. Use a proper rigged human asset if one
   can be sourced legitimately (ask the user; do not create accounts); otherwise a clean neutral
   previz mannequin, and say plainly that it is a mannequin.
3. The LED wall "awake" state had two flat white rectangles behind the products. Changed to a dim
   blue glow in code; verify on a rendered frame.

## Process rules the user has insisted on
- Read the concept's written spec in src/data/concepts.ts before building or changing it.
- Look at the rendered frames yourself before telling the user anything works.
- Viewport first, renders after the user has seen it.
- LED wall: plain black, no text, until its cue.
- Two products: 5 x 5 ft and 7 x 7 ft footprints.
- Side platforms need "details" on them — ask the user which platforms and what content.
