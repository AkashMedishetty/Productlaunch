import { Environment, Lightformer } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useReducedMotion } from 'framer-motion';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Concept } from '../data/concepts';
import { AnnotateContext } from './Annotations';
import { ConceptStage } from './ConceptStage';
import { clamp01, smoothstep } from './primitives';

interface StageCanvasProps {
  concept: Concept;
  playKey: number;
  active: boolean;
  scrub?: number | null;
  annotate?: boolean;
  onProgress?: (value: number) => void;
}

const SEQUENCE_SECONDS = 5.4;

function easeInOutCubic(value: number) {
  const x = clamp01(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function SequenceClock({
  progress,
  playKey,
  reducedMotion,
  scrub,
  report,
}: {
  progress: React.MutableRefObject<number>;
  playKey: number;
  reducedMotion: boolean;
  scrub?: number | null;
  report?: (value: number) => void;
}) {
  const start = useRef<number | null>(null);

  useEffect(() => {
    start.current = null;
  }, [playKey]);

  useFrame((state) => {
    if (scrub !== undefined && scrub !== null) {
      progress.current = easeInOutCubic(scrub);
    } else if (reducedMotion) {
      progress.current = 1;
    } else {
      if (start.current === null) start.current = state.clock.elapsedTime + 0.45;
      const raw = clamp01((state.clock.elapsedTime - start.current) / SEQUENCE_SECONDS);
      progress.current = easeInOutCubic(raw);
    }
    report?.(progress.current);
  });

  return null;
}

function CameraRig({
  concept,
  reducedMotion,
  progress,
}: {
  concept: Concept;
  reducedMotion: boolean;
  progress: React.MutableRefObject<number>;
}) {
  const { camera, size } = useThree();
  const desired = useMemo(() => new THREE.Vector3(...concept.camera.pos), [concept.camera.pos]);
  const look = useMemo(() => new THREE.Vector3(...concept.camera.target), [concept.camera.target]);
  const temp = useMemo(() => new THREE.Vector3(), []);
  const lookTemp = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useMemo(() => new THREE.Vector3(), []);
  const initialised = useRef(false);

  const aspect = size.width / Math.max(1, size.height);
  const aspectPullback = THREE.MathUtils.clamp(1.12 / aspect, 1, 1.8);

  useEffect(() => {
    camera.position.copy(look.clone().add(desired.clone().sub(look).multiplyScalar(aspectPullback * 1.16)));
    camera.lookAt(look);
    initialised.current = true;
  }, [aspectPullback, camera, desired, look]);

  useFrame((state, delta) => {
    if (!initialised.current) return;
    const p = reducedMotion ? 1 : progress.current;
    const cue = smoothstep(0.08, 0.92, p);
    const dolly = aspectPullback * THREE.MathUtils.lerp(1.16, 0.94, easeInOutCubic(cue));

    const pointerX = reducedMotion ? 0 : state.pointer.x;
    const pointerY = reducedMotion ? 0 : state.pointer.y;
    const breath = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.21) * 0.075;
    const sway = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.13 + 1.2) * 0.055;

    temp.copy(look).add(desired.clone().sub(look).multiplyScalar(dolly));
    temp.x += pointerX * 0.26 + breath;
    temp.y += pointerY * 0.1 + sway * 0.5;
    temp.z += sway;

    lookTemp.copy(look);
    lookTemp.x += pointerX * 0.1;
    lookTemp.y += pointerY * 0.05 - smoothstep(0.2, 0.8, p) * 0.06;

    const damping = 1 - Math.exp(-delta * 1.35);
    camera.position.lerp(temp, damping);

    camera.getWorldDirection(currentLook);
    currentLook.add(camera.position);
    currentLook.lerp(lookTemp, damping * 0.55);
    camera.lookAt(currentLook);

    const baseFov = concept.camera.fov ?? 36;
    const targetFov = baseFov - easeInOutCubic(cue) * 3.4;
    const perspective = camera as THREE.PerspectiveCamera;
    if (Math.abs(perspective.fov - targetFov) > 0.02) {
      perspective.fov += (targetFov - perspective.fov) * Math.min(1, delta * 1.6);
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}

function Lighting({ accent, reducedMotion, progress }: { accent: string; reducedMotion: boolean; progress: React.MutableRefObject<number> }) {
  const key = useRef<THREE.SpotLight>(null);
  const rimL = useRef<THREE.SpotLight>(null);
  const rimR = useRef<THREE.SpotLight>(null);
  const practical = useRef<THREE.PointLight>(null);
  const bounce = useRef<THREE.PointLight>(null);

  const targets = useMemo(() => {
    const key = new THREE.Object3D();
    key.position.set(0, 1.1, 0);
    const left = new THREE.Object3D();
    left.position.set(0, 1.9, 0);
    const right = new THREE.Object3D();
    right.position.set(0, 1.6, 0);
    return { key, left, right };
  }, []);

  useFrame((state) => {
    if (reducedMotion) return;
    const p = progress.current;
    const cue = smoothstep(0.3, 0.92, p);
    const breathe = Math.sin(state.clock.elapsedTime * 0.6) * 0.5 + 0.5;
    if (key.current) key.current.intensity = 54 + cue * 20 + breathe * 1.8;
    if (rimL.current) rimL.current.intensity = 24 + cue * 14;
    if (rimR.current) rimR.current.intensity = 18 + cue * 14;
    if (practical.current) practical.current.intensity = 9 + breathe * 1.6 + cue * 6;
    if (bounce.current) bounce.current.intensity = 7.4 + cue * 3.2;
  });

  return (
    <>
      <primitive object={targets.key} />
      <primitive object={targets.left} />
      <primitive object={targets.right} />

      <ambientLight intensity={0.075} color="#96a8ac" />
      <hemisphereLight args={['#7f9aa2', '#050505', 0.18]} />

      <spotLight
        ref={key}
        target={targets.key}
        position={[1.4, 8.4, 5.6]}
        angle={0.62}
        penumbra={0.92}
        intensity={52}
        distance={30}
        decay={1.35}
        color="#ffeed4"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00035}
        shadow-normalBias={0.012}
      />

      <spotLight
        ref={rimL}
        target={targets.left}
        position={[-7.4, 5.6, -2.6]}
        angle={0.72}
        penumbra={1}
        intensity={22}
        distance={24}
        decay={1.4}
        color="#9dc2d2"
      />

      <spotLight
        ref={rimR}
        target={targets.right}
        position={[7.8, 5.2, -2.2]}
        angle={0.66}
        penumbra={1}
        intensity={16}
        distance={24}
        decay={1.4}
        color={accent}
      />

      <pointLight ref={practical} position={[-4.2, 1.5, 3.6]} intensity={10} distance={10} decay={1.7} color={accent} />
      <pointLight ref={bounce} position={[0, 1.25, 4.6]} intensity={7.4} distance={12} decay={1.7} color="#ffd9ad" />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={0.55} color="#ffe7c6" scale={[10, 4, 1]} position={[0, 8, 3]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={0.3} color="#7fa7bb" scale={[7, 3, 1]} position={[-8, 4, 1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={0.22} color="#c9a86a" scale={[6, 3, 1]} position={[8, 3.4, 0]} target={[0, 1, 0]} />
        <Lightformer form="ring" intensity={0.18} color="#dfe9e7" scale={3.4} position={[2, 6, -4]} target={[0, 2, 0]} />
      </Environment>
    </>
  );
}

export function StageCanvas({ concept, playKey, active, scrub = null, annotate = true, onProgress }: StageCanvasProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const progress = useRef(0);
  const lastReport = useRef(-1);
  const [supported, setSupported] = useState(true);

  const report = useMemo(() => {
    if (!onProgress) return undefined;
    return (value: number) => {
      if (Math.abs(value - lastReport.current) < 0.004) return;
      lastReport.current = value;
      onProgress(value);
    };
  }, [onProgress]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    setSupported(Boolean(context));
  }, []);

  if (!supported) {
    return (
      <div className="stage-fallback">
        <div className="stage-fallback__grid" />
        <p className="eyebrow">STAGE SIMULATION / SOFTWARE FALLBACK</p>
        <h3>{concept.name}</h3>
        <p>{concept.signature}</p>
      </div>
    );
  }

  return (
    <div className={`stage-canvas ${active ? 'is-active' : ''}`}>
      <Canvas
        dpr={[1, 1.65]}
        shadows="percentage"
        camera={{ position: concept.camera.pos, fov: concept.camera.fov ?? 36, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            setSupported(false);
          });
        }}
      >
        <color attach="background" args={['#040506']} />
        <fog attach="fog" args={['#040506', 17, 40]} />
        <Suspense fallback={null}>
          <SequenceClock progress={progress} playKey={playKey} reducedMotion={reducedMotion} scrub={scrub} report={report} />
          <CameraRig concept={concept} reducedMotion={reducedMotion} progress={progress} />
          <Lighting accent={concept.accent} reducedMotion={reducedMotion} progress={progress} />
          <AnnotateContext.Provider value={{ enabled: annotate, accent: concept.accent, progress }}>
            <ConceptStage concept={concept} progress={progress} />
          </AnnotateContext.Provider>
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.62} luminanceThreshold={0.52} luminanceSmoothing={0.42} mipmapBlur radius={0.72} />
            <Noise opacity={0.035} premultiply />
            <Vignette offset={0.22} darkness={0.66} eskil={false} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
