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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";
import { HeroBanner } from "../components/HeroBanner";
import { api } from "../lib/api";
import { useLocations } from "../lib/LocationContext";
import type { Category, Product } from "../lib/types";

/* ============================================================
   "Compra por necesidad" — chips por síntoma / condición
   Enlaza a catálogo filtrado por nombre (búsqueda libre)
   ============================================================ */
const NEEDS: Array<{
  label: string;
  icon: LucideIcon;
  query: string;
  color: string;
  bgColor: string;
}> = [
  {
    label: "Gripe y resfríos",
    icon: Thermometer,
    query: "gripe",
    color: "#4C82A8",
    bgColor: "#EEF4F8",
  },
  {
    label: "Dolor y fiebre",
    icon: Activity,
    query: "dolor",
    color: "#C0796A",
    bgColor: "#FDF2EF",
  },
  {
    label: "Alergias",
    icon: Wind,
    query: "alergia",
    color: "#3F9D8C",
    bgColor: "#EDF7F5",
  },
  {
    label: "Cuidado del bebé",
    icon: Baby,
    query: "bebe",
    color: "#C77699",
    bgColor: "#FBF0F4",
  },
  {
    label: "Vitaminas y energía",
    icon: Apple,
    query: "vitamina",
    color: "#8B7BB8",
    bgColor: "#F3F0FA",
  },
  {
    label: "Digestivo",
    icon: HeartPulse,
    query: "digestivo",
    color: "#C79A4B",
    bgColor: "#FBF6ED",
  },
];

export function Home() {
  const { selectedLocation, isLoading: isLoadingLocation } = useLocations();

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
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--c-muted)" }}
            >
              <Shield className="w-4 h-4" style={{ color: "var(--c-success)" }} />
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
            Encuentra rápidamente lo que necesitas por síntoma o condición
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {NEEDS.map((need) => {
            const Icon = need.icon;
            return (
              <Link
                key={need.label}
                to={`/catalogo?nombre=${encodeURIComponent(need.query)}`}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: need.bgColor,
                  borderColor: "transparent",
                  boxShadow: "var(--elev-xs)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "var(--elev-card)";
                  e.currentTarget.style.borderColor = need.color + "40";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "var(--elev-xs)";
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: need.color + "18" }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: need.color }}
                  />
                </div>
                <span
                  className="text-sm font-semibold text-center leading-tight"
                  style={{ color: "var(--c-text)" }}
                >
                  {need.label}
                </span>
              </Link>
            );
          })}
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

      {/* ===== Asesoría de Químicos Farmacéuticos ===== */}
      <section
        className="reveal relative overflow-hidden py-14 md:py-20"
        style={{ backgroundColor: "var(--c-ink-2)" }}
      >
        {/* Glow decorativo */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ backgroundColor: "rgba(241, 90, 41, 0.08)" }}
        />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide mb-6"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#38BDF8",
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Profesionales colegiados
              </span>
              <h2
                className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Asesoría de químicos
                <br />
                <span
                  className="bg-gradient-to-r from-[#F15A29] to-[#FB923C] bg-clip-text text-transparent"
                >
                  farmacéuticos
                </span>
              </h2>
              <p
                className="text-base md:text-lg leading-relaxed mb-8"
                style={{ color: "rgba(226,232,240,0.8)" }}
              >
                Nuestros químicos farmacéuticos colegiados están disponibles
                para orientarte sobre el uso correcto de tus medicamentos,
                posibles interacciones y alternativas genéricas equivalentes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/catalogo"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 shadow-lg active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--c-brand)",
                    boxShadow: "0 8px 24px -8px rgba(241,90,41,0.35)",
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Consultar ahora
                </Link>
                <a
                  href="tel:+5111234567"
                  className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 active:scale-[0.98]"
                  style={{
                    borderColor: "rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Llamar
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <div
                className="w-full max-w-sm aspect-square rounded-3xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(241,90,41,0.08) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Stethoscope
                  className="w-24 h-24"
                  style={{ color: "rgba(255,255,255,0.15)" }}
                />
                {/* // TODO: reemplazar con imagen real del equipo farmacéutico */}
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
              <strong>¿Sabías que?</strong> Los medicamentos genéricos tienen la misma eficacia
              que los de marca. La diferencia está solo en el precio —
              puedes ahorrar hasta un 70% eligiendo genéricos certificados por DIGEMID.
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
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              name: "Boticas Central - Ate",
              address: "Av. Separadora Industrial 123, Ate - Lima",
              hours: "Lun - Dom: 8:00 AM - 10:00 PM",
            },
            {
              name: "Boticas Central - Santa Anita",
              address: "Av. Los Frutales 456, Santa Anita - Lima",
              hours: "Lun - Dom: 8:00 AM - 10:00 PM",
            },
          ].map((store) => (
            <div
              key={store.name}
              className="rounded-2xl p-8 border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: "var(--c-surface)",
                borderColor: "var(--c-line)",
                boxShadow: "var(--elev-soft)",
              }}
            >
              <div className="flex items-start gap-5">
                <div
                  className="p-4 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: "var(--c-brand-soft)" }}
                >
                  <MapPin className="w-7 h-7" style={{ color: "var(--c-brand)" }} />
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-2 font-semibold"
                    style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
                  >
                    {store.name}
                  </h3>
                  <p className="mb-3 text-sm" style={{ color: "var(--c-muted)" }}>
                    {store.address}
                  </p>
                  <div
                    className="flex items-center gap-2 mb-4"
                    style={{ color: "var(--c-muted)" }}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{store.hours}</span>
                  </div>
                  <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-2 font-semibold transition-colors text-sm"
                    style={{ color: "var(--c-brand)" }}
                  >
                    Ver disponibilidad
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
