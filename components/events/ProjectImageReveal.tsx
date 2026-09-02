"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { EV } from "./palette";

type Poly = {
  tlx: number;
  tly: number;
  trx: number;
  try: number;
  brx: number;
  bry: number;
  blx: number;
  bly: number;
};

const getPolygon = (p: Poly) =>
  `polygon(${p.tlx}% ${p.tly}%, ${p.trx}% ${p.try}%, ${p.brx}% ${p.bry}%, ${p.blx}% ${p.bly}%)`;

/**
 * Slide-to-slide wipe: two veils and the incoming image sweep across on a
 * staggered timeline, while both images push in opposite directions for
 * parallax. The pointer adds a second, independent parallax on top.
 */
export function ProjectImageReveal({
  images,
  currentIndex,
}: {
  images: string[];
  currentIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const whiteVeilRef = useRef<HTMLDivElement>(null);
  const goldVeilRef = useRef<HTMLDivElement>(null);
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (currentIndex === prevIndex) return;

    const nextImgContainer = document.getElementById(`slider-container-${currentIndex}`);
    const prevImgContainer = document.getElementById(`slider-container-${prevIndex}`);

    if (!nextImgContainer || !prevImgContainer || !whiteVeilRef.current || !goldVeilRef.current)
      return;

    if (isAnimating.current) {
      gsap.killTweensOf([
        nextImgContainer,
        prevImgContainer,
        whiteVeilRef.current,
        goldVeilRef.current,
      ]);
    }

    isAnimating.current = true;

    let direction = "next";
    if (currentIndex === 0 && prevIndex === images.length - 1) direction = "next";
    else if (currentIndex === images.length - 1 && prevIndex === 0) direction = "prev";
    else if (currentIndex > prevIndex) direction = "next";
    else direction = "prev";

    const tl = gsap.timeline({
      onComplete: () => {
        setPrevIndex(currentIndex);
        isAnimating.current = false;
        gsap.set([nextImgContainer, whiteVeilRef.current, goldVeilRef.current], {
          clipPath: "none",
        });
        gsap.set(whiteVeilRef.current, { opacity: 0 });
        gsap.set(goldVeilRef.current, { opacity: 0 });
        gsap.set(prevImgContainer, { zIndex: 0 });
      },
    });

    gsap.set(prevImgContainer, { zIndex: 1 });
    gsap.set(whiteVeilRef.current, { zIndex: 2, opacity: 1 });
    gsap.set(goldVeilRef.current, { zIndex: 3, opacity: 1 });
    gsap.set(nextImgContainer, { zIndex: 4 });

    const nextImgWrapper = nextImgContainer.querySelector(".slider-transition-wrapper");
    const prevImgWrapper = prevImgContainer.querySelector(".slider-transition-wrapper");

    const startPoly: Poly =
      direction === "next"
        ? { tlx: 100, tly: 50, trx: 100, try: 0, brx: 100, bry: 100, blx: 100, bly: 50 }
        : { tlx: 0, tly: 0, trx: 0, try: 50, brx: 0, bry: 50, blx: 0, bly: 100 };

    const midPoly: Poly =
      direction === "next"
        ? { tlx: 15, tly: 50, trx: 100, try: 0, brx: 100, bry: 100, blx: 15, bly: 50 }
        : { tlx: 0, tly: 0, trx: 85, try: 50, brx: 85, bry: 50, blx: 0, bly: 100 };

    const endPoly: Poly = { tlx: 0, tly: 0, trx: 100, try: 0, brx: 100, bry: 100, blx: 0, bly: 100 };

    const whitePoly = { ...startPoly };
    const goldPoly = { ...startPoly };
    const imgPoly = { ...startPoly };

    gsap.set(whiteVeilRef.current, { clipPath: getPolygon(whitePoly) });
    gsap.set(goldVeilRef.current, { clipPath: getPolygon(goldPoly) });
    gsap.set(nextImgContainer, { clipPath: getPolygon(imgPoly) });

    if (prevImgWrapper) {
      const move = direction === "next" ? -5 : 5;
      gsap.to(prevImgWrapper, {
        x: `${move}%`,
        y: `${move}%`,
        scale: 1.05,
        duration: 1.2,
        ease: "power3.inOut",
      });
    }

    if (nextImgWrapper) {
      const start = direction === "next" ? 5 : -5;
      gsap.set(nextImgWrapper, { x: `${start}%`, y: `${start}%`, scale: 1.05 });
      tl.to(nextImgWrapper, { x: "0%", y: "0%", scale: 1, duration: 1.2, ease: "power3.inOut" }, 0);
    }

    const D1 = 0.4;
    const D2 = 0.6;
    const STAGGER = 0.1;

    tl.to(whitePoly, {
      ...midPoly,
      duration: D1,
      ease: "power2.out",
      onUpdate: () => gsap.set(whiteVeilRef.current, { clipPath: getPolygon(whitePoly) }),
    }, 0).to(whitePoly, {
      ...endPoly,
      duration: D2,
      ease: "power2.inOut",
      onUpdate: () => gsap.set(whiteVeilRef.current, { clipPath: getPolygon(whitePoly) }),
    }, D1);

    tl.to(goldPoly, {
      ...midPoly,
      duration: D1,
      ease: "power2.out",
      onUpdate: () => gsap.set(goldVeilRef.current, { clipPath: getPolygon(goldPoly) }),
    }, STAGGER).to(goldPoly, {
      ...endPoly,
      duration: D2,
      ease: "power2.inOut",
      onUpdate: () => gsap.set(goldVeilRef.current, { clipPath: getPolygon(goldPoly) }),
    }, D1 + STAGGER);

    tl.to(imgPoly, {
      ...midPoly,
      duration: D1,
      ease: "power2.out",
      onUpdate: () => gsap.set(nextImgContainer, { clipPath: getPolygon(imgPoly) }),
    }, STAGGER * 2).to(imgPoly, {
      ...endPoly,
      duration: D2,
      ease: "power2.inOut",
      onUpdate: () => gsap.set(nextImgContainer, { clipPath: getPolygon(imgPoly) }),
    }, D1 + STAGGER * 2);
  }, [currentIndex, prevIndex, images.length]);

  // Pointer parallax, scoped to this container's own images.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const root = containerRef.current;
      if (!root) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(root.querySelectorAll(".slider-parallax-img"), {
        x: x * -15,
        y: y * -15,
        duration: 1,
        ease: "power2.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full overflow-hidden"
      style={{ background: EV.navy }}
    >
      <div
        ref={whiteVeilRef}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        style={{ background: EV.cream }}
      />
      <div
        ref={goldVeilRef}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        style={{ background: EV.gold }}
      />

      {images.map((src, idx) => (
        <div
          key={`${src}-${idx}`}
          id={`slider-container-${idx}`}
          className="absolute inset-0 h-full w-full"
          style={{
            zIndex: idx === prevIndex ? 1 : 0,
            opacity: idx === currentIndex || idx === prevIndex ? 1 : 0,
            visibility: idx === currentIndex || idx === prevIndex ? "visible" : "hidden",
          }}
        >
          <div className="slider-transition-wrapper absolute inset-0 h-full w-full origin-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="slider-parallax-img absolute inset-[-40px] h-[calc(100%+80px)] w-[calc(100%+80px)] max-w-none object-cover opacity-60"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
