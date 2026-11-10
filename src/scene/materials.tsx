import * as THREE from 'three';

let roughnessTexture: THREE.CanvasTexture | null = null;

export function getRoughnessTexture() {
  if (roughnessTexture) return roughnessTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#b9b9b9';
  context.fillRect(0, 0, size, size);
  for (let i = 0; i < 4200; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.4 + Math.random() * 2.4;
    const shade = 120 + Math.random() * 90;
    context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.12 + Math.random() * 0.25})`;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = 4;
  roughnessTexture = texture;
  return texture;
}

let backdropTexture: THREE.CanvasTexture | null = null;

export function getBackdropTexture() {
  if (backdropTexture) return backdropTexture;
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const vertical = context.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, '#030405');
  vertical.addColorStop(0.55, '#070b0c');
  vertical.addColorStop(1, '#0c1214');
  context.fillStyle = vertical;
  context.fillRect(0, 0, width, height);
  const pool = context.createRadialGradient(width / 2, height * 0.82, 10, width / 2, height * 0.82, width * 0.46);
  pool.addColorStop(0, 'rgba(120, 132, 130, 0.24)');
  pool.addColorStop(0.5, 'rgba(70, 82, 84, 0.09)');
  pool.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = pool;
  context.fillRect(0, 0, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  backdropTexture = texture;
  return texture;
}

interface SurfaceOptions {
  color?: string;
  metalness?: number;
  roughness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  map?: THREE.Texture | null;
  envMapIntensity?: number;
}

export const surfaces = {
  scenic: (options: SurfaceOptions = {}) => (
    <meshStandardMaterial
      color={options.color ?? '#0a0c0d'}
      metalness={options.metalness ?? 0.24}
      roughness={options.roughness ?? 0.76}
      roughnessMap={options.map ?? undefined}
      emissive={options.emissive ?? '#000000'}
      emissiveIntensity={options.emissiveIntensity ?? 0}
      envMapIntensity={options.envMapIntensity ?? 0.5}
    />
  ),
  steel: (options: SurfaceOptions = {}) => (
    <meshStandardMaterial
      color={options.color ?? '#15181a'}
      metalness={options.metalness ?? 0.9}
      roughness={options.roughness ?? 0.32}
      roughnessMap={options.map ?? undefined}
      envMapIntensity={options.envMapIntensity ?? 0.9}
    />
  ),
  brass: (options: SurfaceOptions = {}) => (
    <meshStandardMaterial
      color={options.color ?? '#c9a86a'}
      metalness={1}
      roughness={options.roughness ?? 0.24}
      envMapIntensity={1.1}
    />
  ),
  product: (options: SurfaceOptions = {}) => (
    <meshPhysicalMaterial
      color={options.color ?? '#141a1c'}
      metalness={0.86}
      roughness={options.roughness ?? 0.28}
      clearcoat={0.5}
      clearcoatRoughness={0.24}
      roughnessMap={options.map ?? undefined}
      envMapIntensity={1}
    />
  ),
};
