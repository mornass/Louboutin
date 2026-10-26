"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Rotate3d } from "lucide-react";
import { products } from "@/data/products";
import { useMediaQuery, useWebGLSupport } from "@/lib/hooks";

const ShoeViewer = dynamic(() => import("./ShoeViewer"), { ssr: false });

type Props = {
  index: number;
  direction: 1 | -1;
  reduceMotion: boolean;
  drawerOpen: boolean;
  onChange: (next: number) => void;
  onOpen: () => void;
  onSceneReady: () => void;
  onProgress: (progress: number) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

export default function ShoeCarousel({
  index,
  direction,
  reduceMotion,
  drawerOpen,
  onChange,
  onOpen,
  onSceneReady,
  onProgress,
}: Props) {
  const product = products[index];
  const total = products.length;
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.15 });
  const webgl = useWebGLSupport();
  const coarse = useMediaQuery("(pointer: coarse)");
  const [hinted, setHinted] = useState(false);
  // On laisse d'abord le navigateur peindre la page (LCP), puis on monte
  // le Canvas 3D et on lance le chargement du premier modèle.
  const [mountGL, setMountGL] = useState(false);
  useEffect(() => {
    if (!webgl) return;
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setMountGL(true), { timeout: 800 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMountGL(true), 200);
    return () => clearTimeout(id);
  }, [webgl]);

  const prev = () => onChange((index - 1 + total) % total);
  const next = () => onChange((index + 1) % total);

  // Sans WebGL, rien à charger : on libère le préchargement.
  useEffect(() => {
    if (webgl === false) onSceneReady();
  }, [webgl, onSceneReady]);

  // Flèches du clavier quand le hero est à l'écran.
  useEffect(() => {
    if (!inView || drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const t = reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };
  const { base, glow, ink, accent } = product.ambiance;

  return (
    <section
      id="collection"
      ref={sectionRef}
      aria-roledescription="carrousel"
      aria-label="Collection d'escarpins en 3D"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
      style={{ color: ink }}
    >
      {/* Fond d'ambiance : couleur + halo radial, en fondu à chaque slide */}
      <motion.div
        aria-hidden
        className="absolute inset-0 -z-10"
        initial={false}
        animate={{
          background: `radial-gradient(70% 55% at 50% 52%, ${glow} 0%, ${base} 72%)`,
        }}
        transition={{ duration: reduceMotion ? 0 : 1.1, ease: "easeInOut" }}
      />

      {/* Titre géant derrière le talon */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[16svh] -z-[5] flex justify-center overflow-hidden sm:top-[14svh]"
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span
            key={product.heroWord}
            custom={direction}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 40 }}
            animate={{ opacity: 0.14, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -40 }}
            transition={t}
            className="whitespace-nowrap font-serif text-[30vw] font-light uppercase leading-none tracking-[-0.03em] sm:text-[22vw]"
          >
            {product.heroWord}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Zone 3D. Les marges latérales restent libres pour scroller au doigt. */}
      <div className="relative mx-auto mt-[10svh] h-[50svh] w-full max-w-5xl px-6 sm:mt-[10svh] sm:h-[60svh]">
        {webgl === false ? (
          <button
            type="button"
            onClick={onOpen}
            className="relative block h-full w-full"
            aria-label={`Voir les détails : ${product.name}, ${product.color}`}
          >
            <Image
              src={product.image}
              alt={`${product.name}, ${product.color}`}
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-contain"
              priority
            />
          </button>
        ) : (
          webgl && mountGL && (
            <ShoeViewer
              index={index}
              direction={direction}
              reduceMotion={reduceMotion}
              active={inView && !drawerOpen}
              coarsePointer={coarse}
              onReady={onSceneReady}
              onProgress={onProgress}
              onOpen={onOpen}
              onInteract={() => setHinted(true)}
            />
          )
        )}

        <AnimatePresence>
          {webgl && !hinted && (
            <motion.div
              aria-hidden
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: reduceMotion ? 0 : 1.2, duration: 0.6 }}
              className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-current/20 bg-black/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.3em] backdrop-blur-sm"
            >
              <motion.span
                animate={reduceMotion ? undefined : { rotate: [0, 25, -25, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex"
              >
                <Rotate3d className="h-3.5 w-3.5" />
              </motion.span>
              Faites pivoter
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barre d'informations : swipe horizontal sur mobile */}
      <motion.div
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -50) next();
          else if (info.offset.x > 50) prev();
        }}
        className="relative mx-auto mt-auto w-full max-w-6xl touch-pan-y px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 sm:pb-10"
      >
        <div className="mb-4 h-px w-full sm:mb-5" style={{ background: `${ink}26` }} />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p
              className="mb-2 text-[11px] uppercase tracking-[0.35em] tabular-nums"
              aria-live="polite"
            >
              <span className="font-medium">{pad(index + 1)}</span>
              <span className="opacity-50"> / {pad(total)}</span>
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.45 }}
              >
                <h1 className="font-serif text-4xl font-light uppercase leading-[0.95] tracking-[0.02em] sm:text-6xl">
                  {product.name}
                </h1>
                <p className="mt-2 text-sm font-light opacity-75">
                  {product.tagline}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:flex-nowrap sm:justify-end">
            <div className="-ml-2 flex items-center" role="tablist" aria-label="Choisir un modèle">
              {products.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`${p.name}, ${p.color}`}
                  onClick={() => onChange(i)}
                  className="flex h-11 w-7 items-center justify-center"
                >
                  <span
                    className="block h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: i === index ? 20 : 6,
                      background: i === index ? accent : `${ink}55`,
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Modèle précédent"
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-current/10"
                style={{ borderColor: `${ink}40` }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Modèle suivant"
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors hover:bg-current/10"
                style={{ borderColor: `${ink}40` }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onOpen}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[11px] font-medium uppercase tracking-[0.25em] text-white transition-transform hover:scale-[1.03] active:scale-95 sm:ml-1 sm:h-11 sm:w-auto"
              style={{ background: accent }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Découvrir
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
