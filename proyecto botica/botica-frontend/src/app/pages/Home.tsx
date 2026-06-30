import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Clock,
  Truck,
  Shield,
  ArrowRight,
  BadgeCheck,
  TrendingDown,
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
import { ProductStrip } from "../components/ProductStrip";
import { ProductCardSkeleton } from "../components/Skeleton";
import { Container } from "../components/Container";
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
  whatsappHref,
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

/* ============================================================
   Franjas de productos ligadas a sus banners (selección editorial).
   Buscamos los productos por NOMBRE EXACTO dentro del catálogo de la
   sede (no hardcodeamos ids ni precios: precios/ofertas salen de la BD).
   ============================================================ */

// Nombres exactos (tal cual en la BD) — el orden define el orden de la franja.
const DERMA_STRIP_NAMES = [
  "Gel Limpiador Concentrado Eucerin Dermopure para Piel Grasa",
  "Sérum Anti-manchas Eucerin DermoPure Triple Effect para Piel Grasa",
  "Exfoliante Eucerin DermoPURE Oil Control para piel grasa 100 ml",
  "Fluido Facial Hidratante Matificante Eucerin DermoPure para Piel Grasa",
];

const VITAMINAS_STRIP_NAMES = [
  "Nature's Bounty Biotina 5000 mcg 72 cápsulas blandas de liberación rápida",
  "Sunvit B-12 1000mcg Tableta",
  "Solgar Concentrado de aceite de pescado con omega-3 con 120 cápsulas blandas",
  "Centrum Suplemento multivitamínico para mujeres con 200 comprimidos",
];

