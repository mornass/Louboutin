"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#collection", label: "Collection" },
  { href: "#details", label: "Détails" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar({ ink }: { ink: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Sur le hero, le texte suit la couleur d'ambiance ; plus bas, crème.
  const color = scrolled || open ? "#f4efe6" : ink;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-colors duration-700"
      style={{ color }}
    >
      <div
        className={`absolute inset-0 -z-10 transition-all duration-500 ${
          scrolled || open
            ? "bg-[#07070a]/70 backdrop-blur-xl"
            : "bg-transparent backdrop-blur-[2px]"
        }`}
        aria-hidden
      />
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-10"
      >
        <a
          href="#collection"
          className="font-serif text-xl uppercase tracking-[0.32em] sm:text-2xl"
        >
          Louboutin
          <span className="ml-2 align-middle text-[9px] tracking-[0.3em] opacity-60">
            3D
          </span>
        </a>

        <ul className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative py-2 text-[11px] uppercase tracking-[0.3em]"
              >
                {l.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-loubi transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="-mr-2 flex h-11 w-11 items-center justify-center md:hidden"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10 bg-[#07070a]/95 backdrop-blur-xl md:hidden"
          >
            <ul className="flex flex-col px-5 py-4">
              {links.map((l, i) => (
                <motion.li
                  key={l.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex h-14 items-center font-serif text-3xl uppercase tracking-[0.08em]"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
