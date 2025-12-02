// src/components/WelcomeOverlay.tsx
import {
  FC,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ======================
//  Outer white glass shard ring (anticlockwise)
// ======================

type GlassShardRingProps = {
  scrollProgress: number;
};

const GlassShardRing: FC<GlassShardRingProps> = ({ scrollProgress }) => {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const arrivalRef = useRef(0);
  const scrollRef = useRef(0);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  const {
    shardGeometry,
    startPositions,
    targetPositions,
    baseRotations,
    baseScaleX,
    baseScaleY,
    modes,
    ringBaseAngle,
    ringRadiusArray,
    ringYOffset,
    ringOrbitSpeed,
    ringZOffset,
  } = useMemo(() => {
    const count = 1600;

    const shardGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      0.16, -0.04, 0,
      -0.03, 0.11, 0,
    ]);
    shardGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    shardGeometry.computeVertexNormals();

    const startPositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const baseRotations = new Float32Array(count);
    const baseScaleX = new Float32Array(count);
    const baseScaleY = new Float32Array(count);
    const modes = new Uint8Array(count);

    const ringBaseAngle = new Float32Array(count);
    const ringRadiusArray = new Float32Array(count);
    const ringYOffset = new Float32Array(count);
    const ringOrbitSpeed = new Float32Array(count);
    const ringZOffset = new Float32Array(count);

    const outerMin = 3.4;
    const outerMax = 7.2;

    const ringRadius = 2.0;
    const ringThickness = 0.5;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // start: big outer shell
      const startAngle = Math.random() * Math.PI * 2;
      const startRadius =
        outerMin + Math.random() * (outerMax - outerMin);
      const sx = Math.cos(startAngle) * startRadius;
      const sy = Math.sin(startAngle) * startRadius;
      const sz = (Math.random() - 0.5) * 4.2;

      startPositions[idx] = sx;
      startPositions[idx + 1] = sy;
      startPositions[idx + 2] = sz;

      const isRing = Math.random() < 0.7;
      modes[i] = isRing ? 0 : 1;

      if (isRing) {
        // target: inner white ring
        const angle = Math.random() * Math.PI * 2;
        const jitterRadius = (Math.random() - 0.5) * ringThickness;
        const r = ringRadius + jitterRadius;

        const yOff = (Math.random() - 0.5) * 0.22;
        const zOff = (Math.random() - 0.5) * 0.4;

        const tx = Math.cos(angle) * r;
        const ty = Math.sin(angle) * r + yOff;
        const tz = zOff;

        targetPositions[idx] = tx;
        targetPositions[idx + 1] = ty;
        targetPositions[idx + 2] = tz;

        ringBaseAngle[i] = angle;
        ringRadiusArray[i] = r;
        ringYOffset[i] = yOff;
        ringZOffset[i] = zOff;

        // white ring = ANTICLOCKWISE
        ringOrbitSpeed[i] = -(0.08 + Math.random() * 0.12);
      } else {
        // scattered targets
        const tx = (Math.random() - 0.5) * 12;
        const ty = (Math.random() - 0.5) * 12;
        const tz = (Math.random() - 0.5) * 5.0;

        targetPositions[idx] = tx;
        targetPositions[idx + 1] = ty;
        targetPositions[idx + 2] = tz;
      }

      baseRotations[i] = Math.random() * Math.PI * 2;
      baseScaleX[i] = 0.22 + Math.random() * 0.3;
      baseScaleY[i] = 0.28 + Math.random() * 0.38;
    }

    return {
      shardGeometry,
      startPositions,
      targetPositions,
      baseRotations,
      baseScaleX,
      baseScaleY,
      modes,
      ringBaseAngle,
      ringRadiusArray,
      ringYOffset,
      ringOrbitSpeed,
      ringZOffset,
    };
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (arrivalRef.current < 1) {
      arrivalRef.current += delta * 0.35;
      if (arrivalRef.current > 1) arrivalRef.current = 1;
    }

    const back = scrollRef.current;
    const formation = arrivalRef.current * (1 - back);

    const tmpMatrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    const time = state.clock.getElapsedTime();
    const count = baseRotations.length;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const sx = startPositions[idx];
      const sy = startPositions[idx + 1];
      const sz = startPositions[idx + 2];

      let tx: number;
      let ty: number;
      let tz: number;

      const modeFormation =
        modes[i] === 0 ? formation : formation * 0.65;

      if (modes[i] === 0) {
        const baseAngle = ringBaseAngle[i];
        const radius = ringRadiusArray[i];
        const orbitSpeed = ringOrbitSpeed[i];

        const angle = baseAngle + orbitSpeed * time;

        tx = Math.cos(angle) * radius;
        ty = Math.sin(angle) * radius + ringYOffset[i];
        tz = ringZOffset[i];
      } else {
        tx = targetPositions[idx];
        ty = targetPositions[idx + 1];
        tz = targetPositions[idx + 2];
      }

      pos.set(
        sx + (tx - sx) * modeFormation,
        sy + (ty - sy) * modeFormation,
        sz + (tz - sz) * modeFormation
      );

      const wobble = 0.07 * Math.sin(time * 1.9 + i * 0.29);
      pos.multiplyScalar(1 + wobble * (1 - back));

      const spin =
        baseRotations[i] +
        time * (0.7 + (i % 5) * 0.11) * (i % 2 ? 1 : -1);
      quat.setFromEuler(new THREE.Euler(0, 0, spin));

      const sxScale = baseScaleX[i] * 0.6;
      const syScale = baseScaleY[i] * 0.6;
      scl.set(sxScale, syScale, 1);

      tmpMatrix.compose(pos, quat, scl);
      mesh.setMatrixAt(i, tmpMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity =
      0.9 * (0.4 + 0.6 * arrivalRef.current) * (1 - back);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[shardGeometry, undefined as any, baseRotations.length]}
    >
      <meshBasicMaterial
        color="#e5f3ff"
        transparent
        opacity={0.9}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

// ======================
//  BLUE ring shards (clockwise, BRIGHT)
// ======================

type GoldRingProps = {
  scrollProgress: number;
};

const GoldRingShards: FC<GoldRingProps> = ({ scrollProgress }) => {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const arrivalRef = useRef(0);
  const scrollRef = useRef(scrollProgress);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  const {
    shardGeometry,
    startPositions,
    ringBaseAngle,
    ringRadiusArray,
    ringYOffset,
    ringOrbitSpeed,
    ringZOffset,
    baseRotations,
    baseScaleX,
    baseScaleY,
  } = useMemo(() => {
    const count = 1200;

    const shardGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      0.16, -0.04, 0,
      -0.03, 0.11, 0,
    ]);
    shardGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    shardGeometry.computeVertexNormals();

    const startPositions = new Float32Array(count * 3);
    const ringBaseAngle = new Float32Array(count);
    const ringRadiusArray = new Float32Array(count);
    const ringYOffset = new Float32Array(count);
    const ringOrbitSpeed = new Float32Array(count);
    const ringZOffset = new Float32Array(count);
    const baseRotations = new Float32Array(count);
    const baseScaleX = new Float32Array(count);
    const baseScaleY = new Float32Array(count);

    const outerMin = 3.4;
    const outerMax = 7.2;

    const ringRadius = 2.0;
    const ringThickness = 0.5;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const startAngle = Math.random() * Math.PI * 2;
      const startRadius =
        outerMin + Math.random() * (outerMax - outerMin);
      const sx = Math.cos(startAngle) * startRadius;
      const sy = Math.sin(startAngle) * startRadius;
      const sz = (Math.random() - 0.5) * 4.2;

      startPositions[idx] = sx;
      startPositions[idx + 1] = sy;
      startPositions[idx + 2] = sz;

      const angle = Math.random() * Math.PI * 2;
      const jitterRadius = (Math.random() - 0.5) * ringThickness;
      const r = ringRadius + jitterRadius;

      const yOff = (Math.random() - 0.5) * 0.22;
      const zOff = (Math.random() - 0.5) * 0.4;

      ringBaseAngle[i] = angle;
      ringRadiusArray[i] = r;
      ringYOffset[i] = yOff;
      ringZOffset[i] = zOff;

      // blue ring = CLOCKWISE
      ringOrbitSpeed[i] = 0.1 + Math.random() * 0.16;

      baseRotations[i] = Math.random() * Math.PI * 2;
      baseScaleX[i] = 0.24 + Math.random() * 0.32;
      baseScaleY[i] = 0.30 + Math.random() * 0.40;
    }

    return {
      shardGeometry,
      startPositions,
      ringBaseAngle,
      ringRadiusArray,
      ringYOffset,
      ringOrbitSpeed,
      ringZOffset,
      baseRotations,
      baseScaleX,
      baseScaleY,
    };
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (arrivalRef.current < 1) {
      arrivalRef.current += delta * 0.35;
      if (arrivalRef.current > 1) arrivalRef.current = 1;
    }

    const back = scrollRef.current;
    const formation = arrivalRef.current * (1 - back);

    const tmpMatrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    const time = state.clock.getElapsedTime();
    const count = baseRotations.length;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const sx = startPositions[idx];
      const sy = startPositions[idx + 1];
      const sz = startPositions[idx + 2];

      const baseAngle = ringBaseAngle[i];
      const radius = ringRadiusArray[i];
      const orbitSpeed = ringOrbitSpeed[i];

      const angle = baseAngle + orbitSpeed * time;

      const tx = Math.cos(angle) * radius;
      const ty = Math.sin(angle) * radius + ringYOffset[i];
      const tz = ringZOffset[i];

      pos.set(
        sx + (tx - sx) * formation,
        sy + (ty - sy) * formation,
        sz + (tz - sz) * formation
      );

      const wobble = 0.06 * Math.sin(time * 1.7 + i * 0.33);
      pos.multiplyScalar(1 + wobble * (1 - back));

      const spin =
        baseRotations[i] +
        time * (0.7 + (i % 5) * 0.11) * (i % 2 ? 1 : -1);
      quat.setFromEuler(new THREE.Euler(0, 0, spin));

      const sxScale = baseScaleX[i] * 0.58;
      const syScale = baseScaleY[i] * 0.58;
      scl.set(sxScale, syScale, 1);

      tmpMatrix.compose(pos, quat, scl);
      mesh.setMatrixAt(i, tmpMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    const mat = mesh.material as THREE.MeshBasicMaterial;
    const scrollFade = 1 - back * 0.25;
    mat.opacity =
      1.0 * (0.5 + 0.5 * arrivalRef.current) * scrollFade;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[shardGeometry, undefined as any, baseRotations.length]}
    >
      {/* BLUE RING COLOR */}
      <meshBasicMaterial
        color="rgba(2, 87, 143, 1)" // bright blue
        transparent
        opacity={0.6}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

// ======================
//  ASK-PAFIAST text made of shards
// ======================

type TextShardProps = {
  scrollProgress: number;
};

const TextShards: FC<TextShardProps> = ({ scrollProgress }) => {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const arrivalRef = useRef(0);
  const scrollRef = useRef(scrollProgress);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  const {
    shardGeometry,
    startPositions,
    targetPositions,
    baseRotations,
    baseScale,
  } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 260;
    const ctx = canvas.getContext("2d");

    const textPositions: { x: number; y: number }[] = [];

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 120px Poppins, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText("ASK-PAFIAST", canvas.width / 2, canvas.height / 2);

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      const data = imageData.data;

      const step = 2;

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const idx = (y * canvas.width + x) * 4;
          const alpha = data[idx + 3];
          if (alpha > 128) {
            textPositions.push({ x, y });
          }
        }
      }
    }

    const safeTextCount = textPositions.length || 1;
    const count = Math.min(4000, safeTextCount);

    const shardGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      0.16, -0.04, 0,
      -0.03, 0.11, 0,
    ]);
    shardGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    shardGeometry.computeVertexNormals();

    const startPositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const baseRotations = new Float32Array(count);
    const baseScale = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const angle = Math.random() * Math.PI * 2;
      const radius = 4.0 + Math.random() * 3.8;
      const sx = Math.cos(angle) * radius;
      const sy = Math.sin(angle) * radius;
      const sz = (Math.random() - 0.5) * 3.0;

      startPositions[idx] = sx;
      startPositions[idx + 1] = sy;
      startPositions[idx + 2] = sz;

      const sampleIndex = Math.floor((i / count) * safeTextCount);
      const p =
        textPositions[sampleIndex] || {
          x: canvas.width / 2,
          y: canvas.height / 2,
        };

      const nx =
        (p.x - canvas.width / 2) / canvas.width;
      const ny =
        (p.y - canvas.height / 2) / canvas.height;

      const scaleX = 2.6;
      const scaleY = 1.5;

      const tx = nx * scaleX;
      const ty = -ny * scaleY - 0.03;
      const tz = (Math.random() - 0.5) * 0.06;

      targetPositions[idx] = tx;
      targetPositions[idx + 1] = ty;
      targetPositions[idx + 2] = tz;

      baseRotations[i] = Math.random() * Math.PI * 2;
      baseScale[i] = 0.065 + Math.random() * 0.03;
    }

    return {
      shardGeometry,
      startPositions,
      targetPositions,
      baseRotations,
      baseScale,
    };
  }, []);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (arrivalRef.current < 1) {
      arrivalRef.current += delta * 0.25;
      if (arrivalRef.current > 1) arrivalRef.current = 1;
    }

    const back = scrollRef.current;
    const formation = arrivalRef.current * (1 - back);

    const tmpMatrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    const time = state.clock.getElapsedTime();
    const count = baseRotations.length;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const sx = startPositions[idx];
      const sy = startPositions[idx + 1];
      const sz = startPositions[idx + 2];

      const tx = targetPositions[idx];
      const ty = targetPositions[idx + 1];
      const tz = targetPositions[idx + 2];

      pos.set(
        sx + (tx - sx) * formation,
        sy + (ty - sy) * formation,
        sz + (tz - sz) * formation
      );

      const wobbleAmp = 0.012;
      const wobble =
        wobbleAmp *
        Math.sin(time * 1.2 + i * 0.37) *
        (1 - back);

      pos.x += wobble * 0.8;
      pos.y += wobble * 0.45;

      const spin =
        baseRotations[i] +
        time * (0.22 + (i % 7) * 0.015) * (i % 2 ? 1 : -1);
      quat.setFromEuler(new THREE.Euler(0, 0, spin));

      const s = baseScale[i];
      scl.set(s, s, 1);

      tmpMatrix.compose(pos, quat, scl);
      mesh.setMatrixAt(i, tmpMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity =
      0.97 * (0.6 + 0.4 * arrivalRef.current) * (1 - back);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[shardGeometry, undefined as any, baseRotations.length]}
    >
      <meshBasicMaterial
        color="#a5b4fc"
        transparent
        opacity={0.97}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

