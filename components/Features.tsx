"use client";

import { motion, useReducedMotion } from "motion/react";
import { Footprints, History, Ruler, Sparkles } from "lucide-react";

// Textes factuels, d'après les fiches et la page Kate du site officiel.
const features = [
  {
    icon: Footprints,
    title: "La semelle rouge",
    text: "Signature de la Maison, la semelle rouge Loubi se dévoile à chaque pas. Elle est désormais revêtue d'Everlasting Red, un traitement conçu pour préserver sa couleur.",
  },
  {
    icon: Sparkles,
    title: "Le vernis",
    text: "Le Kate est réalisé en cuir de veau verni : une surface miroir qui accroche la lumière et souligne la ligne pointue de l'escarpin.",
  },
  {
    icon: History,
    title: "Une icône",
    text: "Le Kate fait ses débuts en 2012, suivi de sa grande sœur, le So Kate, en 2013. Un hommage de Christian Louboutin à son amie Kate Moss.",
  },
  {
    icon: Ruler,
    title: "Le talon",
    text: "Un talon aiguille de 100 mm, fin et droit, pensé pour allonger la silhouette tout en laissant apparaître la semelle rouge.",
  },
];

export default function Features() {
  const reduce = useReducedMotion();

  return (
    <section
      id="details"
      aria-labelledby="details-title"
      className="relative overflow-hidden bg-[#0b0b0e] px-5 py-24 sm:px-10 sm:py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-loubi/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-[11px] uppercase tracking-[0.35em] text-loubi-soft">
          Savoir-faire
        </p>
        <h2
          id="details-title"
          className="mt-4 max-w-3xl font-serif text-4xl font-light uppercase leading-[1.02] tracking-[0.02em] sm:text-6xl"
        >
          Les détails qui font <em className="font-serif italic normal-case text-cream/80">la</em> signature
        </h2>

        <motion.ul
          className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: reduce ? 0 : 0.12 } },
          }}
        >
          {features.map(({ icon: Icon, title, text }, i) => (
            <motion.li
              key={title}
              variants={{
                hidden: { opacity: 0, y: reduce ? 0 : 28 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="flex flex-col bg-[#0b0b0e] p-7 sm:p-8"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15">
                  <Icon className="h-5 w-5 text-loubi" aria-hidden />
                </span>
                <span className="font-serif text-sm text-cream/40 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-8 font-serif text-2xl uppercase tracking-[0.04em]">
                {title}
              </h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-cream/70">
                {text}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
