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
  ShieldCheck,
  Headset,
  ShoppingBag,
  Search,
} from "lucide-react";
import { ProductCarousel } from "../components/ProductCarousel";
import { ProductCardSkeleton } from "../components/Skeleton";
import { HeroBanner } from "../components/HeroBanner";
import { SectionHeader } from "../components/SectionHeader";
import { PromoImageRow } from "../components/PromoImageRow";
import { StoreMap } from "../components/StoreMap";
import { homeImage } from "../lib/homeImages";
import { api } from "../lib/api";
import { useLocations } from "../lib/LocationContext";
import {
  telHref,
  mailtoHref,
  mapsQueryOf,
  mapsSearchUrl,
  storePhone,
} from "../lib/contact";
import type { Category, Product } from "../lib/types";

/* ============================================================
   Franja de beneficios — confianza de farmacia, tono cercano
   Un solo acento de marca en el ícono; resto neutro.
   ============================================================ */
const BENEFITS: Array<{
  icon: typeof Truck;
  title: string;
  subtitle: string;
}> = [
  {
    icon: Truck,
    title: "Delivery a todo Lima",
    subtitle: "Recíbelo en 24 – 48 horas",
  },
  {
    icon: CreditCard,
    title: "Múltiples formas de pago",
    subtitle: "Yape, Plin, tarjetas y efectivo",
  },
  {
    icon: ShieldCheck,
    title: "Pago 100% seguro",
    subtitle: "Pasarelas confiables y protegidas",
  },
  {
    icon: Headset,
    title: "Asesoría farmacéutica",
    subtitle: "Te orientamos en tu compra",
  },
];

