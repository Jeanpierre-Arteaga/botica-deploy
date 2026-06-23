import { Link } from "react-router";
import { ArrowRight, Truck, ChevronDown } from "lucide-react";

/**
 * Hero full-screen con video de fondo (estilo cinematográfico / "Antigravity").
 * - Solo presentación: sin fetch, sin estado de negocio.
 * - prefers-reduced-motion: el CSS oculta el <video> (.hero-video) y deja
 *   visible únicamente el poster estático. Ver theme.css.
 * - Sello DIGEMID con animación tipo GIF (check que se dibuja en bucle).
 */
export function HeroBanner() {
  return (
    <section className="relative w-full min-h-[600px] h-[88vh] max-h-[900px] overflow-hidden bg-[#0F172A] text-white">
      {/* ===== Capa de fondo ===== */}
      {/* Poster estático: base siempre presente (fallback + reduced-motion) */}
      <img
        src="/hero-poster.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover animate-kenburns"
      />

      {/* Video de fondo. TODO: reemplazar /hero.mp4 por tu video real
          (ver public/README.md). Mientras no exista, se ve el poster. */}
      <video
        className="hero-video absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-poster.jpg"
        aria-hidden="true"
      >
        {/* TODO: coloca aquí tu video real en public/hero.mp4 */}
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      {/* Degradados oscuros para legibilidad del texto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.75) 38%, rgba(30,41,59,0.45) 70%, rgba(30,41,59,0.25) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0F172A] to-transparent" />
      {/* Glow frío sutil de acento */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-[480px] h-[480px] rounded-full bg-[#38BDF8]/10 blur-[120px]" />

      {/* ===== Contenido ===== */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <span
            className="animate-hero-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs md:text-sm font-medium tracking-wide text-sky-200 backdrop-blur-sm"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            Tu botica de confianza, ahora online
          </span>

          {/* Titular */}
          <h1
            className="animate-hero-fade-up mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white"
            style={{ animationDelay: "0.15s", fontFamily: "var(--font-display)" }}
          >
            Tu salud,
            <br />
            <span className="bg-gradient-to-r from-[#F15A29] via-[#FB923C] to-[#FDBA74] bg-clip-text text-transparent drop-shadow-sm">
              entregada en horas
            </span>
          </h1>

          {/* Subtítulo */}
          <p
            className="animate-hero-fade-up mt-6 max-w-xl text-base md:text-xl leading-relaxed text-slate-200/90"
            style={{ animationDelay: "0.25s", textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
          >
            Medicamentos certificados por DIGEMID a precios justos, con delivery
            rápido a tu puerta en 24 – 48 horas. Compra de forma fácil y recibe
            con total seguridad.
          </p>

          {/* CTAs: un solo botón naranja sólido + secundario glass */}
          <div
            className="animate-hero-fade-up mt-9 flex flex-col sm:flex-row gap-4"
            style={{ animationDelay: "0.35s" }}
          >
            <Link
              to="/catalogo"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#F15A29] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#F15A29]/25 transition-all duration-300 hover:bg-[#D94E1F] hover:shadow-xl hover:shadow-[#F15A29]/30 active:scale-[0.98]"
            >
              Explorar catálogo
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              to="/catalogo?is_offer=true"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/40 active:scale-[0.98]"
            >
              Ver ofertas
            </Link>
          </div>

          {/* Sellos de confianza */}
          <div
            className="animate-hero-fade-up mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-300"
            style={{ animationDelay: "0.45s" }}
          >
            {/* DIGEMID con animación tipo GIF (check que se dibuja en bucle) */}
            <span className="digemid-badge inline-flex items-center gap-2">
              <svg className="digemid-check digemid-check-on-dark" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" className="digemid-ring" />
                <path d="M7 12.5l3.5 3.5L17 9" className="digemid-tick" />
              </svg>
              Certificado DIGEMID
            </span>
            <span className="inline-flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#38BDF8]" />
              Entregas en 24–48 h
            </span>
          </div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/60">
        <span className="text-[11px] uppercase tracking-[0.2em]">Desliza</span>
        <ChevronDown className="w-5 h-5 animate-scroll-hint" />
      </div>
    </section>
  );
}