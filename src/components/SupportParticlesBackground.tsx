// src/components/SupportParticlesBackground.tsx
import { FC, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";


type ShardFieldProps = {
  count?: number;
};

const ShardField: FC<ShardFieldProps> = ({ count = 1600 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const speeds = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = 0.25 + Math.random() * 0.6;
    }
    return arr;
  }, [count]);

  const basePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const radius = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * Math.sqrt(Math.random());
      const y = (Math.random() - 0.5) * radius * 1.8;
      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, [count]);

  // NOTE: we don't need `delta`, so we remove it to fix the TS warning
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const baseX = basePositions[i * 3];
      const baseY = basePositions[i * 3 + 1];
      const baseZ = basePositions[i * 3 + 2];
      const speed = speeds[i];

      const swirl = t * 0.12 * speed + i * 0.25;
      const dist = Math.sqrt(baseX * baseX + baseZ * baseZ) + 0.0001;
      const swirlRadius = 6 + (dist % 10) * 0.6;

      const x = Math.cos(swirl) * swirlRadius;
      const z = Math.sin(swirl) * swirlRadius;
      const y =
        baseY +
        Math.sin(t * 0.7 + i * 0.13) * 0.25 +
        Math.cos(t * 0.25 + i * 0.05) * 0.1;

      const scaleBase = 0.06 + (i % 10) * 0.004;
      const scalePulse = 1 + Math.sin(t * 1.2 + i * 0.3) * 0.25;
      const s = scaleBase * scalePulse;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        t * 0.35 + i * 0.01,
        t * 0.6 + i * 0.015,
        t * 0.2 + i * 0.02
      );
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as any, undefined as any, count]}
    >
      {/* small tetrahedrons look like glass shards */}
      <tetrahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#e5e7eb"
        metalness={0.95}
        roughness={0.15}
        emissive="#111827"
        emissiveIntensity={0.9}
      />
    </instancedMesh>
  );
};

const ShardFieldBackground: FC = () => {
  return (
    <div className="shard-field-bg">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 55, position: [0, 0, 26] }}
      >
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 12, 50]} />

        <PerspectiveCamera makeDefault position={[0, 0, 26]} fov={55} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[12, 16, 10]}
          intensity={1.2}
          color="#38bdf8"
        />
        <directionalLight
          position={[-10, -12, -6]}
          intensity={0.7}
          color="#f97316"
        />
        <pointLight
          position={[0, 0, 0]}
          intensity={1.1}
          color="#a855f7"
          distance={40}
        />

        <ShardField />
      </Canvas>
    </div>
  );
};

export default ShardFieldBackground;
