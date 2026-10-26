"use client";

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { products } from "@/data/products";

// Chargement : seul le premier modèle est préchargé immédiatement,
// les autres le sont en tâche de fond une fois le premier affiché.
const useModel = (url: string) => useGLTF(url, false, true);
useGLTF.preload(products[0].model, false, true);

function preloadRestWhenIdle() {
  const run = () =>
    products.slice(1).forEach((p) => useGLTF.preload(p.model, false, true));
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 1500);
  }
}

// Toutes les paires partagent le même cadrage : on normalise chaque modèle
// (centré, plus grande dimension = TARGET_SIZE, posé sur le sol).
const TARGET_SIZE = 2.2;
const FLOOR_Y = -0.62;
const IDLE_SPEED = 0.35; // rad/s
const RESUME_DELAY = 3000;
const SLIDE_DISTANCE = 4.5;

function Shoe({ url, onReady }: { url: string; onReady?: () => void }) {
  const { scene } = useModel(url);

  const { offset, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = TARGET_SIZE / Math.max(size.x, size.y, size.z);
    return {
      scale: s,
      offset: new THREE.Vector3(
        -center.x * s,
        -box.min.y * s + FLOOR_Y,
        -center.z * s,
      ),
    };
  }, [scene]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <group position={offset} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

type StageProps = {
  index: number;
  direction: 1 | -1;
  reduceMotion: boolean;
  interacting: React.RefObject<boolean>;
  onReady: () => void;
  onOpen: () => void;
};

/** Gère la sortie / entrée animée des talons et la rotation au repos. */
function Stage({
  index,
  direction,
  reduceMotion,
  interacting,
  onReady,
  onOpen,
}: StageProps) {
  const slide = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const [shown, setShown] = useState(index);
  const phase = useRef<"idle" | "out" | "in">("idle");
  const dir = useRef(direction);
  const firstReady = useRef(false);
  const { gl } = useThree();

  useEffect(() => {
    if (index === shown) return;
    dir.current = direction;
    if (reduceMotion) {
      setShown(index);
      return;
    }
    phase.current = "out";
  }, [index, shown, direction, reduceMotion]);

  useFrame((_, dt) => {
    const g = slide.current;
    const s = spin.current;
    if (!g || !s) return;
    const k = 1 - Math.exp(-dt * 7);

    if (phase.current === "out") {
      const tx = -dir.current * SLIDE_DISTANCE;
      g.position.x += (tx - g.position.x) * k;
      g.rotation.y += (-dir.current * 1.2 - g.rotation.y) * k;
      if (Math.abs(tx - g.position.x) < 0.25) {
        setShown(index);
        g.position.x = dir.current * SLIDE_DISTANCE;
        g.rotation.y = dir.current * 1.2;
        phase.current = "in";
      }
    } else if (phase.current === "in") {
      g.position.x += (0 - g.position.x) * k;
      g.rotation.y += (0 - g.rotation.y) * k;
      if (Math.abs(g.position.x) < 0.002) {
        g.position.x = 0;
        g.rotation.y = 0;
        phase.current = "idle";
      }
    }

    if (!reduceMotion && !interacting.current) {
      s.rotation.y += dt * IDLE_SPEED;
    }
  });

  const handleReady = () => {
    if (firstReady.current) return;
    firstReady.current = true;
    onReady();
    preloadRestWhenIdle();
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Un glisser pour faire pivoter ne doit pas ouvrir le panneau.
    if (e.delta > 6) return;
    e.stopPropagation();
    onOpen();
  };

  return (
    <group ref={slide}>
      <group
        ref={spin}
        rotation={[0, -0.6, 0]}
        onClick={handleClick}
        onPointerOver={() => (gl.domElement.style.cursor = "pointer")}
        onPointerOut={() => (gl.domElement.style.cursor = "grab")}
      >
        <Suspense fallback={null}>
          <Shoe url={products[shown].model} onReady={handleReady} />
        </Suspense>
      </group>
    </group>
  );
}

/** Studio sans fichier HDR externe : tout est généré localement. */
function StudioLights() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer intensity={2.2} position={[0, 4, 2]} scale={[8, 2, 1]} />
      <Lightformer intensity={1.4} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer intensity={1.4} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer intensity={0.8} position={[0, 1, -5]} scale={[10, 3, 1]} />
      <Lightformer form="ring" intensity={3} position={[2, 3, 4]} scale={1.2} />
    </Environment>
  );
}