// ======================
// Ambient screen shards (LOTS of small ones)
// ======================

type AmbientShardsProps = {
  scrollProgress: number;
};

const AmbientShards: FC<AmbientShardsProps> = ({ scrollProgress }) => {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const arrivalRef = useRef(0);
  const scrollRef = useRef(scrollProgress);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  const {
    shardGeometry,
    basePositions,
    baseRotations,
    baseScale,
  } = useMemo(() => {
    const count = 82000;

    const shardGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0,
      0.16, -0.04, 0,
      -0.03, 0.11, 0,
    ]);
    shardGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(vertices, 3)
    );
    shardGeometry.computeVertexNormals();

    const basePositions = new Float32Array(count * 3);
    const baseRotations = new Float32Array(count);
    const baseScale = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 8;

      basePositions[idx] = x;
      basePositions[idx + 1] = y;
      basePositions[idx + 2] = z;

      baseRotations[i] = Math.random() * Math.PI * 2;

      const r = Math.random();
      if (r < 0.05) {
        baseScale[i] = 0.16 + Math.random() * 0.18; // medium
      } else {
        baseScale[i] = 0.03 + Math.random() * 0.02; // tiny
      }
    }

    return {
      shardGeometry,
      basePositions,
      baseRotations,
      baseScale,
    };
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (arrivalRef.current < 1) {
      arrivalRef.current += 0.4 * state.clock.getDelta();
      if (arrivalRef.current > 1) arrivalRef.current = 1;
    }

    const back = scrollRef.current;
    const t = state.clock.getElapsedTime();

    const tmpMatrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();

    const count = baseRotations.length;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      const bx = basePositions[idx];
      const by = basePositions[idx + 1];
      const bz = basePositions[idx + 2];

      const driftX = Math.sin(t * 0.08 + i * 0.17) * 0.35;
      const driftY = Math.cos(t * 0.1 + i * 0.23) * 0.28;

      pos.set(
        bx + driftX * arrivalRef.current,
        by + driftY * arrivalRef.current,
        bz
      );

      const spin =
        baseRotations[i] +
        t * (0.12 + (i % 5) * 0.02) * (i % 2 ? 1 : -1);
      quat.setFromEuler(new THREE.Euler(0, 0, spin));

      const s = baseScale[i];
      scl.set(s, s, 1);

      tmpMatrix.compose(pos, quat, scl);
      mesh.setMatrixAt(i, tmpMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    const mat = mesh.material as THREE.MeshBasicMaterial;
    const fade = 1 - back * 0.6;
    mat.opacity = 0.65 * fade;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[shardGeometry, undefined as any, baseRotations.length]}
    >
      <meshBasicMaterial
        color="#e5f3ff"
        transparent
        opacity={0.65}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

