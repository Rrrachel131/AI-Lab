import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";

const vert = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform float uPixel;
uniform float uScale;
attribute float aRand;
attribute float aShell;
varying float vGlow;
varying float vRand;
void main() {
  vec3 p = position;
  float t = uTime * 0.55;
  float n = sin(p.x * 2.1 + t) * sin(p.y * 2.4 - t * 1.3) * sin(p.z * 1.8 + t * 0.7);
  float breathe = 1.0 + 0.05 * sin(uTime * 1.5 + aRand * 6.2831) * (0.4 + uEnergy);
  p *= breathe + n * 0.16 * (0.45 + uEnergy) * (0.4 + aShell);
  float ang = t * 0.22 * (1.0 + aShell * 1.6);
  float c = cos(ang);
  float s = sin(ang);
  p.xz = mat2(c, -s, s, c) * p.xz;
  p *= uScale;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = (0.9 + aRand * 2.0) * (0.75 + uEnergy * 0.5);
  gl_PointSize = size * uPixel * (7.0 / max(0.1, -mv.z));
  vGlow = clamp(0.3 + n * 0.7 + uEnergy * 0.45 + (1.0 - aShell) * 0.35, 0.0, 1.4);
  vRand = aRand;
}`;

const frag = /* glsl */ `
uniform vec3 uHot;
uniform vec3 uMid;
uniform vec3 uCool;
uniform float uOpacity;
varying float vGlow;
varying float vRand;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = a * a;
  vec3 col = mix(uCool, uMid, clamp(vGlow, 0.0, 1.0));
  col = mix(col, uHot, clamp(vGlow - 0.7, 0.0, 1.0) * (0.5 + vRand * 0.5));
  gl_FragColor = vec4(min(col, vec3(1.0)), a * min(vGlow, 1.0) * uOpacity);
  #include <colorspace_fragment>
}`;

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Particle energy core. `energy` (0..1) must come from real progress. */
export function CoreParticles({ count, energy, scale = 1, opacity = 0.95 }: { count: number; energy: number; scale?: number; opacity?: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const rnd = mulberry(7);
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    const shell = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const k = rnd();
      // 45% dense core, 40% shell, 15% halo dust
      const sh = k < 0.45 ? 0 : k < 0.85 ? 0.5 : 1;
      const r = sh === 0 ? Math.cbrt(rnd()) * 0.75 : sh === 0.5 ? 1 + (rnd() - 0.5) * 0.12 : 1.25 + rnd() * 0.9;
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      pos[i * 3] = r * q * Math.cos(th);
      pos[i * 3 + 1] = r * u;
      pos[i * 3 + 2] = r * q * Math.sin(th);
      rand[i] = rnd();
      shell[i] = sh;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    g.setAttribute("aShell", new THREE.BufferAttribute(shell, 1));
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uPixel: { value: 1 },
      uScale: { value: scale },
      uOpacity: { value: opacity },
      uHot: { value: new THREE.Color("#FFE2C4") },
      uMid: { value: new THREE.Color("#E87532") },
      uCool: { value: new THREE.Color("#5a2410") },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    const m = mat.current;
    if (!m?.uniforms) return;
    const dt = Math.min(delta, 0.05);
    const u = m.uniforms as typeof uniforms;
    u.uTime.value += dt;
    u.uEnergy.value += (energy - u.uEnergy.value) * (1 - Math.exp(-3 * dt));
    u.uPixel.value = state.gl.getPixelRatio();
    u.uScale.value = scale;
  });

  return (
    <points geometry={geo}>
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Flowing light along a circular orbit, fraction 0..1 of the ring lit. */
export function OrbitFlow({ radius, fraction, count = 160, tilt = 0, speed = 0.15, color = "#FFAD72", size = 0.05 }: { radius: number; fraction: number; count?: number; tilt?: number; speed?: number; color?: string; size?: number }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const offset = useRef(0);
  useFrame((_, delta) => {
    offset.current = (offset.current + Math.min(delta, 0.05) * speed) % 1;
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const span = Math.max(0.0001, fraction) * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const f = ((i / count + offset.current) % 1) * span - Math.PI / 2;
      arr[i * 3] = Math.cos(f) * radius;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = Math.sin(f) * radius;
    }
    attr.needsUpdate = true;
  });
  if (fraction <= 0) return null;
  return (
    <points ref={ref} geometry={geo} rotation={[tilt, 0, 0]}>
      <pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Thin orbit ring. */
export function OrbitRing({ radius, opacity = 0.18, color = "#ffffff", tilt = 0 }: { radius: number; opacity?: number; color?: string; tilt?: number }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);
  return (
    <lineLoop geometry={geo} rotation={[tilt, 0, 0]}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineLoop>
  );
}

/** Lerp the group toward the pointer for a gentle parallax / depth shift. */
export function PointerParallax({ children, strength = 0.25 }: { children: ReactNode; strength?: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!g.current) return;
    const k = 1 - Math.exp(-2.5 * Math.min(delta, 0.05));
    g.current.rotation.y += (state.pointer.x * strength - g.current.rotation.y) * k;
    g.current.rotation.x += (-state.pointer.y * strength * 0.6 - g.current.rotation.x) * k;
  });
  return <group ref={g}>{children}</group>;
}
