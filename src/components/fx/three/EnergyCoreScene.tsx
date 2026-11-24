import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { DENSITY } from "@/lib/fx";
import { CoreParticles, OrbitFlow, OrbitRing, PointerParallax } from "./CoreParticles";

export default function EnergyCoreScene({ energy, density }: { energy: number; density: keyof typeof DENSITY }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "" : undefined}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, 4.6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => requestAnimationFrame(() => setReady(true))}
      >
        <PointerParallax strength={0.35}>
          <group rotation={[0.18, 0, -0.12]}>
            <CoreParticles count={DENSITY[density]} energy={energy} />
            <OrbitRing radius={1.75} opacity={0.12} tilt={0.35} />
            <OrbitFlow radius={1.75} fraction={energy} tilt={0.35} count={120} size={0.035} />
            <OrbitRing radius={2.25} opacity={0.06} tilt={-0.5} />
          </group>
        </PointerParallax>
      </Canvas>
    </div>
  );
}
