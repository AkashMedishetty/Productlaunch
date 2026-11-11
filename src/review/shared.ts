import { concepts as allConcepts } from '../data/concepts.ts'
import { deliveryFor } from '../data/deck.ts'
import type { Concept } from '../data/concepts.ts'

/** The six concepts that have a Blender previz, in presentation order. */
export const PREVIZ_IDS = ['pulse', 'ignition', 'cargo', 'revolve', 'unseen', 'stageproduct'] as const

export interface ReviewTier {
  tier: string
  build: string
  note: string
}
/** What the page needs to show a concept. Core concepts come from src/data, extras from review/specs/<id>.json. */
export interface ReviewConcept {
  id: string
  index: string
  name: string
  mechanism: string
  proposition: string
  tagline: string
  audience: string
  hook: string
  stageDesign: string
  concealment: string
  guest: string
  sequence: { time: string; title: string; detail: string }[]
  tech: string[]
  techDetail: string
  feasibility: string
  mitigation: string
  signature: string
  delivery: ReviewTier | null
  isNew?: boolean
}

const fromCore = (c: Concept): ReviewConcept => ({
  id: c.id,
  index: c.index,
  name: c.name,
  mechanism: c.mechanism,
  proposition: c.proposition,
  tagline: c.tagline,
  audience: c.audience,
  hook: c.hook,
  stageDesign: c.stageDesign,
  concealment: c.concealment,
  guest: c.guest,
  sequence: c.sequence,
  tech: c.tech,
  techDetail: c.techDetail,
  feasibility: c.feasibility,
  mitigation: c.mitigation,
  signature: c.signature,
  delivery: deliveryFor(c.id),
})

export const previzConcepts: ReviewConcept[] = PREVIZ_IDS.map((id) => allConcepts.find((c) => c.id === id))
  .filter((c): c is Concept => Boolean(c))
  .map(fromCore)

const str = (v: unknown) => (typeof v === 'string' ? v : '')

/** Tolerant reader for previz/specs/<id>.json (written by other tools; never trust the shape). */
export function fromSpec(raw: unknown, n: number): ReviewConcept | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const id = str(r.id)
  if (!id) return null
  const t = r.tier
  let delivery: ReviewTier | null = null
  if (typeof t === 'string' && t) delivery = { tier: t.toUpperCase(), build: '', note: '' }
  else if (t && typeof t === 'object') {
    const o = t as Record<string, unknown>
    if (str(o.tier)) delivery = { tier: str(o.tier).toUpperCase(), build: str(o.build), note: str(o.note) }
  }
  const sequence = Array.isArray(r.sequence)
    ? r.sequence
        .filter((s): s is Record<string, unknown> => Boolean(s) && typeof s === 'object')
        .map((s) => ({ time: str(s.time), title: str(s.title), detail: str(s.detail) }))
    : []
  return {
    id,
    index: `N${n}`,
    name: str(r.name) || id.toUpperCase(),
    mechanism: str(r.mechanism),
    proposition: str(r.proposition),
    tagline: str(r.tagline),
    audience: str(r.audience),
    hook: str(r.hook),
    stageDesign: str(r.stageDesign),
    concealment: str(r.concealment),
    guest: str(r.guest),
    sequence,
    tech: Array.isArray(r.tech) ? r.tech.filter((x): x is string => typeof x === 'string') : [],
    techDetail: str(r.techDetail),
    feasibility: str(r.feasibility),
    mitigation: str(r.mitigation),
    signature: str(r.signature),
    delivery,
    isNew: true,
  }
}

/** Extra concepts added after the first six: review/extra.json lists ids, review/specs/<id>.json holds each spec. */
export async function loadExtras(): Promise<ReviewConcept[]> {
  try {
    const res = await fetch(asset('extra.json'), { cache: 'no-cache' })
    if (!res.ok) return []
    const ids: unknown = await res.json()
    if (!Array.isArray(ids)) return []
    const out: ReviewConcept[] = []
    for (const id of ids) {
      if (typeof id !== 'string' || !/^[a-z0-9_-]+$/i.test(id)) continue
      if ((PREVIZ_IDS as readonly string[]).includes(id)) continue
      try {
        const r = await fetch(asset(`specs/${id}.json`), { cache: 'no-cache' })
        if (!r.ok) continue
        const c = fromSpec(await r.json(), out.length + 1)
        if (c) out.push({ ...c, id })
      } catch {
        /* skip a broken spec, keep the rest */
      }
    }
    return out
  } catch {
    return []
  }
}

export const STILLS: { key: string; label: string }[] = [
  { key: 'final', label: 'Final-quality still' },
  { key: 'cue', label: 'Guest cue' },
  { key: 'signal', label: 'Signal' },
  { key: 'reveal', label: 'Reveal' },
  { key: 'hero', label: 'Hero hold' },
]

export const DURATION = 10 // seconds, 240 frames at 24 fps

export interface Cue {
  label: string
  start: number
  end?: number
}

export const CUES: Cue[] = [
  { label: 'Guest cue', start: 1.5 },
  { label: 'Signal', start: 1.7, end: 3.5 },
  { label: 'LED wall wakes', start: 3.5, end: 5 },
  { label: 'Reveal', start: 5.75 },
  { label: 'Effects', start: 7.4 },
]

/** Static asset URL, relative to review.html so the build can be hosted in a sub-folder. */
export const asset = (p: string) => `review/${p}`

export type Vec3 = [number, number, number]
export interface View {
  id: string
  label: string
  position: Vec3
  target: Vec3
}

/** Preset views, metres, glTF Y-up. Stage front edge is near z = 0, the LED wall is at z ≈ -7. */
export const VIEWS: View[] = [
  { id: 'seat', label: 'Audience seat', position: [0, 1.58, 14.33], target: [0, 3.2, -3.05] },
  { id: 'wide', label: 'Centre wide', position: [0, 5.2, 25], target: [0, 3.4, -3] },
  { id: 'aerial', label: 'Aerial', position: [-19.5, 14, 24.4], target: [2, 0.2, 0.1] },
  { id: 'left', label: 'Stage left', position: [-11.3, 2.3, 4.3], target: [0, 2.9, -2.9] },
  { id: 'close', label: 'Close on products', position: [2.6, 1.9, 4.6], target: [0, 1.7, -3] },
]

/** Mutable playback clock shared between the WebGL scene and the timeline UI (no React re-renders per frame). */
export interface Clock {
  t: number
  playing: boolean
}
