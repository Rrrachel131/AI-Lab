import { Html } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { DENSITY } from "@/lib/fx";
import { CoreParticles } from "@/components/fx/three/CoreParticles";
import { OrbitCamera, OrbitViewport } from "@/components/fx/three/OrbitViewport";
import type { OdysseyNode } from "./types";

const RX = 3.9;
const RZ = 2.5;
function nodeAngle(i: number, n: number) {
  return -Math.PI / 2 - (i / Math.max(1, n)) * Math.PI * 2 + Math.PI; // start at front
}
const point = (a: number) => new THREE.Vector3(Math.cos(a) * RX, 0, Math.sin(a) * RZ);

function Orbit({ litFraction }: { litFraction: number }) {
  const full = useMemo(() => {
    const pts = Array.from({ length: 257 }, (_, i) => point((i / 256) * Math.PI * 2));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const flowGeo = useMemo(
    () =>
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(220 * 3), 3),
      ),
    [],
  );
  const off = useRef(0);
  useFrame((_, d) => {
    off.current = (off.current + Math.min(d, 0.05) * 0.12) % 1;
    const attr = flowGeo.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const start = nodeAngle(0, 1);
    for (let i = 0; i < 220; i++) {
      const f = ((i / 220 + off.current) % 1) * Math.max(0.0001, litFraction);
      const p = point(start - f * Math.PI * 2);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = Math.sin(i * 1.7 + off.current * 30) * 0.02;
      arr[i * 3 + 2] = p.z;
    }
    attr.needsUpdate = true;
  });
  return (
    <>
      <lineLoop geometry={full}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.14} />
      </lineLoop>
      {litFraction > 0 && (
        <points geometry={flowGeo}>
          <pointsMaterial
            color="#FFAD72"
            size={0.06}
            sizeAttenuation
            transparent
            opacity={0.95}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </>
  );
}

function Node({
  node,
  total,
  selected,
  onSelect,
  labels,
}: {
  node: OdysseyNode;
  total: number;
  selected: boolean;
  onSelect: (id: string) => void;
  labels: RefObject<HTMLElement>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  const pos = useMemo(() => point(nodeAngle(node.index, total)), [node.index, total]);
  const color = node.state === "done" ? "#FFAD72" : node.state === "active" ? "#E87532" : "#5b5652";
  useFrame((state, d) => {
    const dt = Math.min(d, 0.05);
    if (ref.current) {
      const target = selected ? 1.5 : hover ? 1.3 : 1;
      const s = ref.current.scale.x + (target - ref.current.scale.x) * (1 - Math.exp(-10 * dt));
      ref.current.scale.setScalar(s);
    }
    if (ring.current) {
      const t = state.clock.elapsedTime;
      const p = node.state === "active" ? 1 + ((t * 0.8) % 1) * 1.4 : 1.3;
      ring.current.scale.setScalar(p);
      (ring.current.material as THREE.MeshBasicMaterial).opacity =
        node.state === "active" ? 0.6 * (1 - ((t * 0.8) % 1)) : selected ? 0.6 : 0;
    }
  });
  return (
    <group position={pos}>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => {
          setHover(false);
        }}
      >
        <sphereGeometry args={[0.17, 32, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.27, 48]} />
        <meshBasicMaterial
          color="#E87532"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <Html
        center
        distanceFactor={8}
        position={[0, 0.55, 0]}
        zIndexRange={[10, 0]}
        portal={labels}
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap text-center">
          <div className="font-mono text-[10px] tracking-[0.18em] text-ink-muted">
            {String(node.index + 1).padStart(2, "0")}
          </div>
          <div
            className={`text-[13px] font-medium tracking-tight ${node.state === "upcoming" ? "text-ink-muted" : "text-ink-foreground"}`}
          >
            {node.name}
          </div>
          <div className="font-mono text-[10px] text-amber">{Math.round(node.progress * 100)}%</div>
        </div>
      </Html>
    </group>
  );
}

export default function OdysseyScene({
  nodes,
  energy,
  density,
  motion,
  selectedId,
  onSelect,
}: {
  nodes: OdysseyNode[];
  energy: number;
  density: keyof typeof DENSITY;
  motion: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [ready, setReady] = useState(false);
  // lit fraction: completed phases plus partial progress of the active one
  const lit = useMemo(() => {
    if (!nodes.length) return 0;
    const done = nodes.filter((n) => n.state === "done").length;
    const active = nodes.find((n) => n.state === "active");
    return Math.min(1, (done + (active?.progress ?? 0)) / nodes.length);
  }, [nodes]);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "" : undefined}>
      <OrbitViewport
        motion={motion}
        className="absolute bottom-[4.25rem] left-5 z-10 flex items-center gap-1.5 md:bottom-[5.5rem] md:left-8"
      >
        {(view, labels) => (
          <Canvas
            dpr={[1, 1.75]}
            camera={{ position: [0, 9, 20], fov: 42 }}
            gl={{ antialias: true, alpha: true }}
            onCreated={() => requestAnimationFrame(() => setReady(true))}
            onPointerMissed={() => onSelect(null)}
          >
            <OrbitCamera view={view} height={3.4} distance={8.6} lookY={-0.2} motion={motion} />
            <group position={[0, 0.25, 0]}>
              <CoreParticles count={DENSITY[density]} energy={energy} scale={1.15} />
            </group>
            <Orbit litFraction={lit} />
            {nodes.map((n) => (
              <Node
                key={n.id}
                node={n}
                labels={labels}
                total={nodes.length}
                selected={selectedId === n.id}
                onSelect={onSelect}
              />
            ))}
          </Canvas>
        )}
      </OrbitViewport>
    </div>
  );
}
