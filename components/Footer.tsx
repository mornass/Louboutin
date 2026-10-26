"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Globe, Hash, Instagram } from "lucide-react";
import { BRAND_URL } from "@/data/products";

// Seuls des liens vérifiés : le site officiel et le hashtag de la Maison.
// Ajoutez ici les comptes officiels une fois confirmés.
const socials = [
  {
    href: "https://www.instagram.com/explore/tags/louboutinworld/",
    label: "Instagram : #LouboutinWorld",
    icon: Instagram,
  },
  { href: BRAND_URL, label: "Site officiel Christian Louboutin", icon: Globe },
  {
    href: "https://www.instagram.com/explore/tags/louboutin/",
    label: "Instagram : #Louboutin",
    icon: Hash,
  },
];

export default function Footer() {
  return (
    <footer
      id="contact"
      aria-labelledby="contact-title"
      className="relative bg-[#050506] px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24 sm:px-10 sm:pt-32"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-start gap-8 border-b border-white/10 pb-16 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-loubi-soft">
              Contact
            </p>
            <h2
              id="contact-title"
              className="mt-4 max-w-xl font-serif text-4xl font-light uppercase leading-[1.02] sm:text-6xl"
            >
              Essayez-les
              <br />
              <em className="normal-case italic text-cream/70">en boutique</em>
            </h2>
          </div>
          <a
            href={BRAND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-12 items-center gap-3 rounded-full bg-loubi px-7 text-[11px] font-medium uppercase tracking-[0.25em] text-white transition-transform hover:scale-[1.03] active:scale-95"
          >
            Louboutin.com
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
        </motion.div>

        <div className="flex flex-col gap-8 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex gap-2" aria-label="Réseaux et liens">
            {socials.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-cream/80 transition-colors hover:border-loubi hover:text-cream"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          <p className="max-w-md text-xs leading-relaxed text-cream/60">
            Site de démonstration. Christian Louboutin est une marque
            appartenant à ses propriétaires. Ce site n&apos;est pas affilié à la
            marque.
          </p>
        </div>
      </div>
    </footer>
  );
}
