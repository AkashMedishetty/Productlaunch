import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentRef, RefObject } from 'react'
import * as THREE from 'three'
import { DURATION, asset } from './shared.ts'
import type { Clock, Vec3, View } from './shared.ts'

interface CameraPath {
  fps: number
  frameStart: number
  frames: number[]
  position: Vec3[]
  target: Vec3[]
}
interface VenueMeta {
  trees: { base: Vec3; height: number; radius: number }[]
  sky?: { file: string; sunU: number; sunV: number } | null
}

function useJson<T>(url: string): T | null {
  const [data, setData] = useState<{ url: string; value: T } | null>(null)
  useEffect(() => {
    let alive = true
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((value) => alive && value && setData({ url, value: value as T }))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [url])
  return data && data.url === url ? data.value : null
}

/* ---------------------------------------------------------------- daylight */
const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: {},
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      float h = normalize(vDir).y;
      vec3 zenith = vec3(0.20, 0.42, 0.80);
      vec3 horizon = vec3(0.78, 0.86, 0.95);
      vec3 ground = vec3(0.42, 0.40, 0.37);
      vec3 sky = mix(horizon, zenith, pow(clamp(h, 0.0, 1.0), 0.55));
      vec3 col = mix(ground, sky, smoothstep(-0.04, 0.02, h));
      // soft sun glow, also gives metal something to reflect
      float sun = pow(max(dot(normalize(vDir), normalize(vec3(0.45, 0.75, 0.5))), 0.0), 60.0);
      gl_FragColor = vec4(col + vec3(1.0, 0.95, 0.85) * sun * 2.0, 1.0);
    }`,
})

/** Direction toward the sun, glTF Y-up. Blender (-0.22, -0.92) horizontally at 43 degrees elevation; audience side is +Z. */
const SUN_DIR = new THREE.Vector3(-0.22 * Math.cos(0.75), 0.946 * Math.sin(0.75), 0.92 * Math.cos(0.75)).normalize()
const SHADOW_FOCUS = new THREE.Vector3(0, 0, 4)

function Sun() {
  const light = useMemo(() => {
    const l = new THREE.DirectionalLight('#fff1dc', 3.2)
    l.position.copy(SHADOW_FOCUS).addScaledVector(SUN_DIR, 70)
    l.target.position.copy(SHADOW_FOCUS)
    l.castShadow = true
    l.shadow.mapSize.set(2048, 2048)
    const c = l.shadow.camera
    // tight box over stage + seating
    c.left = -22
    c.right = 22
    c.top = 22
    c.bottom = -22
    c.near = 20
    c.far = 130
    c.updateProjectionMatrix()
    l.shadow.bias = -0.0004
    l.shadow.normalBias = 0.05
    return l
  }, [])
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  )
}

function Daylight({ meta }: { meta: VenueMeta | null }) {
  // Same sky the Blender renders use (small equirect), rotated so its sun sits on the audience side.
  const rot = useMemo<[number, number, number]>(() => {
    const u = meta?.sky?.sunU ?? 0.6
    const phi0 = (u - 0.5) * Math.PI * 2
    const phi1 = Math.atan2(SUN_DIR.z, SUN_DIR.x)
    return [0, phi0 - phi1, 0]
  }, [meta])
  return (
    <>
      {meta?.sky ? (
        <Suspense fallback={null}>
          <Environment files={asset(meta.sky.file)} background environmentRotation={rot} backgroundRotation={rot} environmentIntensity={0.85} />
        </Suspense>
      ) : meta ? (
        <Environment background resolution={128} frames={1}>
          <mesh material={skyMaterial} scale={50}>
            <sphereGeometry args={[1, 32, 16]} />
          </mesh>
        </Environment>
      ) : null}
      <Sun />
    </>
  )
}

/* ------------------------------------------------------------------- venue */
function prepare(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    m.frustumCulled = true
    const mats = Array.isArray(m.material) ? m.material : [m.material]
    let solid = true
    for (const mat of mats) {
      const s = mat as THREE.MeshStandardMaterial
      // emitters: bright enough to read as lit in daylight, not so bright they clip to white
      if (s.emissiveIntensity > 2.6) s.emissiveIntensity = 2.6
      const emits = s.emissive && s.emissiveIntensity > 0 && s.emissive.r + s.emissive.g + s.emissive.b > 0.01
      if (s.transparent) s.depthWrite = false
      if (s.transparent || emits) solid = false
      for (const t of [s.map, s.normalMap, s.roughnessMap, s.metalnessMap]) if (t) t.anisotropy = 8
    }
    m.castShadow = solid
    m.receiveShadow = solid
  })
}

function Venue({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(asset('venue.glb'))
  useMemo(() => prepare(scene), [scene])
  const frames = useRef(0)
  // report ready only after the venue has actually been drawn (first frames include GPU upload + shader compile)
  useFrame(() => {
    if (frames.current < 3 && ++frames.current === 3) onReady()
  })
  return <primitive object={scene} />
}

/** The scanned trees are ~2M polygons each, so the web view uses simple stand-ins at the same positions. */
function Trees({ meta }: { meta: VenueMeta | null }) {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.12, 0.2, 1, 6), [])
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3d5a34', roughness: 0.95, flatShading: true }), [])
  const bark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4a3b2e', roughness: 1 }), [])
  if (!meta) return null
  return (
    <group>
      {meta.trees.map((t, i) => {
        const r = Math.min(t.radius, t.height * 0.42)
        return (
          <group key={i} position={[t.base[0], Math.max(t.base[1], 0), t.base[2]]}>
            <mesh castShadow geometry={trunk} material={bark} position={[0, t.height * 0.25, 0]} scale={[1.6, t.height * 0.5, 1.6]} />
            <mesh castShadow geometry={geo} material={leaf} position={[0, t.height * 0.66, 0]} scale={[r, t.height * 0.36, r]} />
          </group>
        )
      })}
    </group>
  )
}

/* ----------------------------------------------------------------- concept */
function ConceptModel({ id, clock }: { id: string; clock: RefObject<Clock> }) {
  const { scene, animations } = useGLTF(asset(`${id}.glb`))
  const { mixer, animated, length } = useMemo(() => {
    prepare(scene)
    const mixer = new THREE.AnimationMixer(scene)
    let length = 0
    const names = new Set<string>()
    for (const clip of animations) {
      length = Math.max(length, clip.duration)
      for (const tr of clip.tracks) if (tr.name.endsWith('.scale')) names.add(tr.name.slice(0, -6))
    }
    const animated: THREE.Object3D[] = []
    scene.traverse((o) => names.has(o.name) && animated.push(o))
    return { mixer, animated, length }
  }, [scene, animations])

  const last = useRef(-1)
  useEffect(() => {
    // one mixer drives every clip in the file (the exporter merges them into a single "Scene" clip)
    for (const clip of animations) mixer.clipAction(clip).play()
    last.current = -1
    return () => void mixer.stopAllAction()
  }, [mixer, animations])
  useFrame((_, delta) => {
    const c = clock.current
    if (c.playing) {
      c.t += Math.min(delta, 0.1)
      if (c.t >= DURATION) {
        c.t = DURATION
        c.playing = false
      }
    }
    if (c.t === last.current) return
    last.current = c.t
    mixer.setTime(Math.min(c.t, Math.max(0, length - 1e-3)))
    // "Switched off" objects were exported as scale 0.0001: skip drawing them entirely.
    for (const o of animated) o.visible = o.scale.x > 0.001 || o.scale.y > 0.001 || o.scale.z > 0.001
  })
  return <primitive object={scene} />
}

/* ------------------------------------------------------------------ camera */
const STAGE_FOCUS = new THREE.Vector3(0, 2.6, -3)

function samplePath(path: CameraPath, t: number, pos: THREE.Vector3, tgt: THREE.Vector3) {
  const f = path.frameStart + t * path.fps
  const fr = path.frames
  let i = 0
  while (i < fr.length - 2 && fr[i + 1] < f) i++
  const k = THREE.MathUtils.clamp((f - fr[i]) / (fr[i + 1] - fr[i]), 0, 1)
  const a = path.position[i]
  const b = path.position[i + 1]
  const c = path.target[i]
  const d = path.target[i + 1]
  pos.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k)
  tgt.set(c[0] + (d[0] - c[0]) * k, c[1] + (d[1] - c[1]) * k, c[2] + (d[2] - c[2]) * k)
}

function CameraRig({
  view,
  viewNonce,
  conceptId,
  clock,
  film,
  onFree,
}: {
  view: View
  viewNonce: number
  conceptId: string
  clock: RefObject<Clock>
  film: boolean
  onFree: () => void
}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree((s) => s.camera)
  const path = useJson<CameraPath>(asset(`${conceptId}.json`))
  const state = useRef({ flying: 0, toPos: new THREE.Vector3(), toTgt: new THREE.Vector3() })
  const tmpP = useMemo(() => new THREE.Vector3(), [])
  const tmpT = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const s = state.current
    s.toPos.fromArray(view.position)
    s.toTgt.fromArray(view.target)
    s.flying = 1
  }, [view, viewNonce])

  useFrame((_, delta) => {
    const s = state.current
    const ctl = controls.current
    if (!ctl) return
    if (film && path) {
      // director's camera: exactly the exported film path, interpolated between 2-frame samples
      samplePath(path, clock.current.t, tmpP, tmpT)
      camera.position.copy(tmpP)
      ctl.target.copy(tmpT)
      s.flying = 0
    } else if (s.flying > 0) {
      const k = 1 - Math.exp(-delta * 5)
      tmpP.copy(camera.position).lerp(s.toPos, k)
      tmpT.copy(ctl.target).lerp(s.toTgt, k)
      camera.position.copy(tmpP)
      ctl.target.copy(tmpT)
      if (camera.position.distanceTo(s.toPos) < 0.02) s.flying = 0
    }
    ctl.update()
    // seated eye level looks up at the stage, so the polar limit is loose; keep the camera above the ground instead
    if (camera.position.y < 0.5) camera.position.y = 0.5
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      panSpeed={0.7}
      minDistance={1.5}
      maxDistance={75}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI * 0.62}
      target={STAGE_FOCUS}
      onStart={() => {
        // the user grabbed the camera: stop any fly-to / seat-follow and hand over control
        state.current.flying = 0
        if (film) onFree()
      }}
    />
  )
}

/* ------------------------------------------------------------------ canvas */
export default function World({
  conceptId,
  clock,
  view,
  viewNonce,
  active,
  film,
  onFree,
  onReady,
}: {
  conceptId: string
  clock: RefObject<Clock>
  view: View
  viewNonce: number
  active: boolean
  film: boolean
  onFree: () => void
  onReady: () => void
}) {
  const meta = useJson<VenueMeta>(asset('venue.json'))
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 45, near: 0.2, far: 400, position: [0, 5.2, 25] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={(state) => {
        state.gl.toneMapping = THREE.ACESFilmicToneMapping
        state.gl.toneMappingExposure = 0.8
        state.gl.outputColorSpace = THREE.SRGBColorSpace
        if (import.meta.env.DEV) (window as unknown as { __review?: unknown }).__review = state
      }}
    >
      <Daylight meta={meta} />
      <Suspense fallback={null}>
        <Venue onReady={onReady} />
        <Trees meta={meta} />
      </Suspense>
      <Suspense fallback={null}>
        <ConceptModel key={conceptId} id={conceptId} clock={clock} />
      </Suspense>
      <CameraRig view={view} viewNonce={viewNonce} conceptId={conceptId} clock={clock} film={film} onFree={onFree} />
    </Canvas>
  )
}

useGLTF.preload(asset('venue.glb'))