// ======================
//   Scene + Overlay
// ======================

type GlassPortalSceneProps = {
  scrollProgress: number;
};

const GlassPortalScene: FC<GlassPortalSceneProps> = ({
  scrollProgress,
}) => {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.6]}>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.45} />
      <spotLight
        position={[3, 6, 5]}
        intensity={1.2}
        angle={0.6}
        penumbra={0.5}
        color={"#7dd3fc"}
      />
      <pointLight
        position={[-4, -3, 4]}
        intensity={0.8}
        color={"#a855f7"}
      />

      <group rotation={[0, 0, 0]}>
        <AmbientShards scrollProgress={scrollProgress} />
        <GlassShardRing scrollProgress={scrollProgress} />
        <GoldRingShards scrollProgress={scrollProgress} />
        <TextShards scrollProgress={scrollProgress} />
      </group>
    </Canvas>
  );
};

const WelcomeOverlay: FC = () => {
  // ✅ Only show if not seen before (per browser tab)
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const seen = sessionStorage.getItem("askpaf_welcome_seen");
    return !seen;
  });

  const [scrollProgress, setScrollProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!isVisible) return;
    if (typeof window === "undefined") return;

    // ✅ Mark as seen immediately so even if user leaves early,
    // coming back (Back button) won't ever show this overlay again.
    sessionStorage.setItem("askpaf_welcome_seen", "true");

    window.scrollTo({ top: 0, behavior: "auto" });

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleWheel = (e: WheelEvent | any) => {
      // Block real page scroll while overlay is active
      e.preventDefault();

      const delta = e.deltaY || 0;
      const dir = delta > 0 ? 1 : -1;
      const sensitivity = 0.0012;

      progressRef.current = Math.min(
        1,
        Math.max(0, progressRef.current + dir * Math.abs(delta) * sensitivity)
      );
      setScrollProgress(progressRef.current);

      // When finished → hide (but it's already marked as seen)
      if (progressRef.current >= 1) {
        setIsVisible(false);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("wheel", handleWheel);
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("wheel", handleWheel);
    };
  }, [isVisible]);

  // 🔹 If already seen → overlay never renders again
  if (!isVisible) return null;

  return (
    <div
      id="welcome-overlay"
      style={{
        opacity: 1 - scrollProgress,
        transform: `translateY(${scrollProgress * 30}px)`,
        pointerEvents: scrollProgress >= 1 ? "none" : "auto",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      <div className="welcome-canvas-wrapper">
        <GlassPortalScene scrollProgress={scrollProgress} />
      </div>

      {/* bottom arrow */}
      <div className="welcome-overlay-text">
        <div className="scroll-arrow-wrapper">
          <div className="scroll-arrow" />
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
