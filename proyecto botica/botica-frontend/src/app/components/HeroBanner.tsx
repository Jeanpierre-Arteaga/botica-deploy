import { Link } from "react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { homeImage } from "../lib/homeImages";

/**
 * HeroCarousel — carrusel automático del home con tipos MIXTOS de slide.
 *
 *  · Slide 1 (video):  /hero.mp4 + /hero-poster.jpg (en public/). Avanza con el
 *    evento 'ended' del video O con un timeout de respaldo (VIDEO_MAX_MS), porque
 *    sin 'loop' el video termina una vez; el respaldo cubre el caso de que 'ended'
 *    no llegue. Al entrar a este slide se reinicia (currentTime=0 + play) y se
 *    PAUSA cuando deja de ser el slide activo (no reproduce en segundo plano).
 *  · Slides 2 y 3 (image): hero-2 / hero-3 auto-detectados desde src/assets/home/
 *    (ver homeImages.ts). Si faltan, caen a un gradiente de marca (sin hueco roto).
 *    Avanzan a IMAGE_MS.
 *
 *  Solo presentación: sin fetch ni estado de negocio. Reutiliza tokens --c-* y la
 *  escala tipográfica del resto del sitio. Accesible (roledescription="carousel",
 *  dots como botones, foco visible) y respeta prefers-reduced-motion (sin
 *  auto-avance ni autoplay: poster + botón de play manual).
 */

type Cta = { label: string; to: string };

type Slide = {
  type: "video" | "image";
  /** Solo video: fuente y poster (en public/). */
  src?: string;
  poster?: string;
  /** Solo image: nombre base en src/assets/home/ (sin extensión). */
  imageKey?: string;
  /** Texto alternativo de la imagen / poster del video. */
  alt?: string;
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  ctas: Cta[];
};

const SLIDES: Slide[] = [
  {
    type: "video",
    src: "/hero.mp4",
    poster: "/hero-poster.jpg",
    alt: "Botica Central — tu farmacia de confianza, ahora online",
    eyebrow: "Tu botica de confianza, ahora online",
    title: "Tu salud,",
    titleAccent: "entregada en horas",
    subtitle:
      "Medicamentos certificados por DIGEMID a precios justos, con delivery rápido a tu puerta en 24 – 48 horas.",
    ctas: [{ label: "Explorar catálogo", to: "/catalogo" }],
  },
  {
    type: "image",
    imageKey: "hero-2",
    alt: "Ofertas de la semana en Botica Central",
    eyebrow: "Ofertas de la semana",
    title: "Ahorra en tus",
    titleAccent: "medicamentos",
    subtitle:
      "Descuentos reales en marcas y genéricos certificados. Renueva tu botiquín pagando menos, sin renunciar a la calidad.",
    ctas: [{ label: "Ver ofertas", to: "/catalogo?is_offer=true" }],
  },
  {
    type: "image",
    imageKey: "hero-3",
    alt: "Delivery a todo Lima o retiro gratis en nuestras boticas",
    eyebrow: "Retiro en tienda y delivery",
    title: "Recíbelo en casa o",
    titleAccent: "recógelo en tu sede",
    subtitle:
      "Elige delivery a todo Lima o retiro gratis en nuestras boticas de Ate y Santa Anita. Tú decides cómo recibir tu pedido.",
    ctas: [{ label: "Conoce nuestras sedes", to: "#tiendas" }],
  },
];

const VIDEO_INDEX = SLIDES.findIndex((s) => s.type === "video");
const IMAGE_MS = 6000; // imágenes: ~6 s
const VIDEO_MAX_MS = 9000; // video: tope ~9 s (respaldo de 'ended')
const FADE_MS = 400; // crossfade

