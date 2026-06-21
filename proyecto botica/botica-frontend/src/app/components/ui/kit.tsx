// ============================================================
// kit.tsx — Sistema de consistencia (UI pura, sin lógica)
// ============================================================
// Fuente ÚNICA de verdad para estructura y ritmo visual de TODAS
// las pantallas (cliente, login, staff, admin). Define el contenedor
// de página, la escala tipográfica, el espaciado, los botones y las
// cards para que ninguna pantalla invente sus propios tamaños.
//
// Reglas que materializa:
//  1) Contenedor: max-w-7xl centrado + padding horizontal uniforme.
//  2) Tipografía fija: título de página, título de sección, etc.
//  3) Espaciado de 8px: mismo gap entre secciones, mismo padding de card.
//  4) Botones: UN componente con variantes y estados.
//  5) Cards: mismo radio, sombra y borde en todas.
// ============================================================

import React from 'react';
import { cn } from './utils';

// ------------------------------------------------------------
// 1) CONTENEDOR DE PÁGINA
// max-width consistente + padding horizontal uniforme. Ninguna
// pantalla se estira de borde a borde. Úsalo en pantallas cuyo
// layout NO aporte ya el contenedor (p. ej. admin).
// ------------------------------------------------------------
export function PageContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 py-6 lg:px-6 lg:py-8', className)}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// 2) CABECERA DE PÁGINA
// Mismo título (h1), subtítulo y zona de acciones en todas las
// pantallas. Mismo tamaño, peso y espacio inferior.
// ------------------------------------------------------------
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-end justify-between gap-3',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl lg:text-3xl font-bold text-text tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ------------------------------------------------------------
// 4) BOTÓN — un solo componente, variantes y estados consistentes
// ------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark';
type ButtonSize = 'sm' | 'md';

const BTN_BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold ' +
  'transition-colors select-none whitespace-nowrap ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ' +
  'disabled:opacity-60 disabled:pointer-events-none';

const BTN_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-brand',
  secondary: 'bg-surface border border-line text-text hover:border-brand',
  ghost: 'text-text hover:bg-page',
  dark: 'bg-ink text-white hover:bg-ink-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(BTN_BASE, BTN_SIZES[size], BTN_VARIANTS[variant], className)}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

// ------------------------------------------------------------
// 5) CARD — mismo radio, borde y sombra en todas las pantallas
// ------------------------------------------------------------
export function Card({
  className,
  padded = true,
  children,
}: {
  className?: string;
  padded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'bg-surface rounded-2xl border border-line shadow-soft',
        padded && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------
// 2) TÍTULO DE SECCIÓN — h2 uniforme con icono opcional
// ------------------------------------------------------------
export function SectionTitle({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn('flex items-center gap-2 font-bold text-lg text-text', className)}>
      {Icon && <Icon size={18} className="text-brand" />}
      {children}
    </h2>
  );
}

// ------------------------------------------------------------
// KPI / STAT CARD — métrica con barra de acento (igual en staff/admin)
// ------------------------------------------------------------
export function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'var(--c-brand)',
  hint,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative h-full overflow-hidden bg-surface rounded-2xl border border-line shadow-soft p-5',
        className,
      )}
    >
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-r"
        style={{ backgroundColor: accent }}
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
      >
        <Icon size={22} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-1.5">{label}</p>
      <p className="text-2xl lg:text-[28px] leading-none font-bold text-text tabular-nums">{value}</p>
      {hint && <p className="text-xs text-faint mt-2">{hint}</p>}
    </div>
  );
}
