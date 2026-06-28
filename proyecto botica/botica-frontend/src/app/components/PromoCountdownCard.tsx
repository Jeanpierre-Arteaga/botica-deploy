import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { homeImage } from "../lib/homeImages";

/**
 * PromoCountdownCard — tarjeta promocional con CUENTA REGRESIVA.
 *
 * Reemplaza la antigua imagen plana del slot derecho de la fila promo. Es una
 * tarjeta DISEÑADA (fondo navy de marca + foto del producto tenue al costado +
 * overlay para legibilidad), con jerarquía clara: etiqueta, título, subtítulo,
 * countdown HH:MM:SS y un CTA naranja.
 *
 * COUNTDOWN: cuenta el tiempo restante HASTA las 23:59:59 de HOY (hora local del
 * navegador). El cálculo se rehace cada segundo desde `new Date()` (no un valor
 * fijo), así que a medianoche el objetivo pasa al nuevo día y el contador se
 * "reinicia" solo a ~24h — correcto aunque se recargue la página.
 *
 * FALLBACK sobrio: si la foto (`img`) aún no existe, la tarjeta navy se ve igual
 * de bien sin imagen de fondo (sin hueco roto). El build queda limpio.
 *
 * La tarjeta completa es un <Link>; el "Comprar ahora" es un botón VISUAL (no un
 * <a> anidado, que sería HTML inválido), igual que el patrón del banner.
 */

/** Tiempo restante hasta las 23:59:59 de hoy (hora local). */
function getRemaining() {
  const now = new Date();
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const totalSec = Math.max(
    0,
    Math.floor((end.getTime() - now.getTime()) / 1000),
  );
  return {
    hours: Math.floor(totalSec / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface PromoCountdownCardProps {
  /** Nombre base de la foto en src/assets/home (sin extensión). */
  img: string;
  /** Destino del CTA / de la tarjeta. */
  to: string;
  /** Etiqueta pequeña superior. */
  label: string;
  /** Título principal (Sora bold). */
  title: string;
  /** Subtítulo de apoyo. */
  subtitle: string;
  /** Texto del botón CTA. */
  cta: string;
  /** Clases extra (altura de fila, span de grid). */
  className?: string;
}

export function PromoCountdownCard({
  img,
  to,
  label,
  title,
  subtitle,
  cta,
  className,
}: PromoCountdownCardProps) {
  const src = homeImage(img);
  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { value: time.hours, label: "Horas" },
    { value: time.minutes, label: "Min" },
    { value: time.seconds, label: "Seg" },
  ];

  return (
    <Link
      to={to}
      aria-label={`${title}. ${cta}`}
      className={`group relative block overflow-hidden transition-all duration-300 hover:-translate-y-1 active:scale-[0.997] ${
        className ?? ""
      }`}
      style={{
        borderRadius: "24px",
        boxShadow: "var(--elev-card)",
        background:
          "linear-gradient(135deg, var(--c-ink) 0%, var(--c-ink-2) 55%, var(--c-ink-3) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "var(--elev-pop)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "var(--elev-card)")
      }
    >
      {/* Foto del producto: tenue, al costado derecho. Solo si existe. */}
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute inset-y-0 right-0 h-full w-[62%] object-cover object-center opacity-30 transition-transform duration-500 group-hover:scale-[1.05]"
        />
      )}

      {/* Overlay: oscurece la izquierda para que el texto sea legible (AA) y
         deja entrever la foto a la derecha. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(11,18,32,0.94) 30%, rgba(11,18,32,0.55) 62%, rgba(11,18,32,0.15) 100%)",
        }}
      />

      {/* Contenido */}
      <div className="relative flex h-full flex-col justify-between gap-4 p-5 md:p-6">
        {/* Bloque superior: etiqueta + título + subtítulo */}
        <div className="flex flex-col gap-2">
          <span
            className="inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
            style={{
              backgroundColor: "var(--c-brand)",
              fontFamily: "var(--font-body)",
            }}
          >
            {label}
          </span>
          <h3
            className="text-[19px] md:text-[22px] font-bold leading-[1.15] tracking-[-0.01em] text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h3>
          <p
            className="text-[13px] leading-snug"
            style={{
              color: "rgba(255,255,255,0.72)",
              fontFamily: "var(--font-body)",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Bloque inferior: countdown + CTA */}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          {/* Cuenta regresiva en cajitas/pills */}
          <div
            className="flex items-start gap-1.5 md:gap-2"
            role="timer"
            aria-label={`Termina en ${pad(time.hours)} horas, ${pad(
              time.minutes,
            )} minutos y ${pad(time.seconds)} segundos`}
          >
            {units.map((u, i) => (
              <div key={u.label} className="flex items-stretch gap-1.5 md:gap-2">
                <div className="flex flex-col items-center">
                  <span
                    className="flex min-w-[2.6rem] items-center justify-center rounded-xl px-2 py-1.5 text-xl md:text-2xl font-bold tabular-nums text-white"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {pad(u.value)}
                  </span>
                  <span
                    className="mt-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    {u.label}
                  </span>
                </div>
                {i < units.length - 1 && (
                  <span
                    className="pt-1 text-xl md:text-2xl font-bold leading-[2.1]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    :
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* CTA — botón VISUAL (la tarjeta entera ya es el Link) */}
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--c-brand)" }}
          >
            {cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
