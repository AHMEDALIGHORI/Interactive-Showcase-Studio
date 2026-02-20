import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import heroImg from "@/assets/hero-renaissance.jpg";
import sectionAtelier from "@/assets/section-atelier.jpg";
import sectionBoutique from "@/assets/section-boutique.jpg";
import editorialDetail from "@/assets/editorial-detail.jpg";
import editorialProducts from "@/assets/editorial-products.jpg";
import editorialRunway from "@/assets/editorial-runway.jpg";
import heroFashion from "@/assets/hero-fashion.jpg";

/* ─── SECTIONS CONFIG ─── */
const SECTIONS = [
  { id: "couture", label: "Couture", numeral: "I" },
  { id: "atelier", label: "Atelier", numeral: "II" },
  { id: "collections", label: "Collections", numeral: "III" },
  { id: "runway", label: "Runway", numeral: "IV" },
  { id: "boutique", label: "Boutique", numeral: "V" },
  { id: "heritage", label: "Heritage", numeral: "VI" },
];

/* ─── SCROLL-DRIVEN WORD-BY-WORD TEXT REVEAL ─── */
const WordSpan = ({
  word,
  range,
  progress,
}: {
  word: string;
  range: [number, number];
  progress: any;
}) => {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [40, 0]);

  return (
    <span className="inline-block overflow-hidden mr-[0.3em]">
      <motion.span className="inline-block" style={{ opacity, y }}>
        {word}
      </motion.span>
    </span>
  );
};

const TextReveal = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.3"],
  });
  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = (i + 1) / words.length;
        return (
          <WordSpan
            key={i}
            word={word}
            range={[start, end]}
            progress={scrollYProgress}
          />
        );
      })}
    </span>
  );
};

/* ─── CLIP-PATH MASK TYPES ─── */
type ClipMask = "center" | "left" | "right" | "top" | "bottom" | "circle" | "diamond";

const getClipPath = (mask: ClipMask, progress: number): string => {
  const p = Math.max(0, Math.min(1, progress));
  switch (mask) {
    case "center":
      // Reveals outward from center
      const insetH = (1 - p) * 50;
      const insetV = (1 - p) * 50;
      return `inset(${insetV}% ${insetH}% ${insetV}% ${insetH}% round ${(1 - p) * 8}px)`;
    case "left":
      // Wipes from left to right
      return `inset(0 ${(1 - p) * 100}% 0 0)`;
    case "right":
      // Wipes from right to left
      return `inset(0 0 0 ${(1 - p) * 100}%)`;
    case "top":
      // Wipes from top to bottom
      return `inset(0 0 ${(1 - p) * 100}% 0)`;
    case "bottom":
      // Wipes from bottom to top
      return `inset(${(1 - p) * 100}% 0 0 0)`;
    case "circle":
      // Circle expanding from center
      return `circle(${p * 75}% at 50% 50%)`;
    case "diamond":
      // Diamond/rhombus expanding from center
      const size = p * 100;
      return `polygon(50% ${50 - size / 2}%, ${50 + size / 2}% 50%, 50% ${50 + size / 2}%, ${50 - size / 2}% 50%)`;
    default:
      return `inset(0)`;
  }
};

/* ─── SCALE-UP IMAGE REVEAL with clip-path mask + parallax ─── */
const ImageReveal = ({
  src,
  alt,
  className = "",
  parallaxOffset = 60,
  mask = "center",
}: {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
  parallaxOffset?: number;
  mask?: ClipMask;
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Scale: starts zoomed in, settles to 1
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.5], [1.35, 1.05, 1]);
  // Opacity
  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.35], [0, 0.5, 1]);
  // Parallax depth
  const y = useTransform(scrollYProgress, [0, 1], [parallaxOffset, -parallaxOffset]);
  // Clip-path reveal driven by scroll
  const clipProgress = useTransform(scrollYProgress, [0.05, 0.4], [0, 1]);

  return (
    <motion.div
      ref={ref}
      className={`overflow-hidden relative ${className}`}
      style={{
        clipPath: useTransform(clipProgress, (v) => getClipPath(mask, v)),
      }}
    >
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-full object-cover will-change-transform"
        style={{ scale, opacity, y }}
      />
    </motion.div>
  );
};

/* ─── CLIP REVEAL STAGGER CONTEXT ─── */
const StaggerCtx = React.createContext<{ getIndex: () => number; base: number; step: number; duration: number } | null>(null);

const ClipRevealStagger = ({
  children,
  base = 0.05,
  step = 0.06,
  duration = 0.3,
  className = "",
}: {
  children: React.ReactNode;
  base?: number;
  step?: number;
  duration?: number;
  className?: string;
}) => {
  const counterRef = useRef(0);
  // Reset counter each render so indices are stable
  counterRef.current = 0;
  const getIndex = useCallback(() => counterRef.current++, []);
  return (
    <StaggerCtx.Provider value={{ getIndex, base, step, duration }}>
      <div className={className}>{children}</div>
    </StaggerCtx.Provider>
  );
};

