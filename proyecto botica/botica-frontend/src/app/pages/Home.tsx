import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Clock,
  Truck,
  Shield,
  ArrowRight,
  CheckCircle2,
  Package2,
  Pill,
  Baby,
  Heart,
  Activity,
  AlertCircle,
  Stethoscope,
  Droplets,
  Sparkles,
  Boxes,
  CreditCard,
  Thermometer,
  Wind,
  Apple,
  HeartPulse,
  UserCheck,
  Phone,
  MessageCircle,
  Mail,
  Navigation,
} from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { HeroBanner } from "../components/HeroBanner";
import { StoreMap } from "../components/StoreMap";
import { api } from "../lib/api";
import { useLocations } from "../lib/LocationContext";
import {
  telHref,
  mailtoHref,
  mapsQueryOf,
  mapsSearchUrl,
} from "../lib/contact";
import type { Category, Product } from "../lib/types";

// Imágenes reales de categorías (fotos profesionales)
import cat_gripe from "@/imports/cat_gripe.png";
import cat_dolor from "@/imports/cat_dolor.png";
import cat_alergia from "@/imports/cat_alergia.png";
import cat_bebe from "@/imports/cat_bebe.png";
import cat_vitaminas from "@/imports/cat_vitaminas.png";
import cat_digestivo from "@/imports/cat_digestivo.png";

/* ============================================================
   "Compra por necesidad" — chips por síntoma / condición
   Cada chip ahora usa una FOTO REAL de la categoría
   ============================================================ */
const NEEDS: Array<{
  label: string;
  image: string;
  query: string;
  bgColor: string;
}> = [
  {
    label: "Gripe y resfríos",
    image: cat_gripe,
    query: "gripe",
    bgColor: "#EEF4F8",
  },
  {
    label: "Dolor y fiebre",
    image: cat_dolor,
    query: "dolor",
    bgColor: "#FDF2EF",
  },
  {
    label: "Alergias",
    image: cat_alergia,
    query: "alergia",
    bgColor: "#EDF7F5",
  },
  {
    label: "Cuidado del bebé",
    image: cat_bebe,
    query: "bebe",
    bgColor: "#FBF0F4",
  },
  {
    label: "Vitaminas y energía",
    image: cat_vitaminas,
    query: "vitamina",
    bgColor: "#F3F0FA",
  },
  {
    label: "Digestivo",
    image: cat_digestivo,
    query: "digestivo",
    bgColor: "#FBF6ED",
  },
];

