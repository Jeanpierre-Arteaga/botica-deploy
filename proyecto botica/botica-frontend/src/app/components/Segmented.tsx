// Segmented control compacto: pista gris neutra, ítem activo en naranja de
// marca. Patrón compartido entre el staff (Pedidos) y las pantallas admin.
export function Segmented<T extends string>({
  ariaLabel, value, onChange, options,
}: {
  ariaLabel: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-2 border border-line max-w-full overflow-x-auto scrollbar-hide"
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              active ? 'bg-brand text-white shadow-soft' : 'text-muted hover:text-text'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