export function Home() {
  /* Imágenes del home — auto-detectadas desde src/assets/home/ (ver homeImages.ts).
     Si el archivo no existe aún, el valor es undefined y se muestra un fallback. */
  const bannerRetiroSrc = homeImage("banner-retiro"); // banner Dermatología
  const bannerGenericosSrc = homeImage("banner-genericos"); // franja de marca (opcional)

  const { selectedLocation, isLoading: isLoadingLocation, locations } = useLocations();

  const [ofertas, setOfertas] = useState<Product[]>([]);
  const [destacados, setDestacados] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [categorias, setCategorias] = useState<Category[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Destino del banner promocional: categoría Dermatología.
  // Resolvemos el category_id real desde la BD (no hardcodear ids frágiles)
  // y construimos la misma ruta que usa el resto de categorías:
  //   /catalogo?category_id=<id>
  // Fallback seguro a búsqueda por nombre si la categoría aún no existe.
  const [bannerCategoryHref, setBannerCategoryHref] = useState(
    "/catalogo?nombre=Dermatolog%C3%ADa",
  );
  // Destino de la tarjeta promo (countdown): categoría Mamá & Bebé.
  // Misma estrategia que Dermatología: resolvemos el category_id real desde la BD,
  // con fallback seguro a búsqueda por nombre.
  const [mamaBebeHref, setMamaBebeHref] = useState(
    "/catalogo?nombre=Mam%C3%A1%20%26%20Beb%C3%A9",
  );
  // Destino de la imagen promo-wide ("Bienestar diario"): categoría Vitaminas.
  // Misma estrategia: category_id real desde la BD con fallback por nombre.
  const [vitaminasHref, setVitaminasHref] = useState(
    "/catalogo?nombre=Vitaminas",
  );
  useEffect(() => {
    api.categories
      .getAll()
      .then((cats) => {
        const derma = cats.find(
          (c) =>
            c.category_name.trim().toLowerCase() === "dermatología" ||
            c.category_name.trim().toLowerCase() === "dermatologia",
        );
        if (derma) {
          setBannerCategoryHref(`/catalogo?category_id=${derma.category_id}`);
        }
        const mama = cats.find((c) => {
          const n = c.category_name.trim().toLowerCase();
          return n.includes("mam") && n.includes("beb");
        });
        if (mama) {
          setMamaBebeHref(`/catalogo?category_id=${mama.category_id}`);
        }
        const vitaminas = cats.find((c) =>
          c.category_name.trim().toLowerCase().includes("vitamina"),
        );
        if (vitaminas) {
          setVitaminasHref(`/catalogo?category_id=${vitaminas.category_id}`);
        }
      })
      .catch(() => {
        /* mantiene los fallbacks por nombre */
      });
  }, []);

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

      {/* ===== Franja de beneficios — barra fina sobre blanco =====
          Sin tarjetas gruesas ni crema: una sola barra con divisores finos
          (hairlines de 1px logradas con gap-px + fondo de línea). 4 en desktop,
          2x2 en tablet, 1 columna apilada en móvil. */}
      <section
        className="reveal pt-12 md:pt-16 pb-0"
        style={{ backgroundColor: "var(--c-bg-2)" }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: "var(--c-line)",
              borderColor: "var(--c-line)",
              boxShadow: "var(--elev-xs)",
            }}
          >
            {BENEFITS.map(({ icon: Icon, title, subtitle }) => (
              <div
                key={title}
                className="flex items-center gap-3.5 px-5 py-4 md:py-5"
                style={{ backgroundColor: "var(--c-surface)" }}
              >
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--c-brand-soft)" }}
                >
                  <Icon
                    className="w-[18px] h-[18px]"
                    strokeWidth={1.75}
                    style={{ color: "var(--c-brand)" }}
                  />
                </span>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-semibold leading-tight"
                    style={{
                      color: "var(--c-text)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-[12.5px] mt-0.5 leading-snug"
                    style={{ color: "var(--c-muted)" }}
                  >
                    {subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Error */}
      {productsError && (
        <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
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
          className="reveal py-12 md:py-16"
          style={{ backgroundColor: "var(--c-bg-2)" }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <SectionHeader
              className="mb-10"
              title="Ofertas"
              subtitle="Aprovecha precios especiales por tiempo limitado"
              action={{
                to: "/catalogo?is_offer=true",
                label: "Ver todas las ofertas",
              }}
            />
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={`oferta-skel-${i}`} />
                ))}
              </div>
            ) : (
              <ProductCarousel products={ofertas} />
            )}
          </div>
        </section>
      )}

      {/* ===== Banner promocional — acceso directo a categoría (imagen + buscador, clickeable) =====
          Contenedor un poco más angosto que el resto (max-w-6xl ≈ -10%) para que el
          banner no llegue tan al borde y quede más compacto; al usar la imagen h-auto,
          su altura baja de forma proporcional (sin deformar). La fila de 2 imágenes va
          dentro del MISMO contenedor, así que queda alineada a este ancho. */}
      <section
        className="reveal py-12 md:py-16"
        style={{ backgroundColor: "var(--c-bg)" }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <Link
            to={bannerCategoryHref}
            aria-label="Explora la categoría Dermatología"
            className="group relative block w-full overflow-hidden cursor-pointer transition-all duration-300 active:scale-[0.997]"
            style={{ borderRadius: "24px", boxShadow: "var(--elev-soft)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "var(--elev-card)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "var(--elev-soft)")
            }
          >
            {bannerRetiroSrc ? (
              <img
                src={bannerRetiroSrc}
                alt="Cuidado dermatológico: explora nuestra selección de dermocosmética"
                className="block w-full h-auto"
                loading="lazy"
              />
            ) : (
              <div
                className="w-full aspect-[1024/320] flex flex-col items-center justify-center gap-3"
                style={{
                  backgroundColor: "var(--c-bg-2)",
                  border: "1px solid var(--c-line)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "var(--c-brand-soft)" }}
                >
                  <ShoppingBag
                    className="w-8 h-8"
                    strokeWidth={1.5}
                    style={{ color: "var(--c-brand)" }}
                  />
                </div>
                <span
                  className="text-sm font-medium tracking-wide"
                  style={{ color: "var(--c-muted)" }}
                >
                  Explora Dermatología
                </span>
              </div>
            )}

            {/* Barra tipo buscador superpuesta — solo desktop/tablet.
               Ubicada en el espacio libre inferior-izquierdo (bajo el texto del banner),
               centrada dentro de esa zona. pointer-events-none: el click lo recibe el
               <Link> que envuelve todo. */}
            <div className="pointer-events-none hidden sm:flex absolute inset-x-0 bottom-[11%] justify-start">
              <div className="w-[56%] flex justify-center">
                <div
                  className="inline-flex items-center gap-3 rounded-full backdrop-blur-md transition-all duration-300 group-hover:scale-[1.035] group-hover:shadow-lg"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(255,255,255,0.85)",
                    boxShadow: "var(--elev-card)",
                    padding: "8px 20px 8px 8px",
                  }}
                >
                  <span
                    className="flex items-center justify-center rounded-full w-9 h-9 shrink-0"
                    style={{ backgroundColor: "var(--c-brand)" }}
                  >
                    <Search
                      className="w-[18px] h-[18px]"
                      strokeWidth={2.4}
                      style={{ color: "#fff" }}
                    />
                  </span>
                  <span
                    className="text-[15px] md:text-base font-semibold whitespace-nowrap tracking-tight"
                    style={{ color: "var(--c-text)" }}
                  >
                    Explora Dermatología
                  </span>
                  <ArrowRight
                    className="w-5 h-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ color: "var(--c-brand)" }}
                  />
                </div>
              </div>
            </div>
          </Link>

          {/* Móvil: el buscador va DEBAJO del banner, en una sola columna
             (no se superpone para no tapar texto ni productos). Mismo destino. */}
          <Link
            to={bannerCategoryHref}
            aria-label="Explora la categoría Dermatología"
            className="sm:hidden mt-3 flex items-center gap-2.5 rounded-full cursor-pointer transition-all duration-200 active:scale-[0.99]"
            style={{
              backgroundColor: "var(--c-surface)",
              border: "1px solid var(--c-line)",
              boxShadow: "var(--elev-soft)",
              padding: "6px 14px 6px 6px",
            }}
          >
            <span
              className="flex items-center justify-center rounded-full w-8 h-8 shrink-0"
              style={{ backgroundColor: "var(--c-brand-soft)" }}
            >
              <Search
                className="w-4 h-4"
                strokeWidth={2.2}
                style={{ color: "var(--c-brand)" }}
              />
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--c-text)" }}
            >
              Explora Dermatología
            </span>
            <ArrowRight
              className="w-4 h-4 shrink-0 ml-auto"
              style={{ color: "var(--c-brand)" }}
            />
          </Link>

          {/* ===== Fila promocional (mismo ancho del banner) =====
                · promo-wide   (izq, ~60%, apaisada) → categoría Vitaminas
                · tarjeta promo (der, ~40%) → countdown + CTA a Mamá & Bebé
              La imagen izquierda se auto-detecta (ver homeImages.ts):
                · src/assets/home/promo-wide.webp */}
          <div className="mt-4 md:mt-5">
            <PromoImageRow
              left={{
                img: "promo-wide",
                alt: "Bienestar diario: vitaminas y suplementos",
                to: vitaminasHref,
                fallback: "promo-wide.webp",
              }}
              promo={{
                img: "promo-square",
                to: mamaBebeHref,
                label: "Promo del día",
                title: "Llévate Nutri-Vite al 50%",
                subtitle: "Por la compra de un Enfagrow Premium",
                cta: "Comprar ahora",
              }}
            />
          </div>
        </div>
      </section>

      {/* ===== Productos Destacados ===== */}
      <section className="reveal max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionHeader
          className="mb-10"
          title="Productos destacados"
          subtitle="Los más vendidos de la semana"
          action={{ to: "/catalogo", label: "Ver todos los productos" }}
        />

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
          <ProductCarousel products={destacados} />
        )}
      </section>

      {/* ===== ¿Por qué Genéricos? ===== */}
      <section
        className="reveal py-12 md:py-16"
        style={{ backgroundColor: "var(--c-bg-2)" }}
      >
        <div className="max-w-7xl mx-auto px-4">
          {/* Slot opcional: franja de marca (auto-detectada). Solo aparece si
              subes la imagen — si falta, no se renderiza nada (sin hueco).
              Sube como: src/assets/home/banner-genericos.webp (apaisada, ~1024x260). */}
          {bannerGenericosSrc && (
            <img
              src={bannerGenericosSrc}
              alt="Genéricos certificados por DIGEMID al mejor precio"
              loading="lazy"
              className="block w-full h-auto mb-12"
              style={{ borderRadius: "24px", boxShadow: "var(--elev-soft)" }}
            />
          )}
          <SectionHeader
            className="mb-12"
            align="center"
            title="¿Por qué elegir genéricos?"
            subtitle="Mismo principio activo que los de marca, certificados por DIGEMID y hasta 50% más económicos."
          />
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
        className="reveal relative overflow-hidden py-12 md:py-16"
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
              <SectionHeader
                className="mb-8"
                eyebrow={
                  <span
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide"
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
                }
                title={
                  <>
                    Asesoría de químicos{" "}
                    <span style={{ color: "var(--c-brand)" }}>farmacéuticos</span>
                  </>
                }
                subtitle="Nuestros químicos farmacéuticos colegiados te orientan sobre el uso correcto de tus medicamentos, interacciones, dosis y alternativas genéricas equivalentes."
              />

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
                <a
                  href="https://wa.me/51929255281?text=Hola%2C%20quiero%20una%20consulta."
                  target="_blank"
                  rel="noopener noreferrer"
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
                </a>
                <a
                  href="tel:+51929255281"
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
      <section id="tiendas" className="reveal max-w-7xl mx-auto px-4 py-12 md:py-16">
        <SectionHeader
          className="mb-10"
          align="center"
          title="Visita nuestras tiendas"
          subtitle="Atención personalizada y stock disponible"
        />
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
              const tel = telHref(storePhone(store));
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
                      className="border-b h-[170px] md:h-[210px]"
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