export function Home() {
  const { selectedLocation, isLoading: isLoadingLocation, locations } = useLocations();

  const [ofertas, setOfertas] = useState<Product[]>([]);
  const [destacados, setDestacados] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Cargar categorías destacadas (selección editorial desde BD)
  useEffect(() => {
    api.categories
      .getAll({ featured: true })
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  // Cargar productos cuando hay sede seleccionada o cambia
  useEffect(() => {
    if (isLoadingLocation) return;
    if (!selectedLocation) {
      setIsLoadingProducts(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoadingProducts(true);
      setProductsError(null);
      try {
        const [ofertasData, destacadosData] = await Promise.all([
          api.products.getAll({
            is_offer: true,
            location_id: selectedLocation.location_id,
          }),
          api.products.getAll({
            location_id: selectedLocation.location_id,
          }),
        ]);
        if (cancelled) return;

        // Defensivo: si el backend aún no filtra por is_offer, lo aplicamos en cliente.
        const ofertasFiltered = ofertasData.filter((p) => p.is_offer);
        setOfertas(ofertasFiltered);
        // Destacados: los que no estén ya en ofertas, primeros 8
        const ofertasIds = new Set(ofertasFiltered.map((p) => p.product_id));
        setDestacados(
          destacadosData.filter((p) => !ofertasIds.has(p.product_id)).slice(0, 8),
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Error cargando productos:", err);
        setProductsError(
          "No se pudieron cargar los productos. Intenta de nuevo.",
        );
      } finally {
        if (!cancelled) setIsLoadingProducts(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation, isLoadingLocation, reloadKey]);

  const showOfertasSection =
    isLoadingProducts || (!productsError && ofertas.length > 0);

  /* ====== IntersectionObserver para reveal al scroll ====== */
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;
    const els = root.querySelectorAll(".reveal");
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [isLoadingProducts, ofertas, destacados]);

  return (
    <div ref={mainRef} style={{ backgroundColor: "var(--c-bg)" }}>
      <HeroBanner />

      {/* ===== Franja de confianza — fina e integrada ===== */}
      <section
        className="border-b"
        style={{
          backgroundColor: "var(--c-bg-2)",
          borderColor: "var(--c-line-2)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2">
            <span
              className="digemid-badge inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--c-muted)" }}
            >
              <svg className="digemid-check" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" className="digemid-ring" />
                <path d="M7 12.5l3.5 3.5L17 9" className="digemid-tick" />
              </svg>
              Certificado DIGEMID
            </span>
            <span
              className="hidden sm:inline h-4 w-px"
              style={{ backgroundColor: "var(--c-line)" }}
            />
            <span
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--c-muted)" }}
            >
              <Truck className="w-4 h-4" style={{ color: "var(--c-cool)" }} />
              Delivery en 24 – 48 h
            </span>
            <span
              className="hidden sm:inline h-4 w-px"
              style={{ backgroundColor: "var(--c-line)" }}
            />
            <span
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--c-muted)" }}
            >
              <CreditCard className="w-4 h-4" style={{ color: "var(--c-brand)" }} />
              Pago seguro
            </span>
          </div>
        </div>
      </section>

      {/* ===== Compra por necesidad ===== */}
      <section className="reveal max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
          >
            Compra por necesidad
          </h2>
          <p className="text-base" style={{ color: "var(--c-muted)" }}>
            Encuentra de forma rápida el tratamiento que necesitas, según tu síntoma o condición
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {NEEDS.map((need) => (
            <Link
              key={need.label}
              to={`/catalogo?nombre=${encodeURIComponent(need.query)}`}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{
                backgroundColor: need.bgColor,
                borderColor: "transparent",
                boxShadow: "var(--elev-xs)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--elev-card)";
                e.currentTarget.style.borderColor = "var(--c-line)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--elev-xs)";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              <div
                className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: "white" }}
              >
                <img
                  src={need.image}
                  alt={need.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <span
                className="text-sm font-semibold text-center leading-tight"
                style={{ color: "var(--c-text)" }}
              >
                {need.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Error */}
      {productsError && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div
            className="rounded-2xl p-8 text-center border"
            style={{
              backgroundColor: "var(--c-surface)",
              borderColor: "var(--c-error-soft)",
            }}
          >
            <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--c-error)" }} />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              No pudimos cargar los productos
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--c-muted)" }}>
              {productsError}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-lg font-semibold text-sm transition-colors"
              style={{ backgroundColor: "var(--c-brand)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--c-brand-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--c-brand)")
              }
            >
              Reintentar
            </button>
          </div>
        </section>
      )}

      {/* ===== Ofertas ===== */}
      {showOfertasSection && (
        <section
          className="reveal py-14 md:py-20"
          style={{ backgroundColor: "var(--c-bg-2)" }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-3">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
                >
                  Ofertas
                </h2>
                <p style={{ color: "var(--c-muted)" }}>
                  Aprovecha precios especiales por tiempo limitado
                  {selectedLocation && (
                    <span style={{ color: "var(--c-faint)" }}>
                      {" "}
                      · Sede{" "}
                      {selectedLocation.district ||
                        selectedLocation.location_name}
                    </span>
                  )}
                </p>
              </div>
              <Link
                to="/catalogo?is_offer=true"
                className="inline-flex items-center gap-2 font-semibold text-sm transition-colors"
                style={{ color: "var(--c-brand)" }}
              >
                Ver todas las ofertas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {isLoadingProducts
                ? Array.from({ length: 4 }).map((_, i) => (
                    <ProductCardSkeleton key={`oferta-skel-${i}`} />
                  ))
                : ofertas.map((product) => (
                    <ProductCard key={product.product_id} product={product} />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Productos Destacados ===== */}
      <section className="reveal max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-3">
          <div>
            <h2
              className="text-2xl md:text-3xl font-bold mb-2"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              Productos destacados
            </h2>
            <p style={{ color: "var(--c-muted)" }}>
              Los más vendidos de la semana
            </p>
          </div>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 font-semibold text-sm transition-colors"
            style={{ color: "var(--c-brand)" }}
          >
            Ver todos los productos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={`dest-skel-${i}`} />
            ))}
          </div>
        ) : !productsError && destacados.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center border"
            style={{
              backgroundColor: "var(--c-surface)",
              borderColor: "var(--c-line)",
            }}
          >
            <Pill className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--c-faint)" }} />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              Aún no hay productos disponibles
            </h3>
            <p className="text-sm" style={{ color: "var(--c-muted)" }}>
              {selectedLocation
                ? `No encontramos productos en la sede ${selectedLocation.district || selectedLocation.location_name}.`
                : "Selecciona una sede para ver los productos disponibles."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {destacados.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ===== ¿Por qué Genéricos? ===== */}
      <section
        className="reveal py-14 md:py-20"
        style={{ backgroundColor: "var(--c-bg-2)" }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2
              className="text-2xl md:text-3xl font-bold mb-4"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              ¿Por qué elegir genéricos?
            </h2>
            <p
              className="text-base md:text-lg max-w-3xl mx-auto"
              style={{ color: "var(--c-muted)" }}
            >
              Los medicamentos genéricos tienen el mismo principio activo que
              los de marca, están certificados por DIGEMID y te permiten ahorrar
              hasta 50%.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Card marca */}
            <div
              className="rounded-2xl p-8 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: "var(--c-surface)",
                borderColor: "var(--c-line)",
                boxShadow: "var(--elev-soft)",
              }}
            >
              <div
                className="text-xs font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "var(--c-faint)" }}
              >
                Medicamento de marca
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
              >
                Paracetamol Marca X
              </h3>
              <p className="mb-6 text-sm" style={{ color: "var(--c-muted)" }}>
                Paracetamol 500mg x 20 tabletas
              </p>
              <div
                className="text-4xl font-bold"
                style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
              >
                S/ 25.00
              </div>
            </div>
            {/* Card genérico */}
            <div
              className="rounded-2xl p-8 pt-9 relative transition-all duration-200 hover:shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, var(--c-surface) 0%, var(--c-success-soft) 100%)",
                border: "2px solid var(--c-success)",
                boxShadow: "var(--elev-card)",
              }}
            >
              <div
                className="absolute -top-3.5 left-6 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-md tracking-wider text-white"
                style={{ backgroundColor: "var(--c-success)" }}
              >
                RECOMENDADO
              </div>
              <div
                className="text-xs font-semibold mb-2 uppercase tracking-wide"
                style={{ color: "var(--c-success)" }}
              >
                Medicamento genérico
              </div>
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
              >
                Paracetamol Genérico
              </h3>
              <p className="mb-6 text-sm" style={{ color: "var(--c-muted)" }}>
                Paracetamol 500mg x 20 tabletas
              </p>
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                <div
                  className="text-4xl font-bold"
                  style={{ color: "var(--c-success)", fontFamily: "var(--font-display)" }}
                >
                  S/ 12.50
                </div>
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: "var(--c-success-soft)",
                    color: "var(--c-success)",
                  }}
                >
                  50% OFF
                </div>
              </div>
              <div
                className="flex items-start gap-2 text-sm"
                style={{ color: "var(--c-success)" }}
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-medium">
                  Mismo principio activo, certificado DIGEMID
                </span>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 text-white px-10 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: "var(--c-success)" }}
            >
              Explorar genéricos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Asesoría de Químicos Farmacéuticos (VERSIÓN CLARA) ===== */}
      <section
        className="reveal relative overflow-hidden py-14 md:py-20"
        style={{ backgroundColor: "var(--c-bg-2)" }}
      >
        {/* Glow decorativo sutil claro */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ backgroundColor: "rgba(241, 90, 41, 0.06)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ backgroundColor: "rgba(76, 130, 168, 0.06)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide mb-6"
                style={{
                  borderColor: "var(--c-line)",
                  backgroundColor: "var(--c-brand-soft)",
                  color: "var(--c-brand)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Profesionales colegiados
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold mb-5 leading-tight"
                style={{
                  color: "var(--c-text)",
                  fontFamily: "var(--font-display)",
                }}
              >
                Asesoría de químicos{" "}
                <span style={{ color: "var(--c-brand)" }}>farmacéuticos</span>
              </h2>
              <p
                className="text-base md:text-lg leading-relaxed mb-8"
                style={{
                  color: "var(--c-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Nuestros químicos farmacéuticos colegiados están disponibles
                para orientarte sobre el uso correcto de tus medicamentos,
                interacciones, dosis y alternativas genéricas equivalentes.
              </p>

              {/* Lista de beneficios — con CHECKS ANIMADOS en cascada */}
              <ul className="benefit-list space-y-3.5 mb-8">
                {[
                  "Orientación gratuita sobre uso de medicamentos",
                  "Resolución de dudas sobre interacciones y dosis",
                  "Recomendación de alternativas genéricas equivalentes",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-base font-medium"
                    style={{
                      color: "var(--c-text)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <svg className="benefit-check" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" className="benefit-ring" />
                      <path
                        d="M7 12.5l3.5 3.5L17 9"
                        className="benefit-tick"
                      />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98]"
                  style={{ backgroundColor: "var(--c-brand)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--c-brand-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--c-brand)")
                  }
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar ahora
                </Link>
                <a
                  href="tel:+5111234567"
                  className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98]"
                  style={{
                    borderColor: "var(--c-line)",
                    backgroundColor: "var(--c-surface)",
                    color: "var(--c-text)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--c-brand)";
                    e.currentTarget.style.color = "var(--c-brand)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--c-line)";
                    e.currentTarget.style.color = "var(--c-text)";
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Llamar
                </a>
              </div>
            </div>

            {/* Card visual derecha — clara y limpia */}
            <div className="flex justify-center">
              <div
                className="relative w-full max-w-sm aspect-square rounded-3xl flex items-center justify-center overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, var(--c-brand-soft) 0%, var(--c-cool-soft) 100%)",
                  border: "1px solid var(--c-line)",
                  boxShadow: "var(--elev-card)",
                }}
              >
                {/* Anillos decorativos */}
                <div
                  className="absolute inset-8 rounded-full border-2 opacity-40"
                  style={{ borderColor: "var(--c-brand)" }}
                />
                <div
                  className="absolute inset-16 rounded-full border-2 opacity-25"
                  style={{ borderColor: "var(--c-cool)" }}
                />
                <Stethoscope
                  className="w-24 h-24 relative z-10"
                  style={{ color: "var(--c-brand)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Tips de salud — banda fina ===== */}
      <section
        className="reveal border-b"
        style={{
          backgroundColor: "var(--c-cool-soft)",
          borderColor: "var(--c-line-2)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <span
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                backgroundColor: "var(--c-cool)",
                color: "white",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Tip de salud
            </span>
            <p className="text-sm md:text-base text-center md:text-left" style={{ color: "var(--c-text)" }}>
              <strong>¿Sabías que?</strong> Los medicamentos genéricos contienen el mismo principio
              activo y tienen la misma eficacia que los de marca. Eligiendo genéricos certificados
              por DIGEMID puedes ahorrar hasta un 70%.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Nuestras Tiendas ===== */}
      <section className="reveal max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="text-center mb-10">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
          >
            Visita nuestras tiendas
          </h2>
          <p style={{ color: "var(--c-muted)" }}>
            Atención personalizada y stock disponible
          </p>
        </div>
        {isLoadingLocation ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-2xl border h-[28rem] animate-pulse"
                style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-line)" }}
              />
            ))}
          </div>
        ) : locations.length === 0 ? (
          <div
            className="rounded-2xl p-10 border text-center"
            style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-line)", color: "var(--c-muted)" }}
          >
            <MapPin className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--c-brand)" }} />
            <p>No hay sedes disponibles por el momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {locations.map((store) => {
              const mapQuery = mapsQueryOf(store);
              const tel = telHref(store.location_phone);
              const mail = mailtoHref(store.location_email);
              const addressLine = [store.location_address, store.district]
                .filter(Boolean)
                .join(" · ");
              return (
                <div
                  key={store.location_id}
                  className="group rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 flex flex-col"
                  style={{
                    backgroundColor: "var(--c-surface)",
                    borderColor: "var(--c-line)",
                    boxShadow: "var(--elev-card)",
                  }}
                >
                  {mapQuery && (
                    <StoreMap
                      query={mapQuery}
                      title={store.location_name}
                      lat={store.latitude != null ? Number(store.latitude) : null}
                      lng={store.longitude != null ? Number(store.longitude) : null}
                      aspectRatio="16 / 9"
                      className="border-b"
                    />
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    {/* Sede + dirección */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className="p-2.5 rounded-2xl flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: "var(--c-brand-soft)" }}
                      >
                        <MapPin className="w-5 h-5" style={{ color: "var(--c-brand)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg md:text-xl font-bold leading-tight tracking-tight"
                          style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
                        >
                          {store.location_name}
                        </h3>
                        {addressLine && (
                          <p
                            className="text-sm mt-1 leading-relaxed"
                            style={{ color: "var(--c-muted)" }}
                          >
                            {addressLine}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Horario */}
                    {store.schedule && (
                      <div
                        className="flex items-center gap-2 mt-4"
                        style={{ color: "var(--c-muted)" }}
                      >
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{store.schedule}</span>
                      </div>
                    )}

                    {/* Acciones: un primario + un secundario, compactas */}
                    <div className="mt-auto pt-4 flex flex-col gap-2.5">
                      <div className="flex gap-2.5">
                        {tel && (
                          <a
                            href={tel}
                            className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
                            style={{
                              backgroundColor: "var(--c-brand)",
                              boxShadow: "var(--elev-soft)",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--c-brand-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--c-brand)")}
                          >
                            <Phone className="w-4 h-4" />
                            Llamar
                          </a>
                        )}
                        {mapQuery && (
                          <a
                            href={mapsSearchUrl(mapQuery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-[0.98]"
                            style={{ color: "var(--c-text)", borderColor: "var(--c-line)", backgroundColor: "var(--c-surface)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "var(--c-brand)";
                              e.currentTarget.style.color = "var(--c-brand)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "var(--c-line)";
                              e.currentTarget.style.color = "var(--c-text)";
                            }}
                          >
                            <Navigation className="w-4 h-4" />
                            Cómo llegar
                          </a>
                        )}
                      </div>

                      {/* Enlaces sobrios, en la misma fila */}
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          to="/catalogo"
                          className="inline-flex items-center gap-1.5 font-semibold text-sm transition-colors hover:gap-2.5"
                          style={{ color: "var(--c-brand)" }}
                        >
                          Ver disponibilidad
                          <ArrowRight className="w-4 h-4 transition-transform" />
                        </Link>
                        {mail && (
                          <a
                            href={mail}
                            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                            style={{ color: "var(--c-muted)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c-text)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-muted)")}
                          >
                            <Mail className="w-4 h-4" />
                            Contáctanos
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}