"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, ExternalLink, X } from "lucide-react";
import type { Product } from "@/data/products";
import { useMediaQuery } from "@/lib/hooks";

type Props = {
  product: Product;
  open: boolean;
  reduceMotion: boolean;
  onClose: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-white/10 py-3.5">
      <dt className="text-[11px] uppercase tracking-[0.28em] text-cream/50">
        {label}
      </dt>
      <dd className="text-right text-sm text-cream">
        {value || <span className="text-cream/40">Non communiqué</span>}
      </dd>
    </div>
  );
}

export default function ProductDrawer({
  product,
  open,
  reduceMotion,
  onClose,
}: Props) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  // Échap pour fermer, focus sur le bouton fermer, retour du focus ensuite.
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const id = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  const hidden = desktop ? { x: "100%" } : { y: "100%" };
  const shown = desktop ? { x: 0 } : { y: 0 };
  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, damping: 32, stiffness: 260 };

  const officialUrl = product.url || product.fallbackUrl;
  const officialLabel = product.url
    ? "Voir sur Louboutin.com"
    : "Voir la collection sur Louboutin.com";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={transition}
            drag={desktop || reduceMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[#0d0d10] text-cream shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:border-l md:border-t-0"
          >
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20 md:hidden" aria-hidden />

            <div className="flex items-start justify-between px-6 pt-5 md:px-10 md:pt-10">
              <p className="text-[11px] uppercase tracking-[0.35em] text-loubi-soft">
                Fiche modèle
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Fermer les détails"
                className="-mr-3 -mt-3 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 pb-[max(2rem,env(safe-area-inset-bottom))] md:px-10">
              <h2
                id="drawer-title"
                className="mt-2 font-serif text-5xl font-light uppercase leading-none"
              >
                {product.name}
              </h2>
              <p className="mt-3 text-sm text-cream/60">{product.tagline}</p>

              {product.toConfirm && (
                <div className="mt-6 flex gap-3 rounded-xl border border-amber-200/20 bg-amber-200/5 p-4 text-[13px] leading-relaxed text-cream/80">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" aria-hidden />
                  <div>
                    <p className="font-medium text-amber-100">Modèle à confirmer</p>
                    <p className="mt-1">{product.toConfirm.note}</p>
                  </div>
                </div>
              )}

              <dl className="mt-6">
                <Row label="Couleur" value={product.color} />
                <Row label="Matière" value={product.material} />
                <Row label="Talon" value={product.heelHeight} />
              </dl>

              {product.description && (
                <p className="mt-6 text-[15px] font-light leading-relaxed text-cream/80">
                  {product.description}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3">
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-loubi px-6 text-[11px] font-medium uppercase tracking-[0.25em] text-white transition-transform hover:scale-[1.02] active:scale-95"
                >
                  {officialLabel}
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
                {product.toConfirm?.candidateUrl && (
                  <a
                    href={product.toConfirm.candidateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-center text-[11px] uppercase tracking-[0.2em] text-cream/80 transition-colors hover:bg-white/5"
                  >
                    Piste : {product.toConfirm.candidateName}
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