/* ─── CLIP REVEAL WRAPPER (for any element) ─── */
const ClipReveal = ({
  children,
  className = "",
  mask = "center" as ClipMask,
  scrollStart = "start end",
  scrollEnd = "end start",
  revealStart: revealStartProp,
  revealEnd: revealEndProp,
}: {
  children: React.ReactNode;
  className?: string;
  mask?: ClipMask;
  scrollStart?: any;
  scrollEnd?: any;
  revealStart?: number;
  revealEnd?: number;
}) => {
  const stagger = React.useContext(StaggerCtx);
  const staggerIndex = useRef<number | null>(null);
  if (stagger && staggerIndex.current === null) {
    staggerIndex.current = stagger.getIndex();
  }

  const revealStart = revealStartProp ?? (stagger ? stagger.base + (staggerIndex.current ?? 0) * stagger.step : 0.05);
  const revealEnd = revealEndProp ?? (stagger ? revealStart + stagger.duration : 0.4);

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [scrollStart, scrollEnd],
  });
  // easeOutQuad: t*(2-t)
  const rawProgress = useTransform(scrollYProgress, [revealStart, revealEnd], [0, 1]);
  const clipProgress = useTransform(rawProgress, (t) => t * (2 - t));
  const rawOpacity = useTransform(scrollYProgress, [revealStart, revealStart + (revealEnd - revealStart) * 0.4], [0, 1]);
  const opacity = useTransform(rawOpacity, (t) => t * (2 - t));

  return (
    <motion.div
      ref={ref}
      className={`will-change-[clip-path] ${className}`}
      style={{
        clipPath: useTransform(clipProgress, (v) => getClipPath(mask, v)),
        opacity,
      }}
    >
      {children}
    </motion.div>
  );
};

/* ─── FADE-UP REVEAL ─── */
const FadeUp = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
};