// Normaliza para comparar nombres de forma robusta: sin tildes, minúsculas y
// espacios colapsados (tolera diferencias menores de capitalización/acentos).
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");
// Comillas/apóstrofos rectos y tipográficos → fuera (p. ej. "Nature's").
const APOSTROPHES = new RegExp("['\\u2018\\u2019]", "g");
const normalizeName = (s: string) =>
  s
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(APOSTROPHES, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// Selecciona los productos cuyos nombres coinciden con `names`, preservando ese
// orden. Solo incluye los encontrados (si falta alguno, no se inventa).
function pickByNames(all: Product[], names: string[]): Product[] {
  const byName = new Map(all.map((p) => [normalizeName(p.product_name), p]));
  return names
    .map((n) => byName.get(normalizeName(n)))
    .filter((p): p is Product => Boolean(p));
}

export function Home() {
  /* Imágenes del home — auto-detectadas desde src/assets/home/ (ver homeImages.ts).
     Si el archivo no existe aún, el valor es undefined y se muestra un fallback. */
  const bannerRetiroSrc = homeImage("banner-retiro"); // banner Dermatología
  const bannerGenericosSrc = homeImage("banner-genericos"); // franja de marca (opcional)
  const asesoriaSrc = homeImage("asesoria"); // foto del químico farmacéutico (lado derecho de la sección Asesoría)

  const { selectedLocation, isLoading: isLoadingLocation, locations } = useLocations();

  const [ofertas, setOfertas] = useState<Product[]>([]);
  const [destacados, setDestacados] = useState<Product[]>([]);
  // Catálogo completo de la sede (sirve para armar las franjas por nombre).
  const [allProducts, setAllProducts] = useState<Product[]>([]);
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

        // Catálogo completo de la sede → fuente de las franjas (por nombre).
        setAllProducts(destacadosData);

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

  // Franjas editoriales (4 productos en oferta) buscadas por nombre exacto en el
  // catálogo de la sede. Precios/ofertas/stock vienen de la BD vía ProductCard.
  const dermaStrip = useMemo(
    () => pickByNames(allProducts, DERMA_STRIP_NAMES),
    [allProducts],
  );
  const vitaminasStrip = useMemo(
    () => pickByNames(allProducts, VITAMINAS_STRIP_NAMES),
    [allProducts],
  );

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
        className="reveal pt-6 md:pt-8 pb-0"
        style={{ backgroundColor: "var(--c-bg-2)" }}
      >
        <Container>
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
        </Container>
      </section>

      {/* Error */}
      {productsError && (
        <section className="py-8 md:py-12">
          <Container>
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
          </Container>
        </section>
      )}

      {/* ===== Ofertas ===== */}
      {showOfertasSection && (
        <section
          className="reveal py-8 md:py-12"
          style={{ backgroundColor: "var(--c-bg-2)" }}
        >
          <Container>
            <SectionHeader
              className="mb-8"
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
          </Container>
        </section>
      )}

      {/* ===== Banner promocional — acceso directo a categoría (imagen + buscador, clickeable) =====
          Usa el MISMO <Container> (max-w-7xl) que Ofertas/Destacados para que el
          banner quede alineado al mismo borde izq/der que el resto del home. La
          imagen va con h-auto, así que su altura baja de forma proporcional. La
          fila de 2 imágenes va dentro del MISMO contenedor → mismo ancho total. */}
      <section
        className="reveal py-8 md:py-12"
        style={{ backgroundColor: "var(--c-bg)" }}
      >
        <Container>
          <Link
            to={bannerCategoryHref}
            aria-label="Explora la categoría Dermatología"
            className="group relative block w-full overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 active:scale-[0.997]"
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

          {/* ===== Franja Dermatología — continuación del banner Eucerin =====
              Panel conectado (poca separación + acento naranja) con 4 productos
              en oferta de la categoría, usando las mismas tarjetas de Destacados. */}
          {(isLoadingProducts || dermaStrip.length > 0) && (
            <ProductStrip
              title="Dermatología"
              subtitle="Rutina Eucerin DermoPure para piel grasa, con precios de oferta"
              action={{ to: bannerCategoryHref, label: "Ver todos los productos" }}
              products={dermaStrip}
              loading={isLoadingProducts}
            />
          )}

          {/* ===== Fila promocional (mismo ancho del banner) =====
                · promo-wide   (izq, ~60%, apaisada) → categoría Vitaminas
                · tarjeta promo (der, ~40%) → countdown + CTA a Mamá & Bebé
              La imagen izquierda se auto-detecta (ver homeImages.ts):
                · src/assets/home/promo-wide.webp */}
          <div className="mt-8 md:mt-12 mb-4 md:mb-6">
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

          {/* ===== Franja Vitaminas — continuación del banner de bienestar =====
              Mismo patrón que Dermatología: 4 productos en oferta de la categoría
              Vitaminas, ligados visualmente al banner "Bienestar diario". */}
          {(isLoadingProducts || vitaminasStrip.length > 0) && (
            <ProductStrip
              title="Vitaminas"
              subtitle="Suplementos y multivitamínicos para tu bienestar diario, en oferta"
              action={{ to: vitaminasHref, label: "Ver todos los productos" }}
              products={vitaminasStrip}
              loading={isLoadingProducts}
            />
          )}
        </Container>
      </section>

      {/* ===== Productos Destacados ===== */}
      <section className="reveal py-8 md:py-12">
        <Container>
        <SectionHeader
          className="mb-8"
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
        </Container>
      </section>

      {/* ===== ¿Por qué Genéricos? ===== */}
      <section
        className="reveal py-8 md:py-12"
        style={{ backgroundColor: "var(--c-bg-2)" }}
      >
        <Container>
          {/* Slot opcional: franja de marca (auto-detectada). Solo aparece si
              subes la imagen — si falta, no se renderiza nada (sin hueco).
              Sube como: src/assets/home/banner-genericos.webp (apaisada, ~1024x260). */}
          {bannerGenericosSrc && (
            <img
              src={bannerGenericosSrc}
              alt="Genéricos certificados por DIGEMID al mejor precio"
              loading="lazy"
              className="block w-full h-auto mb-8"
              style={{ borderRadius: "24px", boxShadow: "var(--elev-soft)" }}
            />
          )}
          <SectionHeader
            className="mb-10"
            align="center"
            title="¿Por qué elegir genéricos?"
            subtitle="Mismo principio activo y la misma eficacia que los de marca, certificados por DIGEMID y hasta 50% más económicos."
          />

          {/* Comparación marca vs genérico — bloques de precio alineados al
              mismo nivel (mt-auto) para que el ahorro se lea de un vistazo.
              Marca: atenuada/neutra. Genérico: destacada con acento verde. */}
          <div className="relative grid md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto items-stretch">
            {/* ----- Medicamento de marca (neutro) ----- */}
            <div
              className="rounded-2xl p-6 md:p-8 border flex flex-col"
              style={{
                backgroundColor: "var(--c-bg)",
                borderColor: "var(--c-line)",
              }}
            >
              <span
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--c-faint)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--c-faint)" }}
                  aria-hidden="true"
                />
                Medicamento de marca
              </span>
              <h3
                className="mt-3 text-lg md:text-xl font-bold leading-snug"
                style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
              >
                Paracetamol Marca X
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--c-muted)" }}>
                Paracetamol 500 mg · 20 tabletas
              </p>
              <div className="mt-auto pt-8">
                <div
                  className="text-3xl md:text-[34px] font-bold leading-none"
                  style={{
                    color: "var(--c-text)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  S/ 25.00
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--c-faint)" }}>
                  Precio de referencia de marca
                </p>
              </div>
            </div>

            {/* ----- Medicamento genérico (recomendado, acento verde) ----- */}
            <div
              className="relative rounded-2xl p-6 md:p-8 flex flex-col"
              style={{
                backgroundColor: "var(--c-surface)",
                border: "1.5px solid var(--c-success)",
                boxShadow: "var(--elev-card)",
              }}
            >
              {/* Badge RECOMENDADO — elegante, con check */}
              <span
                className="absolute -top-3 right-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider text-white shadow-sm"
                style={{ backgroundColor: "var(--c-success)" }}
              >
                <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Recomendado
              </span>
              <span
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--c-success)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--c-success)" }}
                  aria-hidden="true"
                />
                Medicamento genérico
              </span>
              <h3
                className="mt-3 text-lg md:text-xl font-bold leading-snug"
                style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
              >
                Paracetamol Genérico
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--c-muted)" }}>
                Paracetamol 500 mg · 20 tabletas
              </p>
              <div className="mt-auto pt-8">
                <div className="flex items-end gap-2.5 flex-wrap">
                  <span
                    className="text-3xl md:text-[34px] font-bold leading-none"
                    style={{
                      color: "var(--c-success)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    S/ 12.50
                  </span>
                  <span
                    className="text-base line-through leading-none mb-0.5"
                    style={{ color: "var(--c-faint)" }}
                  >
                    S/ 25.00
                  </span>
                  <span
                    className="mb-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
                    style={{
                      backgroundColor: "var(--c-success-soft)",
                      color: "var(--c-success)",
                    }}
                  >
                    -50%
                  </span>
                </div>
                <p
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: "var(--c-success)" }}
                >
                  <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                  Ahorras S/ 12.50 en esta compra
                </p>
              </div>
            </div>

            {/* Conector central (solo md+): liga ambas tarjetas mostrando que el
                precio "baja" al pasar de marca a genérico. */}
            <div
              className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full items-center justify-center"
              style={{
                backgroundColor: "var(--c-surface)",
                border: "1.5px solid var(--c-success)",
                boxShadow: "var(--elev-soft)",
              }}
              aria-hidden="true"
            >
              <TrendingDown
                className="w-5 h-5"
                style={{ color: "var(--c-success)" }}
              />
            </div>
          </div>

          {/* Sello de confianza DIGEMID — limpio, ancho completo bajo la comparación */}
          <div
            className="mt-4 md:mt-6 max-w-5xl mx-auto rounded-2xl border px-5 py-4 flex items-center justify-center gap-3 text-center"
            style={{
              backgroundColor: "var(--c-surface)",
              borderColor: "var(--c-line)",
              boxShadow: "var(--elev-xs)",
            }}
          >
            <span
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--c-success-soft)" }}
            >
              <ShieldCheck
                className="w-5 h-5"
                style={{ color: "var(--c-success)" }}
                aria-hidden="true"
              />
            </span>
            <p
              className="text-sm md:text-[15px] leading-snug"
              style={{ color: "var(--c-text)" }}
            >
              <strong style={{ color: "var(--c-success)" }}>
                Mismo principio activo
              </strong>{" "}
              y la misma eficacia, <strong>certificado por DIGEMID</strong>.
            </p>
          </div>

          <div className="text-center mt-8">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 text-white px-9 py-3.5 rounded-xl font-bold text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: "var(--c-success)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#15803D")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--c-success)")
              }
            >
              Explorar genéricos
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ===== Asesoría de Químicos Farmacéuticos (VERSIÓN CLARA) ===== */}
      {/* id="asesoria": ancla usada por el FAB de acción rápida para hacer scroll aquí. */}
      <section
        id="asesoria"
        className="reveal relative overflow-hidden pt-6 md:pt-8 pb-4 md:pb-6 scroll-mt-40"
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
        <Container className="relative">
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
                  href={whatsappHref('915252167', 'Hola, quisiera una asesoría farmacéutica 👨‍⚕️')}
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

            {/* Visual derecha — imagen GRANDE que SANGRA hacia el borde derecho de la
               sección (negative margin) y se funde con el fondo por sus 4 bordes.
               El fade se logra intersectando 4 máscaras lineales (una por lado): se
               desvanece antes en IZQUIERDA (toca el texto) y ABAJO (se une con la
               sección celeste de Tips). Sin recuadro ni esquinas visibles.
               Si no hay imagen (asesoria.{webp,png,jpg}), cae al fallback de anillos. */}
            <div className="flex justify-center md:justify-end md:-mr-4 lg:-mr-8">
              {asesoriaSrc ? (
                <img
                  src={asesoriaSrc}
                  alt="Químico farmacéutico colegiado de Botica Central brindando asesoría"
                  loading="lazy"
                  decoding="async"
                  className="w-full max-w-xs md:max-w-sm lg:max-w-md aspect-[4/3] object-cover object-center select-none pointer-events-none"
                  style={{
                    // Fade POR LADO (sin borde superior): 3 máscaras lineales intersectadas.
                    // - izquierda: transparente -> negro 42% (fade fuerte, toca el texto)
                    // - derecha:   transparente -> negro 12% (fade suave)
                    // - abajo:     transparente -> negro 38% hacia arriba (fade fuerte abajo)
                    // - arriba:    transparente -> negro 10% MUY suave (borra solo la línea
                    //              dura del canto superior; la cabeza/hombros NO se cortan)
                    WebkitMaskImage:
                      "linear-gradient(to right, transparent 0%, #000 42%), linear-gradient(to left, transparent 0%, #000 12%), linear-gradient(to top, transparent 0%, #000 38%), linear-gradient(to bottom, transparent 0%, #000 10%)",
                    maskImage:
                      "linear-gradient(to right, transparent 0%, #000 42%), linear-gradient(to left, transparent 0%, #000 12%), linear-gradient(to top, transparent 0%, #000 38%), linear-gradient(to bottom, transparent 0%, #000 10%)",
                    WebkitMaskComposite: "source-in",
                    maskComposite: "intersect",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                  }}
                />
              ) : (
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
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ===== Tips de salud — banda fina ===== */}
      <section
        className="reveal border-b"
        style={{
          backgroundColor: "var(--c-cool-soft)",
          borderColor: "var(--c-line-2)",
        }}
      >
        <Container className="py-6 md:py-8">
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
        </Container>
      </section>

      {/* ===== Nuestras Tiendas ===== */}
      <section id="tiendas" className="reveal py-8 md:py-12">
        <Container>
        <SectionHeader
          className="mb-8"
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
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
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
                      className="border-b h-[150px] md:h-[210px]"
                    />
                  )}

                  <div className="p-4 md:p-5 flex flex-col flex-1">
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
        </Container>
      </section>
    </div>
  );
}