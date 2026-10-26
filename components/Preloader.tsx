"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import heelAnimation from "@/lib/heel-lottie.json";

// Lottie est chargé à part pour ne pas alourdir le bundle initial.
const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

const MIN_DURATION = 1500;
// Filet de sécurité : on ne bloque jamais le visiteur plus longtemps.
const MAX_DURATION = 15000;
const STORAGE_KEY = "cl-preloaded";

type Props = {
  /** Le premier modèle 3D est affiché (ou WebGL indisponible) */
  sceneReady: boolean;
  /** Progression du chargement 3D (0-100), remontée par le visualiseur */
  loaderProgress: number;
  onDone: () => void;
};

export default function Preloader({ sceneReady, loaderProgress, onDone }: Props) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [display, setDisplay] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const start = useRef(0);
  const doneRef = useRef(false);

  // Déjà vu dans la session : le script du <head> a masqué le préchargement.
  useEffect(() => {
    start.current = performance.now();
    if (document.documentElement.dataset.preloaded === "1") {
      setVisible(false);
      doneRef.current = true;
      onDone();
      return;
    }
    document.fonts?.ready.then(() => setFontsReady(true));
    const t = window.setTimeout(() => setTimedOut(true), MAX_DURATION);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll bloqué tant que le préchargement est affiché.
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [visible]);

  // Pourcentage réel : modèle 3D (85 %) + polices (15 %).
  const modelPart = sceneReady ? 100 : Math.min(loaderProgress, 99);
  const target =
    timedOut ? 100 : Math.round(modelPart * 0.85 + (fontsReady ? 15 : 0));

  // Le compteur rattrape la cible en douceur et ne recule jamais.
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    const tick = () => {
      setDisplay((d) => {
        if (d >= target) return d;
        return Math.min(target, d + Math.max(1, (target - d) * 0.12));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, visible]);

  useEffect(() => {
    if (doneRef.current || display < 100) return;
    const wait = Math.max(0, MIN_DURATION - (performance.now() - start.current));
    const t = window.setTimeout(() => {
      doneRef.current = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // stockage indisponible : le préchargement réapparaîtra, sans gravité
      }
      setVisible(false);
      onDone();
    }, wait);
    return () => window.clearTimeout(t);
  }, [display, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-preloader
          key="preloader"
          role="status"
          aria-live="polite"
          aria-label={`Chargement de la collection : ${Math.floor(display)} %`}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050506] text-cream"
          initial={false}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.3 } }
              : {
                  clipPath: "inset(0% 0% 100% 0%)",
                  transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
                }
          }
          style={{ clipPath: "inset(0% 0% 0% 0%)" }}
        >
          <div className="w-44 sm:w-56" aria-hidden>
            <Lottie
              animationData={heelAnimation}
              loop={!reduceMotion}
              autoplay
            />
          </div>

          <div className="mt-6 font-serif text-6xl font-light tabular-nums tracking-tight sm:text-7xl">
            {Math.floor(display)}
            <span className="ml-1 align-top text-2xl text-loubi">%</span>
          </div>

          <div className="mt-6 h-px w-40 overflow-hidden bg-white/10">
            <div
              className="h-full bg-loubi transition-[width] duration-200"
              style={{ width: `${display}%` }}
            />
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.35em] text-cream/60">
            Chargement de la collection
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
