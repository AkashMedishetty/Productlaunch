import { useProgress } from '@react-three/drei'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import World from './World.tsx'
import { CUES, DURATION, STILLS, VIEWS, asset, loadExtras, previzConcepts } from './shared.ts'
import type { Clock, ReviewConcept } from './shared.ts'

type Mode = '3d' | 'film' | 'stills'

const fmt = (t: number) => `${t.toFixed(2).padStart(5, '0')} s`

function Loader({ ready }: { ready: boolean }) {
  const { active, progress, item } = useProgress()
  if (!active && ready) return null
  const pct = active ? Math.round(progress) : 100
  return (
    <div className="loader" role="status">
      <div className="loader-title">{ready ? 'Loading concept' : 'Loading the venue'}</div>
      <div className="loader-bar">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="loader-sub">{active ? `${pct}% · ${item.split('/').pop()}` : 'Preparing the 3D scene (about 16 MB on first load)'}</div>
    </div>
  )
}

function Timeline({ clock, playing, setPlaying }: { clock: RefObject<Clock>; playing: boolean; setPlaying: (p: boolean) => void }) {
  const range = useRef<HTMLInputElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const fill = useRef<HTMLDivElement>(null)

  // The WebGL loop owns the clock; mirror it into the DOM without re-rendering React every frame.
  useEffect(() => {
    let raf = 0
    let last = -1
    const tick = () => {
      const c = clock.current
      if (c.t !== last) {
        last = c.t
        if (range.current) range.current.value = String(c.t)
        if (label.current) label.current.textContent = fmt(c.t)
        if (fill.current) fill.current.style.width = `${(c.t / DURATION) * 100}%`
      }
      if (!c.playing && playing) setPlaying(false) // reached the end
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clock, playing, setPlaying])

  const seek = (t: number) => {
    clock.current.t = Math.max(0, Math.min(DURATION, t))
  }

  return (
    <div className="timeline">
      <button
        className="play"
        onClick={() => {
          if (!playing && clock.current.t >= DURATION - 0.01) seek(0)
          setPlaying(!playing)
        }}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg viewBox="0 0 16 16" width="14" height="14"><rect x="3" y="2" width="3.5" height="12" fill="currentColor" /><rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 2l10 6-10 6z" fill="currentColor" /></svg>
        )}
      </button>
      <button className="ghost" onClick={() => seek(0)} title="Back to start">
        Restart
      </button>
      <div className="track-wrap">
        <div className="cues">
          {CUES.map((c) => (
            <button
              key={c.label}
              className={`cue ${c.end ? 'cue-range' : 'cue-point'}`}
              style={{ left: `${(c.start / DURATION) * 100}%`, width: c.end ? `${((c.end - c.start) / DURATION) * 100}%` : undefined }}
              onClick={() => seek(c.start)}
              title={`Jump to ${c.label}`}
            >
              <span className="cue-label">
                {c.label} <em>{c.end ? `${c.start}–${c.end} s` : `${c.start} s`}</em>
              </span>
            </button>
          ))}
        </div>
        <div className="track">
          <div className="track-fill" ref={fill} />
          <input
            ref={range}
            type="range"
            min={0}
            max={DURATION}
            step={0.01}
            defaultValue={0}
            aria-label="Timeline"
            onInput={(e) => seek(Number(e.currentTarget.value))}
          />
        </div>
        <div className="ticks">
          {Array.from({ length: DURATION + 1 }, (_, i) => (
            <span key={i} style={{ left: `${(i / DURATION) * 100}%` }}>
              {i}
            </span>
          ))}
        </div>
      </div>
      <span className="time" ref={label}>
        {fmt(0)}
      </span>
    </div>
  )
}

function Stills({ id, name }: { id: string; name: string }) {
  const [missing, setMissing] = useState<Record<string, boolean>>({})
  const shown = STILLS.filter((s) => !missing[s.key])
  return (
    <div className="stills">
      {shown.length === 0 && <p className="stills-empty">No stills have been rendered for this concept yet.</p>}
      {STILLS.map((s) =>
        missing[s.key] ? null : (
          <figure key={s.key} className={s.key === 'final' ? 'still-final' : ''}>
            <img
              src={asset(`stills/${id}_${s.key}.jpg`)}
              alt={`${name}: ${s.label}`}
              loading="lazy"
              onError={() => setMissing((m) => ({ ...m, [s.key]: true }))}
            />
            <figcaption>{s.label}</figcaption>
          </figure>
        ),
      )}
    </div>
  )
}

