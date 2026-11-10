# Product Launch — stagecraft deck

A pitch deck for a blind product launch: three products at 2×2, 4×4 and 6×6 ft, launched on a fixed 18 × 9 m stage in a 1,000–2,000 seat room. Sixteen physical reveal concepts are drawn as mechanisms rather than moods — every phase written out, every machine visible, every claim tied to something a crew can build.

The deck runs in the browser in WebGL (React Three Fiber) and is backed by a printable anatomy dossier in `anatomy/anatomy-a4.pdf`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/
npm run preview    # serve the built deck
```

Slides deep-link by hash: `/#12` opens slide 12. Number keys and the arrow keys navigate.

## What is in here

| Path | Contents |
| --- | --- |
| `src/data/concepts.ts` | All 16 concepts: mechanism, five-phase sequence, cue sheet, sizes, feasibility, delivery tier |
| `src/data/deck.ts` | Editorial slides and delivery bands |
| `src/scene/` | R3F stage, concept mechanics, annotations, materials |
| `src/components/` | Deck shell, slides, dossier overlay, stage panel |
| `anatomy/` | Print pipeline: scene generator, layout builder, phases, isometric kit |
| `anatomy/anatomy-a4.pdf` | 37-page A4 light-mode dossier, one plate per concept |

## Rebuilding the PDF

```bash
node anatomy/build.mjs      # writes anatomy/anatomy.html
```

Then print `anatomy/anatomy.html` to A4 with a headless browser:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --no-pdf-header-footer \
  --print-to-pdf=anatomy/anatomy-a4.pdf \
  "file://$PWD/anatomy/anatomy.html"
```

## Credits

The isometric drawing kit in `anatomy/kit/` comes from [wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), MIT licensed. The license text is kept at `anatomy/kit/LICENSE`.
