# Product launch previz — deliverables

Outdoor daytime launch. Stage 56 × 24 ft (20 ft clear deck, 3 ft high — height assumed), 56 × 20 ft LED wall,
two products on 5 × 5 ft and 7 × 7 ft footprints. Six reveal concepts, each shown from the chief guest's cue to the
hero moment.

## Where everything is

| Deliverable | Location |
| --- | --- |
| 3D review page (orbit the venue, play each reveal, film camera or free orbit, details per concept) | https://productlaunch-beta.vercel.app/review.html — locally `npm run dev`, then `/review.html` |
| Original pitch deck (16 concepts, written specs) | https://productlaunch-beta.vercel.app/ |
| Six preview films, 10 s each, 1280 × 720 | `public/review/media/<concept>.mp4` (also `previz/out/<concept>/`) |
| Four stills per concept: cue, signal, reveal, hero | `public/review/stills/<concept>_{cue,signal,reveal,hero}.jpg` |
| Final-quality (path-traced) reference still, earlier Ignition version | `public/review/media/ignition_hero.jpg` |
| Blender scenes, one per concept | `previz/out/<concept>/<concept>.blend` (open with `previz/open_viewport.sh <concept>`) |
| Source that builds every scene | `previz/venue.py`, `previz/cl.py`, `previz/c_<concept>.py`, `previz/fx.py` |
| Backup copy of films, stills and the built web page | external drive, folder `launch-previz` |

Deep link a concept on the review page with `?concept=pulse` (or `ignition`, `cargo`, `revolve`, `unseen`,
`stageproduct`).

## The six concepts

| Concept | What the audience sees | How it is built |
| --- | --- | --- |
| **The Pulse** | Guest places a palm on a console. A chase of light pixels runs across the deck and along the stage front to each product. On the same cue the LED wall starts its sequence and the silk drapes drop. | Capacitive console triggers show control; addressable pixel tape in a walk-over channel and on the fascia; solenoid-release silk drapes with weighted hems on ballasted halo rings. Drape release needs its own operator and a wind limit. |
| **The Ignition** | Guest touches a glowing amber cube. Light runs across the floor and up into the LED wall, fog builds round two covered forms, and the covers sink away to uncover the products from the top down. | Six-section telescoping sleeves lowered on internal lifting columns into a plinth-height collar, roller lid, fog units at the base. Replaces the spec's lift, which a 3 ft deck cannot hide. |
| **The Cargo Vault** | Two sealed steel vaults. Guest turns a release handle; the signal reaches each vault and its lock lights step from amber to white; fog spills out; the doors swing open with the product lit inside. | Steel-framed, ply-skinned vaults ballasted to the deck; two actuator-driven doors per vault opening 105° to hard stops; fixed back, sides and roof light box. Door swing zones kept clear. |
| **The Revolve** | Each product stands on its own revolving stage inside a semicircular LED wall, no roof. The dark backs face the audience; on the cue both turn 180° and the products arrive inside their lit LED curves. | Two ring-drive revolves (about 12 ft and 15 ft) in low circular risers, each carrying a braced, ballasted curved LED wall of 500 mm cabinets; operator-driven with stops at 0° and 180°. |
| **The Unseen** | Two charcoal-and-brass architectural bays with thin seams of light. Guest turns a brass key; bay one's seams draw and it opens on the product, then the light crosses to bay two. The LED wall wakes behind them. | Two free-standing steel-framed bays with ballasted piers and rear braces; motorised leaves telescope into the piers. Two bays instead of one long wall to cut wind load. |
| **The Stage Is The Product** | The set is a monumental echo of the product's own form. Guest seats a machined core in the console, the light channels fire toward the bays, and the real products are revealed inside their giant counterparts. | Ballasted scenic structures up to about 17 ft with wind bracing; LED channels; motorised bay closures. |

## Read this before showing the client

- **These are preview-quality films**, rendered fast for review, not final path-traced renders. The earlier Ignition
  still shows the final look that level of render gives.
- **The guest is a neutral mannequin**, not a realistic person.
- **The products are placeholder forms.** Footprints are as briefed; heights and shape are assumed.
- **Reveals are compressed to about 10 seconds.** Real mechanisms (a revolve, vault doors, lowering covers) take
  longer; the running order in each concept's details gives realistic timings.
- **Daylight.** Light paths, seams and the LED wall read less strongly in full sun than they do on screen. The
  signal also runs along the stage front so seated guests can follow it; high-output fixtures or shading are worth
  costing.
- **Fog and CO2 appear only in the films**, not in the 3D review page.

## Assumed, not confirmed

Deck height (3 ft) · no roof over the stage · product heights and shape · the vehicle on each raised side platform
(shown as a covered car) and the platform size (drawn 4 × 12 ft on the plan, built 7.5 × 15 ft so a vehicle fits) ·
the building behind the stage · sun direction and show time.
