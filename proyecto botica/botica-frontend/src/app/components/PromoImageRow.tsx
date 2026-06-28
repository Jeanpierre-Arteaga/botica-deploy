import { Link } from "react-router";
import { ImageIcon } from "lucide-react";
import { homeImage } from "../lib/homeImages";
import {
  PromoCountdownCard,
  type PromoCountdownCardProps,
} from "./PromoCountdownCard";

/**
 * PromoImageRow — fila promocional bajo el banner.
 *
 * IZQUIERDA: imagen apaisada clickeable (promo-wide → categoría destino).
 * DERECHA: tarjeta promo DISEÑADA con cuenta regresiva (PromoCountdownCard),
 * ya NO una imagen plana.
 *
 * Ambas comparten la MISMA altura de fila en desktop (md+) para quedar
 * alineadas. En móvil apilan a 1 columna: la imagen mantiene una altura fija y
 * la tarjeta crece a su altura natural (el countdown no se rompe).
 *
 * La imagen se detecta sola con `homeImage(...)`. Si falta, muestra un fallback
 * sobrio sin hueco roto.
 */
export interface PromoSlot {
  /** Nombre base del archivo en src/assets/home (sin extensión). */
  img: string;
  alt: string;
  /** Destino al hacer click (ruta interna). */
  to: string;
  /** Texto del fallback cuando la imagen aún no existe. */
  fallback: string;
}

interface PromoImageRowProps {
  /** Tarjeta izquierda (~60%, imagen apaisada). */
  left: PromoSlot;
  /** Tarjeta derecha (~40%): promo con cuenta regresiva. */
  promo: Omit<PromoCountdownCardProps, "className">;
}

/* Altura compartida de la fila. En móvil la imagen usa esta altura fija; en md+
   ambas (imagen y tarjeta) miden lo mismo y quedan alineadas. La tarjeta deja
   su altura natural en móvil para que el countdown respire. */
const IMG_HEIGHT = "h-[160px] sm:h-[190px] md:h-[280px]";
const CARD_HEIGHT = "md:h-[280px]";

function PromoTile({
  slot,
  className,
}: {
  slot: PromoSlot;
  className?: string;
}) {
  const src = homeImage(slot.img);
  return (
    <Link
      to={slot.to}
      aria-label={slot.alt}
      className={`group relative block overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.997] ${
        className ?? ""
      }`}
      style={{ borderRadius: "24px", boxShadow: "var(--elev-soft)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "var(--elev-card)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "var(--elev-soft)")
      }
    >
      {src ? (
        <img
          src={src}
          alt={slot.alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 text-center"
          style={{
            backgroundColor: "var(--c-bg-2)",
            border: "1px solid var(--c-line)",
            borderRadius: "24px",
          }}
        >
          <span
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--c-brand-soft)" }}
          >
            <ImageIcon
              className="w-6 h-6"
              strokeWidth={1.5}
              style={{ color: "var(--c-brand)" }}
            />
          </span>
          <span
            className="text-sm font-medium tracking-wide"
            style={{ color: "var(--c-muted)" }}
          >
            {slot.fallback}
          </span>
        </div>
      )}
    </Link>
  );
}

export function PromoImageRow({ left, promo }: PromoImageRowProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-5 md:gap-5">
      {/* Izquierda ~60% (imagen apaisada) */}
      <PromoTile slot={left} className={`md:col-span-3 ${IMG_HEIGHT}`} />
      {/* Derecha ~40% (tarjeta promo con countdown) */}
      <PromoCountdownCard
        {...promo}
        className={`md:col-span-2 ${CARD_HEIGHT}`}
      />
    </div>
  );
}