// Distance caméra de référence (cadrage paysage). En portrait, on recule
// la caméra pour que la paire tienne dans la largeur de l'écran.
const BASE_DISTANCE = 5.3;
const MIN_DISTANCE = 3.4;
const MAX_DISTANCE = 6.5;
const fitFactor = (aspect: number) => (aspect >= 1.2 ? 1 : 1.2 / aspect);

/** Contrôles : rotation libre à l'horizontale, limitée à la verticale. */
function Controls({
  interacting,
  allowPinchZoom,
}: {
  interacting: React.RefObject<boolean>;
  allowPinchZoom: boolean;
}) {
  const ref = useRef<OrbitControlsImpl>(null);
  const { gl, camera, size } = useThree();
  const timer = useRef<number | undefined>(undefined);
  const fit = fitFactor(size.width / size.height);

  useEffect(() => {
    const target = ref.current?.target ?? new THREE.Vector3(0, -0.1, 0);
    const v = camera.position.clone().sub(target);
    camera.position.copy(target).add(v.setLength(BASE_DISTANCE * fit));
    ref.current?.update();
  }, [fit, camera]);

  // OrbitControls force touch-action: none, ce qui bloquerait le scroll
  // de la page au doigt. pan-y laisse le navigateur gérer le défilement
  // vertical, et les gestes horizontaux font pivoter le talon.
  useLayoutEffect(() => {
    const el = gl.domElement;
    const id = requestAnimationFrame(() => {
      el.style.touchAction = "pan-y";
      el.style.cursor = "grab";
    });
    return () => cancelAnimationFrame(id);
  }, [gl]);

  // Zoom à la souris uniquement avec Ctrl/⌘ (ou pincement trackpad) :
  // la molette seule continue de faire défiler la page.
  useEffect(() => {
    const el = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const target = ref.current?.target ?? new THREE.Vector3();
      const v = camera.position.clone().sub(target);
      const len = THREE.MathUtils.clamp(
        v.length() * (1 + e.deltaY * 0.002),
        MIN_DISTANCE * fit,
        MAX_DISTANCE * fit,
      );
      camera.position.copy(target).add(v.setLength(len));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gl, camera, fit]);

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableZoom={allowPinchZoom}
      minDistance={MIN_DISTANCE * fit}
      maxDistance={MAX_DISTANCE * fit}
      minPolarAngle={Math.PI * 0.28}
      maxPolarAngle={Math.PI * 0.52}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      target={[0, -0.1, 0]}
      onStart={() => {
        window.clearTimeout(timer.current);
        interacting.current = true;
        gl.domElement.style.cursor = "grabbing";
      }}
      onEnd={() => {
        gl.domElement.style.cursor = "grab";
        timer.current = window.setTimeout(() => {
          interacting.current = false;
        }, RESUME_DELAY);
      }}
    />
  );
}

/** Remonte la progression réelle du chargement (pour le préchargement). */
function ProgressReporter({ onProgress }: { onProgress: (p: number) => void }) {
  const { progress } = useProgress();
  useEffect(() => onProgress(progress), [progress, onProgress]);
  return null;
}

export type ShoeViewerProps = {
  index: number;
  direction: 1 | -1;
  reduceMotion: boolean;
  /** Le hero est visible : sinon on coupe le rendu pour économiser la batterie */
  active: boolean;
  coarsePointer: boolean;
  onReady: () => void;
  onProgress: (progress: number) => void;
  onOpen: () => void;
  onInteract: () => void;
};

export default function ShoeViewer({
  index,
  direction,
  reduceMotion,
  active,
  coarsePointer,
  onReady,
  onProgress,
  onOpen,
  onInteract,
}: ShoeViewerProps) {
  const interacting = useRef(false);
  const [dpr, setDpr] = useState(1.5);

  return (
    <>
    <ProgressReporter onProgress={onProgress} />
    <Canvas
      dpr={[1, dpr]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [3.6, 1.5, 3.6], fov: 32, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.setClearColor(0x000000, 0);
      }}
      onPointerDown={onInteract}
      aria-label="Talon en 3D. Faites glisser pour le faire pivoter, touchez-le pour voir les détails."
      role="img"
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(2)}
      />
      <StudioLights />
      <Stage
        index={index}
        direction={direction}
        reduceMotion={reduceMotion}
        interacting={interacting}
        onReady={onReady}
        onOpen={onOpen}
      />
      <ContactShadows
        position={[0, FLOOR_Y - 0.001, 0]}
        opacity={0.55}
        scale={7}
        blur={2.4}
        far={2}
        resolution={256}
        color="#000000"
      />
      <Controls interacting={interacting} allowPinchZoom={coarsePointer} />
    </Canvas>
    </>
  );
}