function Details({ c, onClose }: { c: ReviewConcept; onClose: () => void }) {
  const d = c.delivery
  return (
    <aside className="details" key={c.id}>
      <button className="details-close" onClick={onClose} aria-label="Close details">
        Close
      </button>
      <div className="eyebrow">
        {c.isNew ? 'New concept' : `Concept ${c.index}`} · {c.mechanism}
      </div>
      <h1>{c.name}</h1>
      <p className="proposition">{c.proposition}</p>
      <p className="tagline">{c.tagline}</p>

      {d && (
        <div className="tier">
          <span className={`tier-badge tier-${d.tier.toLowerCase()}`}>{d.tier}</span>
          {d.build && <span className="tier-build">{d.build}</span>}
          {d.note && <p>{d.note}</p>}
        </div>
      )}

      <section hidden={!c.audience}>
        <h2>What the audience sees</h2>
        <p>{c.audience}</p>
        <p className="hook">{c.hook}</p>
      </section>
      <section hidden={!c.guest}>
        <h2>Guest action</h2>
        <p>{c.guest}</p>
      </section>
      <section hidden={!c.stageDesign}>
        <h2>Stage design</h2>
        <p>{c.stageDesign}</p>
      </section>
      <section hidden={!c.concealment}>
        <h2>Concealment</h2>
        <p>{c.concealment}</p>
      </section>
      <section hidden={c.sequence.length === 0}>
        <h2>Sequence</h2>
        <p className="note">Full show running order. The previz compresses the same beats into 10 seconds.</p>
        <table>
          <tbody>
            {c.sequence.map((s) => (
              <tr key={s.time + s.title}>
                <th>{s.time}</th>
                <td>
                  <strong>{s.title}</strong>
                  {s.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Technology</h2>
        <ul className="chips">
          {c.tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p>{c.techDetail}</p>
      </section>
      <section hidden={!c.feasibility}>
        <h2>Feasibility</h2>
        <p>{c.feasibility}</p>
      </section>
      <section hidden={!c.mitigation}>
        <h2>Mitigation</h2>
        <p>{c.mitigation}</p>
      </section>
      <section hidden={!c.signature}>
        <h2>Signature moment</h2>
        <p>{c.signature}</p>
      </section>
    </aside>
  )
}

export default function ReviewApp() {
  const [extras, setExtras] = useState<ReviewConcept[]>([])
  const all = extras.length ? [...previzConcepts, ...extras] : previzConcepts
  const wanted = useRef(new URLSearchParams(location.search).get('concept'))
  const [conceptId, setConceptId] = useState((previzConcepts.find((c) => c.id === wanted.current) ?? previzConcepts[0]).id)
  const [mode, setMode] = useState<Mode>('3d')
  const [playing, setPlayingState] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [film, setFilm] = useState(true) // director's camera by default
  const [viewNonce, setViewNonce] = useState(0)
  const [ready, setReady] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(() => window.innerWidth >= 1100 && window.innerHeight >= 560)
  const onReady = useCallback(() => setReady(true), [])
  const lastView = useRef(VIEWS.find((v) => v.id === 'wide')!)
  const clock = useRef<Clock>({ t: 0, playing: false })
  const concept = all.find((c) => c.id === conceptId) ?? previzConcepts[0]

  const setPlaying = useCallback((p: boolean) => {
    clock.current.playing = p
    setPlayingState(p)
  }, [])

  // extra concepts (if any) are appended after the six; with none the page is unchanged
  useEffect(() => {
    let alive = true
    loadExtras().then((list) => {
      if (!alive || list.length === 0) return
      setExtras(list)
      if (wanted.current && list.some((c) => c.id === wanted.current)) setConceptId(wanted.current)
    })
    return () => {
      alive = false
    }
  }, [])

  const selectConcept = (id: string) => {
    setConceptId(id)
    clock.current.t = 0
    setPlaying(false)
  }
  const selectView = (id: string) => {
    lastView.current = VIEWS.find((v) => v.id === id)!
    setViewId(id)
    setFilm(false)
    setViewNonce((n) => n + 1)
  }
  const onFree = useCallback(() => setFilm(false), [])
  const leave3d = (m: Mode) => {
    setPlaying(false)
    setMode(m)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && mode === '3d' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLSelectElement)) {
        e.preventDefault()
        if (!clock.current.playing && clock.current.t >= DURATION - 0.01) clock.current.t = 0
        setPlaying(!clock.current.playing)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, setPlaying])

  return (
    <div className={`review ${detailsOpen ? 'details-open' : 'details-closed'}`}>
      <nav className="rail">
        <div className="brand">
          <span className="brand-serif">Reveal</span>
          <span className="brand-sub">Previz review · outdoor stage 56 × 24 ft</span>
        </div>
        <ol className="concepts">
          {all.map((c) => (
            <li key={c.id}>
              <button className={c.id === conceptId ? 'on' : ''} onClick={() => selectConcept(c.id)}>
                <span className="idx">{c.index}</span>
                <span className="nm">
                  {c.name}
                  {c.isNew && <em className="new">New</em>}
                </span>
                <span className="mech">{c.mechanism}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="caveats">
          <h3>Reading this previz</h3>
          <p>Fog, haze and CO₂ jets are shown only in the film. The 3D view leaves them out.</p>
          <p>Products are placeholder forms on 5 × 5 ft and 7 × 7 ft footprints, not the final objects.</p>
          <p>Stage lighting beams are not shown in 3D. The film and stills carry the finished look.</p>
        </div>
      </nav>

      <main className="stage">
        <header className="bar">
          <select className="concept-pick" value={conceptId} onChange={(e) => selectConcept(e.target.value)} aria-label="Concept">
            {all.map((c) => (
              <option key={c.id} value={c.id}>
                {c.index} · {c.name}
                {c.isNew ? ' (new)' : ''}
              </option>
            ))}
          </select>
          <div className="seg" role="tablist" aria-label="Display">
            <button className={mode === '3d' ? 'on' : ''} onClick={() => setMode('3d')}>
              3D world
            </button>
            <button className={mode === 'film' ? 'on' : ''} onClick={() => leave3d('film')}>
              Film
            </button>
            <button className={mode === 'stills' ? 'on' : ''} onClick={() => leave3d('stills')}>
              Stills
            </button>
          </div>
          {mode === '3d' && (
            <div className="views">
              <span className="views-label">Camera</span>
              <div className="seg seg-cam" role="tablist" aria-label="Camera">
                <button
                  className={film ? 'on' : ''}
                  onClick={() => {
                    setViewId(null)
                    setFilm(true)
                  }}
                >
                  Film camera
                </button>
                <button className={!film ? 'on' : ''} onClick={() => setFilm(false)}>
                  Free orbit
                </button>
              </div>
              <span className="views-label views-gap">Jump to</span>
              {VIEWS.map((v) => (
                <button key={v.id} className={!film && viewId === v.id ? 'on' : ''} onClick={() => selectView(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
          )}
          <button className="details-toggle" onClick={() => setDetailsOpen((o) => !o)} aria-pressed={detailsOpen}>
            {detailsOpen ? 'Hide details' : 'Details'}
          </button>
        </header>

        <div className="viewport">
          <div className="canvas-wrap" style={{ visibility: mode === '3d' ? 'visible' : 'hidden' }}>
            <World conceptId={conceptId} clock={clock} view={lastView.current} viewNonce={viewNonce} active={mode === '3d'} film={film} onFree={onFree} onReady={onReady} />
            {mode === '3d' && <Loader ready={ready} />}
            {mode === '3d' && (
              <div className="hint">
                {film ? 'Film camera: follows the director’s move from the audience seat. Drag to take over.' : 'Free orbit: drag to orbit · right-drag to pan · scroll to zoom · space to play'}
              </div>
            )}
          </div>
          {mode === 'film' && (
            <video key={conceptId} className="film" src={asset(`media/${conceptId}.mp4`)} controls autoPlay loop muted playsInline />
          )}
          {mode === 'stills' && <Stills key={conceptId} id={conceptId} name={concept.name} />}
        </div>

        {mode === '3d' ? (
          <Timeline clock={clock} playing={playing} setPlaying={setPlaying} />
        ) : (
          <div className="timeline timeline-note">
            {mode === 'film'
              ? 'Rendered preview film, 10 s. Includes fog, CO₂ and stage lighting that the 3D view leaves out.'
              : 'Rendered frames from the film at the guest cue, the signal, the reveal and the hero hold.'}
          </div>
        )}
      </main>

      <Details c={concept} onClose={() => setDetailsOpen(false)} />
    </div>
  )
}
