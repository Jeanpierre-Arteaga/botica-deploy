import { Link, useNavigate, useParams } from "react-router";
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Pill,
  AlertCircle,
  PackageX,
  Truck,
  Stethoscope,
  Check,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import yape_logo from "@/imports/yape_logo.png";
import plin_logo from "@/imports/plin_logo.png";
import { ProductCard } from "../components/ProductCard";
import { ProductDetailSkeleton } from "../components/Skeleton";
import { Container } from "../components/Container";
import { Button } from "../components/ui/Button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { api, ApiError } from "../lib/api";
import { useCart } from "../lib/CartContext";
import { useLocations } from "../lib/LocationContext";
import { useVoiceReader, formatPriceForSpeech } from "../lib/voiceReader";
import type { Product } from "../lib/types";

// Umbral de envío gratis. Coincide con el del carrito (Carrito.tsx).
const FREE_SHIPPING_THRESHOLD = 50;

// A partir de cuántos caracteres tiene sentido ofrecer "Ver más" en la
// descripción corta (si el texto cabe en 2-3 líneas no mostramos el toggle).
const DESC_CLAMP_CHARS = 160;

function formatDateSafe(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: es });
  } catch {
    return null;
  }
}

export function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { selectedLocation } = useLocations();
  const { enabled: voiceOn, speak, speakNow } = useVoiceReader();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  const productId = id ? Number(id) : NaN;

  // Cargar producto
  useEffect(() => {
    if (!productId || Number.isNaN(productId)) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    // Al entrar a un producto (o al saltar entre relacionados) siempre
    // arrancamos arriba: navegar conservaba el scroll y "caía" al detalle.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    setQuantity(1);
    setActiveImage(0);
    setDescExpanded(false);

    api.products
      .getById(productId, selectedLocation?.location_id)
      .then((data) => {
        if (cancelled) return;
        setProduct(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          console.error("Error cargando producto:", err);
          setError("No se pudo cargar el producto.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, selectedLocation]);

  // Cargar relacionados cuando ya tenemos el producto
  useEffect(() => {
    if (!product || product.category_id == null) {
      setRelated([]);
      return;
    }
    let cancelled = false;
    api.products
      .getAll({
        category_id: product.category_id,
        location_id: selectedLocation?.location_id,
      })
      .then((all) => {
        if (cancelled) return;
        const filtered = all
          .filter(
            (p) =>
              p.product_id !== product.product_id &&
              p.category_id === product.category_id,
          )
          .slice(0, 4);
        setRelated(filtered);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product, selectedLocation]);

  // Galería: usa el array `images` si el backend lo expone; si no, cae a la
  // imagen principal. Sin placeholders rotos cuando solo existe la 'main'.
  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    const fromArray =
      product.images && product.images.length > 0
        ? product.images.map((i) => i.url)
        : [];
    const urls = fromArray.length > 0
      ? fromArray
      : product.image_url
        ? [product.image_url]
        : [];
    return Array.from(new Set(urls.filter(Boolean)));
  }, [product]);

  const stockNumber =
    typeof product?.current_stock === "number" ? product.current_stock : null;
  const hasStock = stockNumber === null || stockNumber > 0;
  const lowStock = stockNumber !== null && stockNumber > 0 && stockNumber <= 5;
  const maxQuantity = stockNumber && stockNumber > 0 ? stockNumber : 99;

  const expDateFormatted = useMemo(
    () => formatDateSafe(product?.expiration_date ?? null),
    [product?.expiration_date],
  );

  const handleAddToCart = () => {
    if (!product || !hasStock) return;
    addItem(product, quantity);
  };

  // ============================================================
  // RENDER — estados
  // ============================================================
  if (isLoading) {
    return (
      <div className="bg-page-alt min-h-screen">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="bg-page-alt min-h-screen">
        <Container className="py-16 text-center">
          <PackageX className="w-16 h-16 text-faint mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">
            Producto no encontrado
          </h1>
          <p className="text-muted mb-6">
            El producto que buscas no existe o fue retirado del catálogo.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/catalogo")}
          >
            Volver al catálogo
          </Button>
        </Container>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-page-alt min-h-screen">
        <Container className="py-16 text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text mb-2">
            No pudimos cargar el producto
          </h1>
          <p className="text-muted mb-6">
            {error || "Ocurrió un problema inesperado."}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </Container>
      </div>
    );
  }

  // Precio anterior tachado: solo en ofertas con old_price mayor al actual.
  const showOldPrice =
    product.is_offer &&
    product.old_price != null &&
    product.old_price > product.product_price;
  const discountPct = showOldPrice
    ? Math.round(
        (1 - product.product_price / (product.old_price as number)) * 100,
      )
    : 0;

  // Tono del indicador de stock por sede (punto + texto).
  const stockTone =
    stockNumber === null
      ? { dot: "var(--c-faint)", color: "var(--c-muted)" }
      : stockNumber === 0
        ? { dot: "var(--c-error)", color: "var(--c-error)" }
        : lowStock
          ? { dot: "var(--c-warning)", color: "var(--c-warning)" }
          : { dot: "var(--c-success)", color: "var(--c-success)" };

  const sedeLabel = selectedLocation
    ? selectedLocation.district || selectedLocation.location_name
    : null;

  const stockText =
    stockNumber === null
      ? "Selecciona una sede para ver disponibilidad"
      : stockNumber === 0
        ? "Sin stock en esta sede"
        : lowStock
          ? `Pocas unidades · ${stockNumber} disponibles`
          : `${stockNumber} disponibles`;

  // Texto para la lectura por voz: nombre + precio + disponibilidad.
  const spokenText =
    `${product.product_name}. ` +
    `Precio: ${formatPriceForSpeech(product.product_price)}. ` +
    `Disponibilidad: ${stockText}.`;

  // La descripción corta reutiliza la composición (único texto libre del
  // producto). Para no duplicarla, NO la repetimos como acordeón: aquí va el
  // resumen con "Ver más", y los acordeones quedan para precaución e info.
  const description = product.product_composition?.trim() || null;
  const descIsLong = !!description && description.length > DESC_CLAMP_CHARS;

  // Secciones de acordeón — solo las que tienen contenido. La primera
  // disponible queda abierta por defecto ("info" siempre existe).
  const hasCaution = !!product.contraindications || !!product.adverse_effects;
  const firstSection = hasCaution ? "precaucion" : "info";

  return (
    <div className="bg-page-alt min-h-screen">
      <Container className="py-6 md:py-8 animate-fade-in-up">
        {/* ===== Breadcrumb ===== */}
        <nav
          aria-label="Migas de pan"
          className="flex items-center gap-1.5 text-[12.5px] text-faint mb-5 flex-wrap"
        >
          <Link to="/" className="hover:text-text transition-colors">
            Inicio
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-faint" />
          <Link to="/catalogo" className="hover:text-text transition-colors">
            Catálogo
          </Link>
          {product.category_name && product.category_id != null && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-faint" />
              <Link
                to={`/catalogo?category_id=${product.category_id}`}
                className="hover:text-text transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-faint" />
          <span className="text-muted font-medium truncate max-w-[55vw] md:max-w-none">
            {product.product_name}
          </span>
        </nav>

        {/* ===== 2 columnas: galería + compra (alineadas arriba) ===== */}
        <div className="grid lg:grid-cols-2 gap-7 lg:gap-12 mb-14 items-start">
          {/* ---------- IZQUIERDA: solo galería (sticky) ---------- */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mx-auto w-full max-w-[470px]">
              {/* Imagen principal — caja cuadrada, fondo blanco puro, contain */}
              <div
                className="relative aspect-square rounded-[16px] border border-line shadow-soft overflow-hidden flex items-center justify-center p-4 md:p-5"
                style={{ backgroundColor: "var(--c-photo)" }}
              >
                {gallery.length > 0 ? (
                  <img
                    src={gallery[activeImage] ?? gallery[0]}
                    alt={product.product_name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-faint">
                    <Pill className="w-16 h-16" />
                    <span className="text-sm mt-2">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Tira de miniaturas — solo si hay más de una imagen */}
              {gallery.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                  {gallery.map((url, i) => (
                    <button
                      key={url + i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      aria-label={`Ver imagen ${i + 1}`}
                      aria-current={i === activeImage}
                      className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center p-1.5 transition-all"
                      style={{
                        backgroundColor: "var(--c-photo)",
                        border:
                          i === activeImage
                            ? "2px solid var(--c-text)"
                            : "1px solid var(--c-line)",
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ---------- DERECHA: panel de compra + toda la info ---------- */}
          <div className="max-w-xl">
            {/* Tags neutros: laboratorio · categoría · Genérico */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {product.laboratory_name && (
                <span className="inline-flex items-center rounded-full bg-line-2 px-2.5 py-1 text-[11.5px] font-medium text-muted">
                  {product.laboratory_name}
                </span>
              )}
              {product.category_name && (
                <span className="inline-flex items-center rounded-full bg-line-2 px-2.5 py-1 text-[11.5px] font-medium text-muted">
                  {product.category_name}
                </span>
              )}
              {product.is_generic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-line-2 px-2.5 py-1 text-[11.5px] font-medium text-muted">
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                  Genérico
                </span>
              )}
            </div>

            {/* Nombre — la presentación ya viene en el nombre */}
            <h1 className="text-[22px] font-semibold text-text leading-snug mb-1.5">
              {product.product_name}
            </h1>

            {/* Principio activo */}
            {product.active_ingredient && (
              <p className="text-[12.5px] text-muted mb-4">
                Principio activo:{" "}
                <span className="font-medium text-text">
                  {product.active_ingredient}
                </span>
              </p>
            )}

            {/* Descripción corta con "Ver más" */}
            {description && (
              <div className="mb-5">
                <p
                  className={`text-[13px] leading-relaxed text-muted whitespace-pre-line ${
                    descExpanded || !descIsLong ? "" : "line-clamp-3"
                  }`}
                >
                  {description}
                </p>
                {descIsLong && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-1 text-[12.5px] font-medium text-brand hover:underline"
                  >
                    {descExpanded ? "Ver menos" : "Ver más"}
                  </button>
                )}
              </div>
            )}

            {/* Precio — navy bold; el naranja queda solo en el CTA.
                Al pasar el cursor (con lectura por voz activa) se lee solo. */}
            <div
              className="flex items-baseline gap-2.5 flex-wrap mb-4"
              onMouseEnter={() => speak(spokenText)}
            >
              <span className="text-[34px] font-bold text-text leading-none tracking-tight">
                S/ {Number(product.product_price).toFixed(2)}
              </span>
              {showOldPrice && (
                <>
                  <span className="text-[15px] line-through text-faint leading-none">
                    S/ {Number(product.old_price).toFixed(2)}
                  </span>
                  <span
                    className="text-[12px] font-bold px-2 py-0.5 rounded-full leading-none text-white"
                    style={{ backgroundColor: "var(--c-sale)" }}
                  >
                    -{discountPct}%
                  </span>
                </>
              )}

              {/* Botón de lectura — SOLO aparece si la lectura por voz está
                  encendida en Accesibilidad. Al pulsar lee siempre (explícito). */}
              {voiceOn && (
                <button
                  type="button"
                  onClick={() => speakNow(spokenText)}
                  aria-label="Escuchar nombre, precio y disponibilidad del producto"
                  className="ml-auto self-center inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-colors"
                  style={{
                    backgroundColor: "var(--c-brand-soft)",
                    color: "var(--c-brand)",
                    border: "1px solid var(--c-brand)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--c-brand)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--c-brand-soft)";
                    e.currentTarget.style.color = "var(--c-brand)";
                  }}
                >
                  <Volume2 className="w-4 h-4" />
                  Escuchar
                </button>
              )}
            </div>

            {/* Tarjeta de stock por sede */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl bg-line-2 border border-line mb-5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: stockTone.dot }}
              />
              <p className="text-[12.5px] text-text">
                {sedeLabel && (
                  <span className="font-semibold">Sede {sedeLabel} · </span>
                )}
                <span style={{ color: stockTone.color }} className="font-medium">
                  {stockText}
                </span>
              </p>
            </div>

            {/* Cantidad + CTA en la misma fila */}
            <div className="flex items-stretch gap-3">
              <div className="inline-flex items-center h-11 rounded-full border border-line bg-surface overflow-hidden flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!hasStock || quantity <= 1}
                  className="w-10 h-full flex items-center justify-center text-text hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (Number.isNaN(v)) setQuantity(1);
                    else setQuantity(Math.max(1, Math.min(maxQuantity, v)));
                  }}
                  disabled={!hasStock}
                  aria-label="Cantidad"
                  className="w-10 h-full text-center text-sm font-semibold text-text bg-transparent border-x border-line focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  disabled={!hasStock || quantity >= maxQuantity}
                  className="w-10 h-full flex items-center justify-center text-text hover:bg-page disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={!hasStock}
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.99] disabled:cursor-not-allowed"
                style={
                  hasStock
                    ? { backgroundColor: "var(--c-brand)", color: "#fff" }
                    : {
                        backgroundColor: "var(--c-line-2)",
                        color: "var(--c-faint)",
                      }
                }
                onMouseEnter={(e) => {
                  if (!hasStock) return;
                  e.currentTarget.style.backgroundColor = "var(--c-brand-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!hasStock) return;
                  e.currentTarget.style.backgroundColor = "var(--c-brand)";
                }}
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {hasStock ? "Agregar al carrito" : "Sin stock en esta sede"}
              </button>
            </div>

            {/* ===== Señales de confianza ===== */}
            <div className="mt-6 pt-5 border-t border-line space-y-2.5">
              <TrustRow icon={Truck}>
                Envío gratis por compras desde{" "}
                <span className="font-semibold text-text">
                  S/ {FREE_SHIPPING_THRESHOLD.toFixed(2)}
                </span>
              </TrustRow>
              <TrustRow icon={Stethoscope}>
                Asesoría farmacéutica · te ayudamos con tu compra
              </TrustRow>
              {product.health_record && (
                <TrustRow icon={ShieldCheck}>
                  Reg. Sanitario DIGEMID:{" "}
                  <span className="font-semibold text-text">
                    {product.health_record}
                  </span>
                </TrustRow>
              )}

              {/* Métodos de pago — logos a color (mismos assets/estilo del footer) */}
              <div className="flex items-center gap-2.5 pt-1.5">
                <span className="text-[12.5px] text-faint mr-0.5">Pagos:</span>
                {/* Yape — imagen real sobre su morado de marca */}
                <span
                  title="Yape"
                  className="h-6 w-11 rounded-md flex items-center justify-center overflow-hidden shadow-sm"
                  style={{ backgroundColor: "var(--c-pay-yape)" }}
                >
                  <img
                    src={yape_logo}
                    alt="Yape"
                    className="w-full h-full object-contain"
                  />
                </span>
                {/* Plin — imagen real sobre blanco */}
                <span
                  title="Plin"
                  className="h-6 w-11 rounded-md flex items-center justify-center overflow-hidden shadow-sm border border-line"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <img
                    src={plin_logo}
                    alt="Plin"
                    className="w-full h-full object-contain p-0.5"
                  />
                </span>
                {/* Visa — azul oficial */}
                <span
                  title="Visa"
                  className="h-6 w-11 rounded-md flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: "var(--c-pay-visa)" }}
                >
                  <span
                    className="text-white font-extrabold text-[11px] italic tracking-wider"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    VISA
                  </span>
                </span>
                {/* Mastercard — círculos rojo + naranja */}
                <span
                  title="Mastercard"
                  className="h-6 w-11 rounded-md flex items-center justify-center shadow-sm border border-line"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <svg viewBox="0 0 36 22" className="h-3.5">
                    <circle cx="13" cy="11" r="9" fill="#EB001B" />
                    <circle cx="23" cy="11" r="9" fill="#F79E1B" fillOpacity="0.9" />
                    <path
                      d="M18 4.5 a9 9 0 0 1 0 13 a9 9 0 0 1 0 -13"
                      fill="#FF5F00"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {/* ===== Acordeones — en esta misma columna ===== */}
            <Accordion
              type="multiple"
              defaultValue={[firstSection]}
              className="mt-6 space-y-2.5"
            >
              {hasCaution && (
                <AccordionItem
                  value="precaucion"
                  className="border border-line rounded-xl bg-surface px-4 last:border-b"
                >
                  <AccordionTrigger className="text-sm font-semibold text-text hover:no-underline py-3.5">
                    Precaución y advertencia
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-3">
                    {product.contraindications && (
                      <div>
                        <h4 className="text-[12.5px] font-semibold text-text mb-1">
                          Contraindicaciones
                        </h4>
                        <p className="text-[12.5px] text-muted leading-relaxed whitespace-pre-line">
                          {product.contraindications}
                        </p>
                      </div>
                    )}
                    {product.adverse_effects && (
                      <div>
                        <h4 className="text-[12.5px] font-semibold text-text mb-1">
                          Efectos adversos
                        </h4>
                        <p className="text-[12.5px] text-muted leading-relaxed whitespace-pre-line">
                          {product.adverse_effects}
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem
                value="info"
                className="border border-line rounded-xl bg-surface px-4 last:border-b"
              >
                <AccordionTrigger className="text-sm font-semibold text-text hover:no-underline py-3.5">
                  Información adicional
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <dl className="divide-y divide-line-2">
                    <SpecRow label="Laboratorio" value={product.laboratory_name} />
                    <SpecRow
                      label="País de origen"
                      value={product.laboratory_country}
                    />
                    <SpecRow
                      label="Registro sanitario"
                      value={product.health_record}
                    />
                    <SpecRow label="N.° de lote" value={product.product_batch} />
                    <SpecRow
                      label="Fecha de vencimiento"
                      value={expDateFormatted}
                    />
                    <SpecRow
                      label="Principio activo"
                      value={product.active_ingredient}
                    />
                    <SpecRow
                      label="¿Genérico?"
                      value={product.is_generic ? "Sí" : "No"}
                    />
                  </dl>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Aviso legal del rubro farmacia (sobrio, general).
                NOTA: el backend no expone aún un campo "requiere receta" por
                producto; mientras tanto mostramos el aviso general. */}
            <div
              className="mt-4 rounded-xl border p-3.5 flex items-start gap-2.5"
              style={{ borderColor: "var(--c-line)", backgroundColor: "var(--c-surface-2)" }}
            >
              <Stethoscope className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--c-muted)" }}>
                Algunos medicamentos requieren <strong style={{ color: "var(--c-text)" }}>receta médica</strong>{" "}
                y solo se dispensan con ella. La información mostrada es referencial y no reemplaza la
                consulta con un profesional de salud.
              </p>
            </div>
          </div>
        </div>

        {/* ===== Relacionados (full width) ===== */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg md:text-xl font-bold text-text mb-5">
              Tal vez te interesen
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {related.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

// ============================================================
// Subcomponentes
// ============================================================
function TrustRow({
  icon: Icon,
  children,
}: {
  icon: typeof Truck;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px] text-muted">
      <Icon className="w-4 h-4 text-faint flex-shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </div>
  );
}

function SpecRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  // Oculta la fila si no hay dato (no mostramos campos vacíos).
  if (value == null || String(value).trim() === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[12.5px] text-muted flex-shrink-0">{label}</dt>
      <dd className="text-[12.5px] font-medium text-text text-right">{value}</dd>
    </div>
  );
}
