"use client";

import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import ShoeCarousel from "@/components/ShoeCarousel";
import ProductDrawer from "@/components/ProductDrawer";
import Gallery from "@/components/Gallery";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { products } from "@/data/products";

export default function Home() {
  const reduceMotion = !!useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [loaderProgress, setLoaderProgress] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      if (next === index) return;
      const total = products.length;
      // Sens le plus court, pour que le talon sorte du bon côté.
      const forward = (next - index + total) % total;
      setDirection(forward <= total / 2 ? 1 : -1);
      setIndex(next);
    },
    [index],
  );

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onPreloaderDone = useCallback(() => {}, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Couleurs d'ambiance exposées en variables CSS (focus, accents).
  const { ink, accent, base } = products[index].ambiance;
  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty("--amb-ink", ink);
    s.setProperty("--amb-accent", accent);
    s.setProperty("--amb-base", base);
  }, [ink, accent, base]);

  const selectFromGallery = (i: number) => {
    goTo(i);
    document
      .getElementById("collection")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <Preloader
        sceneReady={sceneReady}
        loaderProgress={loaderProgress}
        onDone={onPreloaderDone}
      />
      <Navbar ink={ink} />
      <main>
        <ShoeCarousel
          index={index}
          direction={direction}
          reduceMotion={reduceMotion}
          drawerOpen={drawerOpen}
          onChange={goTo}
          onOpen={() => setDrawerOpen(true)}
          onSceneReady={onSceneReady}
          onProgress={setLoaderProgress}
        />
        <Gallery activeIndex={index} onSelect={selectFromGallery} />
        <Features />
      </main>
      <Footer />
      <ProductDrawer
        product={products[index]}
        open={drawerOpen}
        reduceMotion={reduceMotion}
        onClose={closeDrawer}
      />
    </>
  );
}
