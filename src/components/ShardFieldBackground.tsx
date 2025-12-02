// src/components/ShardFieldBackground.tsx
import { FC, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

type ShardFieldProps = {
  count?: number;
};

const ShardField: FC<ShardFieldProps> = ({ count = 3200 }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // random per-shard speeds
  const speeds = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = 0.25 + Math.random() * 0.6;
    }
    return arr;
  }, [count]);

  // base positions in a bigger disk so they cover the whole screen
  const basePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const radius = 26; // spread wider
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * Math.sqrt(Math.random());
      const y = (Math.random() - 0.5) * radius * 2.4; // taller vertical spread

      arr[i * 3] = Math.cos(angle) * r;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = Math.sin(angle) * r;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const baseX = basePositions[i * 3];
      const baseY = basePositions[i * 3 + 1];
      const baseZ = basePositions[i * 3 + 2];
      const speed = speeds[i];

      const swirl = t * 0.12 * speed + i * 0.25;

      const dist = Math.sqrt(baseX * baseX + baseZ * baseZ) + 0.0001;
      const swirlRadius = 6 + (dist % 22) * 1.2; // fills width

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
      {/* big glass shards (existing look) */}
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

// ==========================
//   Tiny multi-layer starfield
// ==========================

type TinyLayerConfig = {
  count: number;
  size: number;
  driftSpeed: number;
  twinkleSpeed: number;
  spreadX: number;
  spreadY: number;
  spreadZ: number;
};

const TinyLayer: FC<{ config: TinyLayerConfig }> = ({ config }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.PointsMaterial>(null!);

  const { basePositions, geometry } = useMemo(() => {
    const { count, spreadX, spreadY, spreadZ } = config;

    const basePositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      let x = (Math.random() - 0.5) * spreadX;
      let y = (Math.random() - 0.5) * spreadY;
      const z = (Math.random() - 0.5) * spreadZ;

      // avoid dense cluster exactly in center – nudge some outward
      if (Math.abs(x) < 5 && Math.abs(y) < 3) {
        const pushRadius = 5 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        x = Math.cos(angle) * pushRadius;
        y = Math.sin(angle) * pushRadius;
      }

      basePositions[idx] = x;
      basePositions[idx + 1] = y;
      basePositions[idx + 2] = z;

      // cool palette with rare warmer specks
      let hue = 0.60 + (Math.random() - 0.5) * 0.12; // blue / violet
      if (Math.random() < 0.08) {
        // 8% chance of warm accent
        hue = 0.04 + Math.random() * 0.09; // reddish / orange
      }
      const sat = 0.55 + Math.random() * 0.25;
      const light = 0.55 + Math.random() * 0.15;

      color.setHSL(hue, sat, light);
      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(basePositions.slice(), 3)
    );
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return { basePositions, geometry };
  }, [config]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const points = pointsRef.current;
    if (!points) return;

    const posAttr = points.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < config.count; i++) {
      const idx = i * 3;

      const bx = basePositions[idx];
      const by = basePositions[idx + 1];
      const bz = basePositions[idx + 2];

      const driftX =
        Math.sin(t * 0.35 * config.driftSpeed + i * 0.17) * 0.15;
      const driftY =
        Math.cos(t * 0.42 * config.driftSpeed + i * 0.23) * 0.18;

      arr[idx] = bx + driftX;
      arr[idx + 1] = by + driftY;
      arr[idx + 2] = bz;
    }

    posAttr.needsUpdate = true;

    if (materialRef.current) {
      // soft global twinkle for this layer
      const twinkle =
        1 + 0.25 * Math.sin(t * config.twinkleSpeed + config.size * 10);
      materialRef.current.size = config.size * twinkle;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        size={config.size}
        sizeAttenuation
        transparent
        depthWrite={false}
        vertexColors
      />
    </points>
  );
};

const TinyStarfield: FC = () => {
  return (
    <>
      {/* Far layer – very small, almost static */}
      <TinyLayer
        config={{
          count: 2500,
          size: 0.035,
          driftSpeed: 0.4,
          twinkleSpeed: 0.5,
          spreadX: 80,
          spreadY: 46,
          spreadZ: 40,
        }}
      />
      {/* Mid layer – regular stars */}
      <TinyLayer
        config={{
          count: 1800,
          size: 0.055,
          driftSpeed: 0.75,
          twinkleSpeed: 0.9,
          spreadX: 70,
          spreadY: 38,
          spreadZ: 30,
        }}
      />
      {/* Near layer – a few slightly bigger / brighter points */}
      <TinyLayer
        config={{
          count: 900,
          size: 0.08,
          driftSpeed: 1.2,
          twinkleSpeed: 1.4,
          spreadX: 60,
          spreadY: 32,
          spreadZ: 24,
        }}
      />
    </>
  );
};

// ==========================
//  Background wrapper
// ==========================
const ShardFieldBackground: FC = () => {
  return (
    <div
      className="shard-field-bg"
      style={{
        position: "fixed",
        inset: 0, // full viewport
        zIndex: 0, // behind everything
        pointerEvents: "none", // don't block clicks
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 55, position: [0, 0, 26] }}
      >
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 18, 60]} />

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

        {/* existing big streak shards */}
        <ShardField />

        {/* upgraded tiny multi-layer particles */}
        <TinyStarfield />
      </Canvas>
    </div>
  );
};

export default ShardFieldBackground;
