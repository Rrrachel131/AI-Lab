import { Html } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DENSITY } from "@/lib/fx";
import { CoreParticles, OrbitFlow, OrbitRing } from "@/components/fx/three/CoreParticles";
import type { UniverseBody } from "./types";

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

function layout(i: number) {
  const radius = 2.6 + i * 1.25;
  return { radius, phase: i * GOLDEN * 2.3, speed: 0.06 / Math.sqrt(1 + i * 0.6) };
}

function Planet({ body, index, onPick, picking }: { body: UniverseBody; index: number; onPick: (id: string, pos: THREE.Vector3) => void; picking: string | null }) {
  const g = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const { radius, phase, speed } = layout(index);
  const size = 0.28 + Math.min(0.42, Math.sqrt(body.taskCount) * 0.07);
  const color = useMemo(() => new THREE.Color().setHSL(body.hue / 360, 0.72, 0.52), [body.hue]);
  const angle = useRef(phase);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!picking) angle.current += dt * speed;
    if (g.current) g.current.position.set(Math.cos(angle.current) * radius, 0, Math.sin(angle.current) * radius);
    if (mesh.current) {
      mesh.current.rotation.y += dt * 0.4;
      const target = hover || picking === body.id ? 1.25 : 1;
      const s = mesh.current.scale.x + (target - mesh.current.scale.x) * (1 - Math.exp(-8 * dt));
      mesh.current.scale.setScalar(s);
    }
  });
  return (
    <>
      <OrbitRing radius={radius} opacity={hover ? 0.28 : 0.1} />
      <group ref={g}>
        <mesh
          ref={mesh}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (g.current) onPick(body.id, g.current.position.clone());
          }}
        >
          <sphereGeometry args={[size, 48, 48]} />
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.15} emissive={color} emissiveIntensity={0.08 + body.progress * 0.45} />
        </mesh>
        {/* progress halo: lit fraction = real completion */}
        <OrbitRing radius={size * 1.7} opacity={0.18} tilt={Math.PI / 2.4} />
        <OrbitFlow radius={size * 1.7} fraction={body.progress} tilt={Math.PI / 2.4} count={70} size={0.03} speed={0.08} />
        <Html center distanceFactor={9} position={[0, size + 0.45, 0]} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap text-center font-mono text-[11px] leading-tight text-ink-foreground">
            <div className="font-sans text-[13px] font-medium tracking-tight">{body.name}</div>
            <div className="text-amber">{Math.round(body.progress * 100)}% · {body.daysLeft >= 0 ? `${body.daysLeft}d` : "overdue"}</div>
          </div>
        </Html>
      </group>
    </>
  );
}

function CameraRig({ target, onArrive }: { target: THREE.Vector3 | null; onArrive: () => void }) {
  const { camera, pointer } = useThree();
  const t = useRef(0);
  const fired = useRef(false);
  const look = useRef(new THREE.Vector3());
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (target) {
      t.current = Math.min(1, t.current + dt / 1.1);
      const dest = target.clone().add(new THREE.Vector3(0, 0.35, 1.2));
      camera.position.lerp(dest, 1 - Math.exp(-4 * dt));
      look.current.lerp(target, 1 - Math.exp(-5 * dt));
      camera.lookAt(look.current);
      if (t.current > 0.75 && !fired.current) {
        fired.current = true;
        onArrive();
      }
    } else {
      const dest = new THREE.Vector3(pointer.x * 1.2, 6.5 + pointer.y * 0.6, 13);
      camera.position.lerp(dest, 1 - Math.exp(-1.5 * dt));
      look.current.lerp(new THREE.Vector3(0, 0, 0), 1 - Math.exp(-3 * dt));
      camera.lookAt(look.current);
    }
  });
  return null;
}

function Dust() {
  const geo = useMemo(() => {
    const n = 1400;
    const arr = new Float32Array(n * 3);
    let s = 3;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++) {
      const rad = 14 + r() * 30;
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      arr[i * 3] = rad * q * Math.cos(th);
      arr[i * 3 + 1] = rad * u * 0.6;
      arr[i * 3 + 2] = rad * q * Math.sin(th);
    }
    return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(arr, 3));
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#d9c8b8" size={0.06} sizeAttenuation transparent opacity={0.5} depthWrite={false} />
    </points>
  );
}

export default function UniverseScene({ bodies, overall, density, onEnter }: { bodies: UniverseBody[]; overall: number; density: keyof typeof DENSITY; onEnter: (id: string) => void }) {
  const [pick, setPick] = useState<{ id: string; pos: THREE.Vector3 } | null>(null);
  const [ready, setReady] = useState(false);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "" : undefined}>
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 9, 18], fov: 45 }} gl={{ antialias: true, alpha: true }} onCreated={() => requestAnimationFrame(() => setReady(true))} onPointerMissed={() => setPick(null)}>
        <ambientLight intensity={0.35} />
        <pointLight position={[0, 0, 0]} intensity={60} distance={40} decay={1.6} color="#ffb27a" />
        <directionalLight position={[6, 8, 4]} intensity={0.6} color="#fff1e4" />
        <Dust />
        <group scale={0.62}>
          <CoreParticles count={Math.round(DENSITY[density] * 0.6)} energy={overall} scale={1.1} />
        </group>
        {bodies.map((b, i) => (
          <Planet key={b.id} body={b} index={i} picking={pick?.id ?? null} onPick={(id, pos) => setPick({ id, pos })} />
        ))}
        <CameraRig target={pick?.pos ?? null} onArrive={() => pick && onEnter(pick.id)} />
      </Canvas>
      <div className={`pointer-events-none absolute inset-0 bg-ink transition-opacity duration-500 ${pick ? "opacity-100 delay-300" : "opacity-0"}`} />
    </div>
  );
}
