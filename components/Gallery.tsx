"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { products } from "@/data/products";

type Props = {
  activeIndex: number;
  onSelect: (index: number) => void;
};

export default function Gallery({ activeIndex, onSelect }: Props) {
  return (
    <section
      id="galerie"
      aria-labelledby="gallery-title"
      className="bg-[#07070a] px-5 py-24 sm:px-10 sm:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-end justify-between gap-6 border-b border-white/10 pb-6">
          <h2
            id="gallery-title"
            className="font-serif text-4xl font-light uppercase tracking-[0.04em] sm:text-6xl"
          >
            La sélection
          </h2>
          <p className="text-[11px] uppercase tracking-[0.35em] text-cream/50 tabular-nums">
            05 modèles
          </p>
        </div>

        <motion.ul
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        >
          {products.map((p, i) => (
            <motion.li
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className={i === products.length - 1 ? "col-span-2 lg:col-span-1" : ""}
            >
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Afficher ${p.name}, ${p.color}, dans le carrousel 3D`}
                aria-current={i === activeIndex ? "true" : undefined}
                className="group relative block w-full overflow-hidden rounded-2xl text-left"
                style={{
                  background: `radial-gradient(80% 70% at 50% 45%, ${p.ambiance.glow}, ${p.ambiance.base})`,
                  color: p.ambiance.ink,
                }}
              >
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 20vw"
                    className="object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-[1.07] group-hover:-rotate-2"
                  />
                </div>
                <div className="flex items-end justify-between gap-2 p-4 pt-0">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-1 line-clamp-2 font-serif text-lg uppercase leading-tight sm:text-xl">
                      {p.name}
                    </p>
                    <p className="truncate text-xs opacity-70">{p.color}</p>
                  </div>
                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 opacity-60 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                    aria-hidden
                  />
                </div>
                {i === activeIndex && (
                  <span
                    className="absolute left-4 top-4 h-1.5 w-1.5 rounded-full"
                    style={{ background: p.ambiance.accent }}
                    aria-hidden
                  />
                )}
              </button>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