/** CTA del hero: <Link> para rutas internas, <a> para anclas (#seccion). */
function HeroCta({ cta }: { cta: Cta }) {
  const className =
    "group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-brand/25 transition-all duration-300 hover:bg-brand-hover hover:shadow-xl hover:shadow-brand/30 active:scale-[0.98]";
  const inner = (
    <>
      {cta.label}
      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
    </>
  );
  if (cta.to.startsWith("#")) {
    return (
      <a href={cta.to} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={cta.to} className={className}>
      {inner}
    </Link>
  );
}

export function HeroBanner() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);

  const total = SLIDES.length;
  // Navegación manual: salto puro de estado, NUNCA atado al fin del video ni a
  // ningún timer. Cambiar `active` reinicia el temporizador (es dep del effect).
  const go = useCallback((dir: number) => setActive((a) => (a + dir + total) % total), [total]);

  // Swipe táctil (móvil): deslizar izq → siguiente, der → anterior.
  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);
  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      const start = touchStartX.current;
      touchStartX.current = null;
      if (start == null) return;
      const dx = (e.changedTouches[0]?.clientX ?? start) - start;
      if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    },
    [go],
  );

  // prefers-reduced-motion (reactivo)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reproduce/pausa el video según el slide activo (nunca en segundo plano).
  // En reduced-motion no hace autoplay: queda el poster + botón de play manual.
  // El video lleva `loop`: nunca se congela en el último frame mientras es el
  // slide activo (esa congelación es lo que se percibía como "el video se para").
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active === VIDEO_INDEX && !reduced) {
      try {
        v.currentTime = 0;
      } catch {
        /* noop */
      }
      v.play().catch(() => {
        /* el navegador puede bloquear autoplay; el poster cubre */
      });
    } else {
      v.pause();
    }
  }, [active, reduced]);

  // Al volver de otra pestaña/app, reanuda el video si es el slide activo
  // (algunos navegadores lo pausan al ocultarse la página).
  useEffect(() => {
    const onVisible = () => {
      const v = videoRef.current;
      if (!v || reduced) return;
      if (document.visibilityState === "visible" && active === VIDEO_INDEX) {
        v.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, reduced]);

  // Auto-avance: imágenes por timeout; video por respaldo VIDEO_MAX_MS (con `loop`
  // el evento 'ended' no llega, así que el avance del carrusel lo da el timer).
  // Se limpia SIEMPRE el timer en el cleanup; al cambiar `active` se reinicia solo.
  useEffect(() => {
    if (reduced || paused) return;
    const slide = SLIDES[active];
    const ms = slide.type === "video" ? VIDEO_MAX_MS : IMAGE_MS;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % total), ms);
    return () => window.clearTimeout(t);
  }, [active, paused, reduced, total]);

  const handleManualPlay = () => {
    const v = videoRef.current;
    if (v) v.play().catch(() => {});
  };

  const current = SLIDES[active];
  const showManualPlay = reduced && active === VIDEO_INDEX;

  return (
    <section
      className="relative w-full min-h-[460px] h-[72vh] sm:h-[80vh] md:h-[86vh] max-h-[900px] overflow-hidden bg-ink text-white"
      aria-roledescription="carousel"
      aria-label="Destacados de Botica Central"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ===== Capas de fondo (crossfade) — todas montadas, solo cambia opacidad ===== */}
      {SLIDES.map((slide, i) => {
        const isActive = i === active;
        const imgSrc = slide.type === "image" && slide.imageKey ? homeImage(slide.imageKey) : undefined;
        return (
          <div
            key={i}
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              opacity: isActive ? 1 : 0,
              transition: reduced ? "none" : `opacity ${FADE_MS}ms ease`,
            }}
          >
            {slide.type === "video" ? (
              <>
                {/* Poster base: pintado siempre (fallback + reduced-motion) */}
                <img
                  src={slide.poster}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover animate-kenburns"
                />
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster={slide.poster}
                  aria-hidden="true"
                >
                  <source src={slide.src} type="video/mp4" />
                </video>
              </>
            ) : imgSrc ? (
              <img
                src={imgSrc}
                alt=""
                aria-hidden="true"
                loading={i <= 1 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              // Fallback sobrio de marca si la imagen aún no se subió (sin hueco roto)
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, var(--c-ink) 0%, var(--c-ink-2) 55%, var(--c-cool) 135%)",
                }}
              />
            )}

            {/* Overlay de legibilidad (solo lo necesario) — tokens con opacidad */}
            <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/15" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
          </div>
        );
      })}

      {/* Glow frío sutil de acento (decorativo, constante) */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-cool/10 blur-[120px]" />

      {/* ===== Contenido del slide activo (remonta por key → reanima la entrada) ===== */}
      <div
        key={active}
        role="group"
        aria-roledescription="slide"
        aria-label={`Slide ${active + 1} de ${total}: ${current.alt ?? current.title}`}
        className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center"
      >
        <div className="max-w-2xl">
          {current.eyebrow && (
            <span
              className="animate-hero-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs md:text-sm font-medium tracking-wide text-white/80 backdrop-blur-sm"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cool animate-pulse" />
              {current.eyebrow}
            </span>
          )}

          <h1
            className="animate-hero-fade-up mt-5 sm:mt-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] sm:leading-[1.05] tracking-tight text-white text-balance"
            style={{ animationDelay: "0.15s", fontFamily: "var(--font-display)" }}
          >
            {current.title}
            {current.titleAccent && (
              <>
                {" "}
                <span className="text-brand drop-shadow-sm">{current.titleAccent}</span>
              </>
            )}
          </h1>

          <p
            className="animate-hero-fade-up mt-4 sm:mt-6 max-w-xl text-sm sm:text-base md:text-xl leading-relaxed text-white/85"
            style={{ animationDelay: "0.25s", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
          >
            {current.subtitle}
          </p>

          <div
            className="animate-hero-fade-up mt-7 sm:mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4"
            style={{ animationDelay: "0.35s" }}
          >
            {current.ctas.map((cta) => (
              <HeroCta key={cta.label} cta={cta} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== Botón de play manual (solo reduced-motion sobre el slide de video) ===== */}
      {showManualPlay && (
        <button
          type="button"
          onClick={handleManualPlay}
          aria-label="Reproducir el video"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md transition-colors"
        >
          <Play className="w-7 h-7 translate-x-0.5" fill="currentColor" />
        </button>
      )}

      {/* ===== Flechas prev/next — navegación manual SIEMPRE disponible =====
          z-30 + pointer-events-auto: por encima del video/overlay/contenido, para
          que nada las tape. Glass oscuro (token --c-ink) = buen contraste sobre
          cualquier imagen clara. Visibles en todos los breakpoints. */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Slide anterior"
        className="absolute left-3 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto flex w-11 h-11 md:w-12 md:h-12 rounded-full items-center justify-center text-white bg-ink/35 hover:bg-ink/60 ring-1 ring-white/25 backdrop-blur-md shadow-lg transition-colors active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Slide siguiente"
        className="absolute right-3 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-auto flex w-11 h-11 md:w-12 md:h-12 rounded-full items-center justify-center text-white bg-ink/35 hover:bg-ink/60 ring-1 ring-white/25 backdrop-blur-md shadow-lg transition-colors active:scale-95"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* ===== Indicador "Desliza" — abajo y centrado (único indicador) ===== */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-[5] h-28 w-56">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at bottom, rgba(8,15,30,0.5) 0%, transparent 72%)",
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-white/90"
        style={{ textShadow: "0 2px 10px rgba(8,15,30,0.75)" }}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.22em]">Desliza</span>
        <ChevronDown className="w-5 h-5 animate-scroll-hint" />
      </div>
    </section>
  );
}
