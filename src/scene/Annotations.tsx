import { useFrame } from '@react-three/fiber';
import { createContext, useContext, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface AnnotateState {
  enabled: boolean;
  accent: string;
  progress: React.MutableRefObject<number>;
}

export const AnnotateContext = createContext<AnnotateState | null>(null);

interface CalloutProps {
  position: [number, number, number];
  label: string;
  at?: number;
  until?: number;
  side?: 'left' | 'right';
  scale?: number;
}

const PIXEL_RATIO = 2;
const FONT_SIZE = 34;
const TRACKING = 2.4;
const PAD_X = 24;
const PLATE_H = 76;
const PLATE_WORLD_HEIGHT = 0.32;

function makeLabelTexture(label: string, accent: string) {
  const probe = document.createElement('canvas').getContext('2d');
  if (!probe) return null;
  const font = `600 ${FONT_SIZE}px "Manrope", ui-sans-serif, -apple-system, "Helvetica Neue", sans-serif`;
  probe.font = font;
  const letters = Array.from(label);
  let textWidth = 0;
  letters.forEach((letter) => {
    textWidth += probe.measureText(letter).width + TRACKING;
  });
  textWidth = Math.max(0, textWidth - TRACKING);

  const width = Math.ceil(textWidth + PAD_X * 2 + 10);
  const canvas = document.createElement('canvas');
  canvas.width = width * PIXEL_RATIO;
  canvas.height = PLATE_H * PIXEL_RATIO;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.scale(PIXEL_RATIO, PIXEL_RATIO);

  context.beginPath();
  context.roundRect(0.75, 0.75, width - 1.5, PLATE_H - 1.5, 4.5);
  context.fillStyle = 'rgba(5, 8, 9, 0.66)';
  context.fill();
  context.strokeStyle = 'rgba(242, 238, 228, 0.18)';
  context.lineWidth = 1;
  context.stroke();

  context.fillStyle = accent;
  context.fillRect(0.75, 0.75, 2.5, PLATE_H - 1.5);

  context.font = font;
  context.fillStyle = '#f2eee4';
  context.textBaseline = 'middle';
  let x = PAD_X + 6;
  letters.forEach((letter) => {
    context.fillText(letter, x, PLATE_H / 2 + 1);
    x += context.measureText(letter).width + TRACKING;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return { texture, width, height: PLATE_H };
}

export function Callout({ position, label, at = 0, until = 1.1, side = 'right', scale = 1 }: CalloutProps) {
  const state = useContext(AnnotateContext);
  const accent = state?.accent ?? '#c9a86a';
  const plate = useMemo(() => makeLabelTexture(label, accent), [label, accent]);
  const sprite = useRef<THREE.SpriteMaterial>(null);
  const dot = useRef<THREE.MeshBasicMaterial>(null);
  const line = useRef<THREE.MeshBasicMaterial>(null);
  const lineMesh = useRef<THREE.Mesh>(null);
  const plateMesh = useRef<THREE.Sprite>(null);
  const root = useRef<THREE.Group>(null);
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const rightVec = useMemo(() => new THREE.Vector3(), []);
  const ndcA = useMemo(() => new THREE.Vector3(), []);
  const ndcB = useMemo(() => new THREE.Vector3(), []);
  const viewPos = useMemo(() => new THREE.Vector3(), []);

  const plateHeight = PLATE_WORLD_HEIGHT;
  const plateWidth = plate ? (plate.width / plate.height) * plateHeight : 1;
  const lineBaseLength = 0.4;
  const baseY = 0.1;
  const gap = 0.02;
  const margin = 0.05;

  useFrame(({ camera }) => {
    if (!state) return;
    const p = state.progress.current;
    const fadeIn = Math.min(1, Math.max(0, (p - at + 0.02) / 0.07));
    const fadeOut = Math.min(1, Math.max(0, (until - p) / 0.07));
    const opacity = state.enabled ? fadeIn * fadeOut : 0;
    if (sprite.current) sprite.current.opacity = opacity;
    if (dot.current) dot.current.opacity = opacity;
    if (line.current) line.current.opacity = opacity * 0.7;
    if (!root.current) return;

    root.current.getWorldPosition(worldPos);
    const distance = camera.position.distanceTo(worldPos);
    const rootScale = THREE.MathUtils.clamp(distance / 12, 0.95, 1.85) * scale;
    root.current.scale.setScalar(rootScale);

    const perspective = camera as THREE.PerspectiveCamera;
    if (!perspective.isPerspectiveCamera || !Number.isFinite(perspective.fov)) return;

    viewPos.copy(worldPos).applyMatrix4(camera.matrixWorldInverse);
    const depth = Math.max(0.001, -viewPos.z);
    const worldPerNdc = depth * Math.tan(THREE.MathUtils.degToRad(perspective.fov) / 2) * perspective.aspect;
    const halfPlate = (plateWidth * rootScale) / 2;
    const gapWorld = gap * rootScale;

    ndcA.copy(worldPos).project(camera);
    rightVec.setFromMatrixColumn(camera.matrixWorld, 0);
    ndcB.copy(worldPos).addScaledVector(rightVec, halfPlate * 2).project(camera);
    const halfNdc = Math.abs(ndcB.x - ndcA.x) / 2;

    let placeLeft = side === 'left';
    const fitsRight = ndcA.x + halfNdc * 2 + margin <= 1;
    const fitsLeft = ndcA.x - halfNdc * 2 - margin >= -1;
    if (!placeLeft && !fitsRight && fitsLeft) placeLeft = true;
    else if (placeLeft && !fitsLeft && fitsRight) placeLeft = false;
    const dir = placeLeft ? -1 : 1;

    let centerOffset = dir * (lineBaseLength * rootScale + halfPlate + gapWorld);
    const centerNdc = ndcA.x + centerOffset / worldPerNdc;
    const limit = 1 - margin - halfNdc;
    if (centerNdc > limit) centerOffset = (limit - ndcA.x) * worldPerNdc;
    else if (centerNdc < -limit) centerOffset = (-limit - ndcA.x) * worldPerNdc;

    const lineLength = Math.max(0.04 * rootScale, Math.abs(centerOffset) - halfPlate - gapWorld);
    if (lineMesh.current) {
      lineMesh.current.scale.x = lineLength / (lineBaseLength * rootScale);
      lineMesh.current.position.x = (dir * lineLength) / (2 * rootScale);
    }
    if (plateMesh.current) {
      plateMesh.current.position.x = (Math.sign(centerOffset) || dir) * (lineLength + gapWorld + halfPlate) / rootScale;
    }
  });

  if (!plate) return null;

  return (
    <group ref={root} position={position}>
      <mesh renderOrder={20}>
        <sphereGeometry args={[0.034, 12, 12]} />
        <meshBasicMaterial ref={dot} color={accent} transparent opacity={0} toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh ref={lineMesh} position={[0, baseY, 0]} renderOrder={20}>
        <boxGeometry args={[lineBaseLength, 0.008, 0.008]} />
        <meshBasicMaterial ref={line} color="#f2eee4" transparent opacity={0} toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
      <sprite ref={plateMesh} position={[0, baseY, 0]} scale={[plateWidth, plateHeight, 1]} renderOrder={21}>
        <spriteMaterial ref={sprite} map={plate.texture} transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}