/* ─── CARD SLIDE-IN (cards animate from sides like Shopify) ─── */
const CardSlideIn = ({
  children,
  className = "",
  direction = "left",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right" | "bottom";
  delay?: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial = {
    left: { x: -80, opacity: 0 },
    right: { x: 80, opacity: 0 },
    bottom: { y: 60, opacity: 0 },
  }[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? { x: 0, y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
};

/* ─── STICKY SIDEBAR NAV (Roman numerals like Shopify Editions) ─── */
const StickyNav = ({ activeSection }: { activeSection: string }) => (
  <motion.div
    className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end gap-3"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8, delay: 1.5 }}
  >
    {SECTIONS.map((s) => (
      <a
        key={s.id}
        href={`#${s.id}`}
        className="group flex items-center gap-3"
      >
        <span
          className={`font-sans text-[10px] tracking-[0.2em] uppercase transition-all duration-300 ${
            activeSection === s.id
              ? "opacity-100 text-primary translate-x-0"
              : "opacity-0 group-hover:opacity-70 translate-x-2 group-hover:translate-x-0 text-foreground"
          }`}
        >
          {s.label}
        </span>
        <span
          className={`font-display text-xs transition-all duration-300 ${
            activeSection === s.id
              ? "text-primary scale-110"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        >
          {s.numeral}
        </span>
      </a>
    ))}
  </motion.div>
);

/* ─── TOP NAV (always blurred glassmorphism) ─── */
const TopNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 flex items-center justify-between backdrop-blur-xl transition-all duration-700"
      style={{
        backgroundColor: scrolled ? "hsla(40,20%,4%,0.7)" : "hsla(40,20%,4%,0.25)",
        borderBottom: scrolled ? "1px solid hsla(40,10%,50%,0.1)" : "1px solid transparent",
        padding: scrolled ? "0.75rem 3rem" : "1.25rem 3rem",
      }}
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="font-serif text-lg md:text-xl tracking-[0.15em] text-foreground">
        Maison Éclat
      </span>
      <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-primary/70">
        Winter '26 — The Renaissance Edition
      </span>
      <div className="hidden md:flex items-center gap-8">
        {["Search", "Shop"].map((item) => (
          <span
            key={item}
            className="font-sans text-xs tracking-[0.15em] text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-300"
          >
            {item}
          </span>
        ))}
      </div>
    </motion.nav>
  );
};

/* ─── HERO: full-bleed parallax + centered translucent panel ─── */
const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const imgOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.3]);
  const panelOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const panelY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  return (
    <section ref={ref} className="relative h-[110vh] overflow-hidden">
      {/* Full-bleed parallax background */}
      <motion.div className="absolute inset-[-10%]" style={{ y, scale, opacity: imgOpacity }}>
        <img src={heroImg} alt="Renaissance fashion" className="w-full h-full object-cover" />
      </motion.div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsla(40,20%,4%,0.6)_100%)]" />

      {/* Centered translucent glassmorphism panel */}
      <motion.div
        className="relative z-10 flex items-center justify-center h-screen px-6"
        style={{ opacity: panelOpacity, y: panelY }}
      >
        <motion.div
          className="relative bg-background/30 backdrop-blur-lg border border-foreground/10 rounded-sm shadow-[0_8px_60px_-12px_hsla(38,72%,56%,0.15)] p-10 md:p-16 max-w-xl w-full"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 rounded-sm border border-primary/10 pointer-events-none" />

          <motion.h1
            className="font-serif text-4xl md:text-6xl leading-[1.05] text-foreground"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            The
            <br />
            <span className="italic">
              Ren<span className="text-primary">ai</span>ssance
            </span>
            <br />
            Edition
          </motion.h1>

          <motion.p
            className="mt-6 font-sans text-sm text-foreground/60 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.1 }}
          >
            A new world of luxury.
            <br />
            6 collection updates.
          </motion.p>

          <motion.div
            className="mt-10 flex gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.3 }}
          >
            <div className="flex flex-col gap-1.5">
              {SECTIONS.map((s, i) => (
                <motion.a
                  key={s.id}
                  href={`#${s.id}`}
                  className="font-serif text-sm md:text-base text-foreground/80 hover:text-primary transition-colors duration-300 leading-snug"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  {s.label}
                </motion.a>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              {SECTIONS.map((s, i) => (
                <motion.span
                  key={s.numeral}
                  className="font-display text-xs text-primary/50 leading-snug md:leading-normal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 + i * 0.07 }}
                >
                  {s.numeral}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
      >
        <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-foreground/40">
          Scroll to explore
        </span>
        <motion.div
          className="w-px h-10 bg-primary/30"
          animate={{ scaleY: [1, 0.3, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
};

/* ─── SECTION I: Couture (full-screen bg + text + feature cards) ─── */
const SectionCouture = () => (
  <section
    id="couture"
    className="relative min-h-screen py-24 md:py-32 overflow-hidden"
  >
    {/* Background image with parallax */}
    <div className="absolute inset-0">
      <img src={sectionAtelier} alt="" className="w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
    </div>

    <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto">
      <ClipReveal mask="left">
        <p className="font-display text-xs tracking-[0.4em] uppercase text-primary mb-4">
          I · Couture
        </p>
      </ClipReveal>

      <h2 className="font-serif text-4xl md:text-7xl lg:text-8xl font-medium leading-[0.95] text-foreground max-w-4xl">
        <TextReveal text="The craft behind every thread, stitch, and silhouette." />
      </h2>

      <FadeUp delay={0.3}>
        <p className="mt-8 font-sans text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
          Each garment is a testament to three generations of master artisans who
          believe that true luxury lives in the details invisible to the untrained eye.
        </p>
      </FadeUp>

      {/* Feature cards that slide in */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        {([
          {
            title: "Hand Embroidery",
            desc: "Over 200 hours of meticulous handwork per piece",
            img: editorialDetail,
            mask: "circle" as ClipMask,
          },
          {
            title: "Italian Silk",
            desc: "Sourced from the oldest mills in Como since 1892",
            img: editorialProducts,
            mask: "diamond" as ClipMask,
          },
          {
            title: "Zero Waste",
            desc: "Every millimeter of fabric finds its purpose",
            img: editorialRunway,
            mask: "circle" as ClipMask,
          },
        ]).map((card, i) => (
          <CardSlideIn
            key={card.title}
            direction={i === 0 ? "left" : i === 2 ? "right" : "bottom"}
            delay={i * 0.15}
            className="group"
          >
            <div className="overflow-hidden bg-secondary">
              <ImageReveal
                src={card.img}
                alt={card.title}
                className="h-64 md:h-80"
                mask={card.mask}
              />
              <div className="p-6">
                <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="mt-2 font-sans text-sm text-muted-foreground">
                  {card.desc}
                </p>
              </div>
            </div>
          </CardSlideIn>
        ))}
      </div>
    </div>
  </section>
);

/* ─── SECTION II: Atelier (sticky text + scrolling images) ─── */
const SectionAtelier = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <section id="atelier" ref={containerRef} className="relative min-h-[200vh]">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            src={sectionAtelier}
            alt="Atelier"
            className="w-full h-full object-cover"
            style={{ scale: useTransform(scrollYProgress, [0, 1], [1, 1.15]) }}
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>

        <div className="relative z-10 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <ClipReveal mask="left">
              <p className="font-display text-xs tracking-[0.4em] uppercase text-primary mb-4">
                II · Atelier
              </p>
            </ClipReveal>
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium leading-[0.95] text-foreground">
              <TextReveal text="Where vision becomes reality" />
            </h2>
            <FadeUp delay={0.3}>
              <p className="mt-8 font-sans text-base text-muted-foreground max-w-md leading-relaxed">
                Our Paris atelier is where centuries of savoir-faire meet fearless
                innovation. Every piece begins as a sketch, becomes a prototype,
                and is perfected through dozens of fittings.
              </p>
            </FadeUp>
            <FadeUp delay={0.5}>
              <div className="mt-8 flex gap-12">
                {[
                  { num: "47", label: "Artisans" },
                  { num: "200+", label: "Hours per piece" },
                  { num: "1892", label: "Founded" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <span className="font-serif text-3xl text-primary">{stat.num}</span>
                    <p className="font-sans text-xs text-muted-foreground mt-1 tracking-wider uppercase">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          <motion.div
            className="relative"
            style={{
              y: useTransform(scrollYProgress, [0, 1], [80, -80]),
            }}
          >
            <ImageReveal
              src={heroFashion}
              alt="Fashion editorial"
              className="h-[50vh] md:h-[70vh]"
              mask="left"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── SECTION III: Collections (pinned horizontal scroll carousel) ─── */
const SectionCollections = () => {
  const containerRef = useRef(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const items = [
    { title: "Noir Éternel", season: "Autumn/Winter", img: editorialRunway, price: "€8,400" },
    { title: "Lumière Dorée", season: "Resort", img: editorialDetail, price: "€12,600" },
    { title: "Soie Sauvage", season: "Spring/Summer", img: editorialProducts, price: "€6,200" },
    { title: "Renaissance", season: "Haute Couture", img: heroFashion, price: "€24,000" },
    { title: "Palazzo", season: "Pre-Fall", img: sectionBoutique, price: "€9,800" },
    { title: "Nuit Royale", season: "Evening", img: sectionAtelier, price: "€15,500" },
  ];

  // Show 4 cards at a time, scroll to reveal remaining 2. 
  // At scroll end, last card should be flush with right edge.
  // Each card ~420px + 32px gap on lg. 6 cards = ~2680px total + 48px padding.
  // We shift by ~30% of container width to reveal the last 2 cards.
  const x = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "-35%"]);

  return (
    <section id="collections" ref={containerRef} className="relative h-[150vh]">
      {/* Sticky container that pins the carousel */}
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        {/* Header */}
        <div className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-10">
          <ClipReveal mask="left">
            <p className="font-display text-xs tracking-[0.4em] uppercase text-primary mb-4">
              III · Collections
            </p>
          </ClipReveal>
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl font-medium leading-[0.95] text-foreground max-w-3xl">
              <TextReveal text="Six collections. One vision." />
            </h2>
            {/* Scroll progress indicator */}
            <div className="hidden md:flex items-center gap-4">
              <div className="w-32 h-px bg-border relative">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-primary origin-left"
                  style={{ scaleX: scrollYProgress }}
                />
              </div>
              <span className="font-sans text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                Scroll
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal carousel track */}
        <motion.div
          ref={trackRef}
          className="flex gap-6 md:gap-8 pl-6 md:pl-12 items-start"
          style={{ x }}
        >
          {items.map((item, i) => {
            // Each card gets individual scale/opacity based on its position
            const cardStart = i / items.length;
            const cardMid = (i + 0.5) / items.length;
            const cardEnd = (i + 1) / items.length;

            return (
              <CollectionCard
                key={item.title}
                item={item}
                index={i}
                progress={scrollYProgress}
                cardStart={cardStart}
                cardMid={cardMid}
                cardEnd={cardEnd}
              />
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

/* ─── Individual collection card with scroll-linked animations ─── */
const CollectionCard = ({
  item,
  index,
  progress,
  cardStart,
  cardMid,
  cardEnd,
}: {
  item: { title: string; season: string; img: string; price: string };
  index: number;
  progress: any;
  cardStart: number;
  cardMid: number;
  cardEnd: number;
}) => {
  const cardScale = useTransform(
    progress,
    [Math.max(0, cardStart - 0.05), cardStart, cardMid, Math.min(1, cardEnd + 0.1)],
    [0.92, 1, 1, 0.96]
  );
  const cardOpacity = useTransform(
    progress,
    [Math.max(0, cardStart - 0.05), cardStart, cardMid, Math.min(1, cardEnd + 0.15)],
    [0.4, 1, 1, 0.6]
  );
  const imgScale = useTransform(
    progress,
    [cardStart, cardMid],
    [1.15, 1]
  );

  return (
    <motion.div
      className="flex-shrink-0 w-[300px] md:w-[380px] lg:w-[420px] group cursor-pointer"
      style={{ scale: cardScale, opacity: cardOpacity }}
    >
      <div className="overflow-hidden relative">
        <motion.img
          src={item.img}
          alt={item.title}
          className="w-full h-[380px] md:h-[500px] object-cover transition-all duration-700"
          style={{ scale: imgScale }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span className="font-sans text-xs tracking-[0.2em] uppercase bg-primary text-primary-foreground px-4 py-2">
            View
          </span>
        </div>
      </div>
      <div className="mt-5 flex items-start justify-between">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] uppercase text-primary">
            {item.season}
          </p>
          <h3 className="font-serif text-xl md:text-2xl text-foreground mt-1 group-hover:text-primary transition-colors duration-300">
            {item.title}
          </h3>
        </div>
        <span className="font-sans text-xs text-muted-foreground mt-1">
          {item.price}
        </span>
      </div>
    </motion.div>
  );
};

/* ─── SECTION IV: Runway (full-bleed parallax quote) ─── */
const SectionRunway = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const textScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.9]);

  return (
    <section id="runway" ref={ref} className="relative h-[80vh] md:h-screen overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }}>
        <img src={editorialRunway} alt="Runway" className="w-full h-[130%] object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-background/50" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        <ClipReveal mask="bottom">
          <p className="font-display text-xs tracking-[0.4em] uppercase text-primary mb-8">
            IV · Runway
          </p>
        </ClipReveal>
        <motion.h2
          className="font-serif text-4xl md:text-7xl lg:text-8xl italic text-foreground text-center leading-[1.05] max-w-5xl"
          style={{ scale: textScale }}
        >
          <TextReveal text="Fashion is the armor to survive the reality of everyday life." />
        </motion.h2>
        <FadeUp delay={0.6}>
          <p className="mt-8 font-sans text-xs tracking-[0.3em] uppercase text-muted-foreground">
            — Maison Éclat, Winter 2026
          </p>
        </FadeUp>
      </div>
    </section>
  );
};

/* ─── SECTION V: Boutique (grid with mixed content) ─── */
const SectionBoutique = () => (
  <section id="boutique" className="py-24 md:py-32 px-6 md:px-12">
    <div className="max-w-7xl mx-auto">
      <ClipReveal mask="left">
        <p className="font-display text-xs tracking-[0.4em] uppercase text-primary mb-4">
          V · Boutique
        </p>
      </ClipReveal>
      <h2 className="font-serif text-4xl md:text-6xl font-medium leading-[0.95] text-foreground max-w-3xl mb-16">
        <TextReveal text="Experience luxury, reimagined for the modern world." />
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Large image card */}
        <CardSlideIn direction="left" className="md:col-span-7">
          <div className="relative overflow-hidden group">
            <ImageReveal
              src={sectionBoutique}
              alt="Boutique"
              className="h-[400px] md:h-[600px]"
              mask="right"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="font-display text-xs tracking-[0.3em] uppercase text-primary">
                Flagship
              </p>
              <h3 className="font-serif text-3xl md:text-4xl text-foreground mt-2">
                Paris Boutique
              </h3>
            </div>
          </div>
        </CardSlideIn>

        {/* Stacked cards */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <ClipReveal mask="center" className="h-full" revealStart={0.08} revealEnd={0.35}>
            <div className="bg-secondary p-8 md:p-10 h-full">
              <p className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-4">
                Private Appointments
              </p>
              <h3 className="font-serif text-2xl text-foreground">
                One-on-one styling consultations
              </h3>
              <p className="mt-3 font-sans text-sm text-muted-foreground leading-relaxed">
                Book a private session with our style advisors for a bespoke
                shopping experience tailored to your taste.
              </p>
              <a
                href="#"
                className="inline-block mt-6 font-sans text-xs tracking-[0.2em] uppercase text-primary border-b border-primary/40 pb-1 hover:border-primary transition-colors"
              >
                Book now
              </a>
            </div>
          </ClipReveal>

          <CardSlideIn direction="right" delay={0.3}>
            <ImageReveal
              src={editorialProducts}
              alt="Products"
              className="h-[250px] md:h-[300px]"
              mask="bottom"
            />
          </CardSlideIn>
        </div>
      </div>
    </div>
  </section>
);

/* ─── SECTION VI: Heritage (numbered feature list) ─── */
const SectionHeritage = () => {
  const features = [
    {
      num: "01",
      title: "Italian Silk",
      desc: "Sourced from the oldest mills in Como, our silk carries centuries of mastery in every fiber.",
    },
    {
      num: "02",
      title: "Hand Embroidery",
      desc: "Each piece requires over 200 hours of meticulous handwork by three generations of master artisans.",
    },
    {
      num: "03",
      title: "Zero Waste",
      desc: "Our revolutionary pattern engineering ensures every millimeter of precious fabric finds its purpose.",
    },
    {
      num: "04",
      title: "Made to Last",
      desc: "Designed for decades, not seasons. Every garment comes with lifetime care and restoration.",
    },
  ];

  return (
    <section id="heritage" className="py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <ClipReveal mask="left">
          <p className="font-display text-xs tracking-[0.4em] uppercase text-primary mb-4">
            VI · Heritage
          </p>
        </ClipReveal>
        <h2 className="font-serif text-4xl md:text-6xl font-medium leading-[0.95] text-foreground max-w-3xl mb-16">
          <TextReveal text="Four pillars of uncompromising craft" />
        </h2>

        <ClipRevealStagger base={0.08} step={0.06} duration={0.27} className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {features.map((f, i) => (
              <ClipReveal
                key={f.num}
                mask={(["left", "right", "top", "bottom"] as ClipMask[])[i % 4]}
                className="bg-background"
              >
                <div className="p-8 md:p-12 group hover:bg-secondary transition-colors duration-500 h-full">
                  <span className="font-display text-5xl md:text-6xl text-primary/15 group-hover:text-primary/30 transition-colors duration-500">
                    {f.num}
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl text-foreground mt-4">
                    {f.title}
                  </h3>
                  <p className="font-sans text-sm text-muted-foreground mt-3 leading-relaxed max-w-sm">
                    {f.desc}
                  </p>
                </div>
              </ClipReveal>
            ))}
        </ClipRevealStagger>
      </div>
    </section>
  );
};

/* ─── MARQUEE (infinite scroll text like Shopify) ─── */
const Marquee = () => (
  <ClipReveal mask="center" revealStart={0.0} revealEnd={0.3}>
    <div className="py-8 overflow-hidden border-y border-border">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="font-serif text-5xl md:text-7xl italic text-foreground/[0.06] mx-6"
          >
            MAISON ÉCLAT ✦ WINTER 2026 ✦ THE RENAISSANCE EDITION ✦{" "}
          </span>
        ))}
      </motion.div>
    </div>
  </ClipReveal>
);

/* ─── NEWSLETTER MODAL ─── */
const NewsletterModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
      onClose();
    }, 2200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-secondary border border-border p-10 md:p-12"
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary rounded-sm"
              aria-label="Close"
            >
              ✕
            </button>

            {!submitted ? (
              <>
                <p className="font-display text-xs tracking-[0.4em] uppercase text-primary mb-4">
                  Newsletter
                </p>
                <h3 className="font-serif text-3xl md:text-4xl text-foreground leading-tight mb-3">
                  Stay in the
                  <br />
                  <span className="italic">conversation</span>
                </h3>
                <p className="font-sans text-sm text-muted-foreground mb-8 leading-relaxed">
                  Exclusive previews, atelier stories, and invitations to private events — delivered seasonally.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full bg-transparent border border-border/60 px-5 py-4 font-sans text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary transition-colors"
                    maxLength={255}
                    required
                  />
                  <button
                    type="submit"
                    className="w-full font-sans text-xs tracking-[0.3em] uppercase bg-primary text-primary-foreground px-5 py-4 hover:bg-primary/90 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                  >
                    Subscribe
                  </button>
                </form>
                <p className="font-sans text-[10px] text-muted-foreground/70 mt-4">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </>
            ) : (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-4xl mb-4 block">✦</span>
                <h3 className="font-serif text-2xl text-foreground mb-2">
                  Welcome to the maison
                </h3>
                <p className="font-sans text-sm text-muted-foreground">
                  You'll hear from us soon.
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── SOCIAL ICON (animated) ─── */
const socialIcons = [
  {
    name: "Instagram",
    href: "#",
    path: "M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z",
  },
  {
    name: "Pinterest",
    href: "#",
    path: "M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.81-2.425.853 0 1.265.641 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z",
  },
  {
    name: "X",
    href: "#",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "LinkedIn",
    href: "#",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
];

const SocialIcon = ({ icon, delay }: { icon: typeof socialIcons[0]; delay: number }) => (
  <FadeUp delay={delay}>
    <a
      href={icon.href}
      aria-label={icon.name}
      className="group relative flex items-center justify-center w-12 h-12 border border-border/40 hover:border-primary/60 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-[18px] h-[18px] fill-muted-foreground group-hover:fill-primary transition-colors duration-300 group-hover:scale-110 transform"
      >
        <path d={icon.path} />
      </svg>
      <span className="absolute -bottom-6 font-sans text-[9px] tracking-[0.15em] uppercase text-muted-foreground/0 group-hover:text-muted-foreground/80 transition-all duration-300">
        {icon.name}
      </span>
    </a>
  </FadeUp>
);

/* ─── FOOTER TOUR ─── */
const tourSteps = [
  {
    target: "tour-social",
    title: "Animated Social Icons",
    description: "Hover to reveal icon labels with smooth scale transitions.",
  },
  {
    target: "tour-newsletter",
    title: "Newsletter Signup",
    description: "Subscribe via our new elegant modal with validation & confirmation.",
  },
  {
    target: "tour-cta",
    title: "Enhanced CTA",
    description: "High-contrast focus rings and keyboard navigation on every element.",
  },
  {
    target: "tour-info",
    title: "Info Grid",
    description: "Staggered fade-up animations reveal atelier details as you scroll.",
  },
];

const FooterTour = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(0);
  const current = tourSteps[step];

  useEffect(() => {
    const el = document.getElementById(current.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step, current.target]);

  const isLast = step === tourSteps.length - 1;

  return (
    <motion.div
      className="fixed inset-0 z-[100] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      {/* Tooltip card */}
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto fixed bottom-8 left-1/2 -translate-x-1/2 w-[90vw] max-w-md"
      >
        <div className="bg-secondary border border-border rounded-sm p-6 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-4">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-border"
                }`}
              />
            ))}
            <span className="ml-auto font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
              {step + 1} / {tourSteps.length}
            </span>
          </div>

          <h4 className="font-serif text-lg text-foreground mb-1">{current.title}</h4>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-5">
            {current.description}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm px-2 py-1"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="font-sans text-[10px] tracking-[0.2em] uppercase border border-border px-5 py-2.5 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => (isLast ? onClose() : setStep(step + 1))}
                className="font-sans text-[10px] tracking-[0.2em] uppercase bg-primary text-primary-foreground px-5 py-2.5 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary rounded-sm"
              >
                {isLast ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Highlight ring on target */}
      <TourHighlight target={current.target} />
    </motion.div>
  );
};

const TourHighlight = ({ target }: { target: string }) => {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.getElementById(target);
      if (el) setRect(el.getBoundingClientRect());
    };
    update();
    window.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [target]);

  if (!rect) return null;

  return (
    <motion.div
      layoutId="tour-highlight"
      className="absolute border-2 border-primary/70 rounded-sm pointer-events-none"
      style={{
        top: rect.top - 8,
        left: rect.left - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 bg-primary/[0.06] rounded-sm animate-pulse" />
    </motion.div>
  );
};

/* ─── FOOTER ─── */
const Footer = () => {
  const footerRef = useRef(null);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.6], [0.95, 1]);

  return (
    <>
      <footer ref={footerRef} className="relative py-24 md:py-36 px-6 md:px-12 overflow-hidden">
        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: bgOpacity }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.03] blur-[100px]" />
        </motion.div>

        <motion.div className="max-w-6xl mx-auto relative z-10" style={{ scale }}>
          {/* Large CTA headline */}
          <div id="tour-cta" className="text-center mb-20">
            <ClipReveal mask="center">
              <p className="font-display text-xs tracking-[0.5em] uppercase text-primary mb-6">
                The Experience Awaits
              </p>
            </ClipReveal>
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl text-foreground leading-[0.95]">
              <TextReveal text="Begin your" />
              <br />
              <span className="italic">
                <TextReveal text="journey" />
              </span>
            </h2>
            <FadeUp delay={0.3}>
              <p className="font-sans text-sm md:text-base text-foreground/70 mt-8 max-w-lg mx-auto leading-relaxed">
                Step into a world where heritage meets innovation. Visit our atelier or schedule a private consultation with our artisans.
              </p>
            </FadeUp>
            <FadeUp delay={0.4}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <a
                  href="#"
                  className="group inline-flex items-center gap-3 font-sans text-xs tracking-[0.3em] uppercase border border-primary/50 px-10 py-5 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Book Appointment
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
                <button
                  id="tour-newsletter"
                  onClick={() => setNewsletterOpen(true)}
                  className="group inline-flex items-center gap-3 font-sans text-xs tracking-[0.3em] uppercase px-10 py-5 text-muted-foreground hover:text-primary transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Join Newsletter
                  <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">✦</span>
                </button>
              </div>
            </FadeUp>
          </div>

          {/* Social icons row */}
          <div id="tour-social" className="flex items-center justify-center gap-8 mb-20">
            {socialIcons.map((icon, i) => (
              <SocialIcon key={icon.name} icon={icon} delay={0.1 + i * 0.08} />
            ))}
          </div>

          {/* Info grid */}
          <div id="tour-info" className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-20">
            <FadeUp>
              <div className="text-center md:text-left">
                <p className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-3">
                  Flagship Atelier
                </p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  12 Rue du Faubourg Saint-Honoré
                  <br />
                  75008 Paris, France
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <div className="text-center">
                <p className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-3">
                  Hours
                </p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Mon – Sat: 10:00 – 19:00
                  <br />
                  Private viewings by appointment
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="text-center md:text-right">
                <p className="font-display text-xs tracking-[0.3em] uppercase text-primary mb-3">
                  Inquiries
                </p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  atelier@maisoneclat.com
                  <br />
                  +33 1 42 65 00 00
                </p>
              </div>
            </FadeUp>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <ClipReveal mask="left">
              <span className="font-serif text-2xl tracking-[0.15em] text-foreground/90">
                MAISON ÉCLAT
              </span>
            </ClipReveal>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setTourOpen(true)}
                className="font-sans text-[10px] tracking-[0.2em] uppercase text-primary/70 hover:text-primary border border-primary/30 hover:border-primary/60 px-4 py-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm inline-flex items-center gap-2"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                What's New
              </button>
              <span className="font-sans text-[11px] tracking-wider text-muted-foreground/80">
                © 2026 Maison Éclat. All rights reserved.
              </span>
            </div>
          </div>
        </motion.div>
      </footer>

      <NewsletterModal open={newsletterOpen} onClose={() => setNewsletterOpen(false)} />
      <AnimatePresence>
        {tourOpen && <FooterTour onClose={() => setTourOpen(false)} />}
      </AnimatePresence>
    </>
  );
};

/* ─── CONFETTI BURST ─── */
const ConfettiBurst = ({ onDone }: { onDone: () => void }) => {
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 600,
      y: -(Math.random() * 400 + 100),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.4,
      color: ["hsl(38,72%,56%)", "hsl(40,30%,88%)", "hsl(38,60%,72%)", "hsl(0,0%,100%)", "hsl(38,80%,38%)"][i % 5],
      width: Math.random() * 8 + 4,
      height: Math.random() * 12 + 6,
      delay: Math.random() * 0.3,
    }))
  ).current;

  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: p.scale, opacity: 0 }}
          transition={{ duration: 1.8, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 bottom-16"
          style={{ width: p.width, height: p.height, backgroundColor: p.color, borderRadius: 1 }}
        />
      ))}
    </div>
  );
};

/* ─── STICKY FOOTER CTA ─── */
const StickyFooterCTA = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [booked, setBooked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (dismissed) return;
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setVisible(scrollPercent > 0.7);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [dismissed]);

  const handleBook = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setBooked(true);
    setShowConfetti(true);
  }, []);

  return (
    <>
      {showConfetti && <ConfettiBurst onDone={() => setShowConfetti(false)} />}
      <AnimatePresence>
        {visible && !dismissed && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
            role="region"
            aria-label="Booking prompt"
          >
            <div className="pointer-events-auto bg-secondary/95 backdrop-blur-md border-t border-border/50">
              <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                <div className="hidden sm:block" aria-live="polite">
                  <AnimatePresence mode="wait">
                    {booked ? (
                      <motion.div
                        key="confirmed"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-primary text-lg" aria-hidden="true">✓</span>
                        <div>
                          <p className="font-serif text-sm text-foreground">Appointment confirmed</p>
                          <p className="font-sans text-[11px] text-muted-foreground mt-0.5">We'll be in touch shortly.</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="default" exit={{ opacity: 0, y: -6 }}>
                        <p className="font-serif text-sm text-foreground">Ready to begin your journey?</p>
                        <p className="font-sans text-[11px] text-muted-foreground mt-0.5">Book a private consultation with our artisans.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto" role="group" aria-label="Booking actions">
                  {booked ? (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-1 sm:flex-none text-center font-sans text-[10px] tracking-[0.25em] uppercase text-primary px-8 py-3"
                      role="status"
                      aria-label="Appointment booked successfully"
                    >
                      <span aria-hidden="true">✦ </span>Booked
                    </motion.span>
                  ) : (
                    <button
                      onClick={handleBook}
                      aria-label="Book a private appointment"
                      className="flex-1 sm:flex-none text-center font-sans text-[10px] tracking-[0.25em] uppercase bg-primary text-primary-foreground px-8 py-3 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                    >
                      Book Appointment
                    </button>
                  )}
                  <button
                    onClick={() => setDismissed(true)}
                    className="font-sans text-muted-foreground hover:text-foreground transition-colors p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                    aria-label="Dismiss booking prompt"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── MAIN PAGE ─── */
const Index = () => {
  const [activeSection, setActiveSection] = useState("couture");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.id);
          }
        },
        { threshold: 0.3 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="bg-background min-h-screen overflow-x-hidden">
      <TopNav />
      <StickyNav activeSection={activeSection} />
      <Hero />
      <SectionCouture />
      <SectionAtelier />
      <SectionCollections />
      <SectionRunway />
      <SectionBoutique />
      <SectionHeritage />
      <Marquee />
      <Footer />
      <StickyFooterCTA />
    </div>
  );
};

export default Index;
