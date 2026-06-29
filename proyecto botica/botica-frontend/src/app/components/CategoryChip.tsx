import { type LucideIcon } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';

// Chip de categoría con icono. Inactivo: superficie blanca, borde gris e icono
// teñido con el color de la categoría (sutil). Activo: naranja de marca.
// Patrón compartido entre el POS del staff (StaffNuevaVenta) y las pantallas
// admin (Gestión de Productos, Control de Stock).
export function CategoryChip({
  label, icon: Icon, iconName, colorHex, active, onClick,
}: {
  label: string;
  icon?: LucideIcon;
  iconName?: string | null;
  colorHex?: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 shrink-0 h-9 pl-2 pr-3.5 rounded-full border text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
        active
          ? 'bg-brand text-white border-brand shadow-soft'
          : 'bg-surface text-muted border-line hover:border-brand hover:text-text'
      }`}
    >
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${active ? 'bg-white/20 text-white' : ''}`}
        style={!active && colorHex ? { color: colorHex } : undefined}
      >
        {Icon ? <Icon size={14} /> : <CategoryIcon name={iconName} size={14} />}
      </span>
      {label}
    </button>
  );
}
