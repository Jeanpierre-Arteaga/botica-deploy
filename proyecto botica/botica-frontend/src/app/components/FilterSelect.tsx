import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface FilterSelectOption<T extends string> {
  value: T;
  label: string;
}

/**
 * FilterSelect — dropdown estilizado coherente con los filtros de staff/admin:
 * superficie blanca, borde de línea, esquinas redondeadas, acento naranja en la
 * opción activa y foco visible. Reemplaza al <select> nativo del catálogo
 * ("Ordenar") manteniendo las mismas opciones y comportamiento.
 *
 * Accesible: patrón listbox con teclado (↑/↓, Home/End, Enter, Esc) y
 * aria-activedescendant. Cierra al hacer click fuera o con Escape, devolviendo
 * el foco al botón disparador.
 */
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  align = "right",
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: FilterSelectOption<T>[];
  ariaLabel: string;
  /** Lado por el que se ancla el panel desplegado. */
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex] ?? options[0];
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  // Cierra al hacer click fuera del control.
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  // Al abrir: sincroniza el índice activo con el valor y enfoca la lista para
  // que las flechas funcionen de inmediato.
  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    listRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const choose = (i: number) => {
    onChange(options[i].value);
    close();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(activeIndex);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className="inline-flex items-center gap-2 h-10 pl-3.5 pr-2.5 rounded-xl border border-line bg-surface text-sm font-medium text-text hover:border-brand/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand transition-colors"
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-faint shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          aria-activedescendant={optionId(activeIndex)}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className={`absolute z-30 mt-2 min-w-full w-max max-w-[80vw] rounded-xl border border-line bg-surface shadow-lg p-1.5 focus:outline-none ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((o, i) => {
            const isSelected = i === selectedIndex;
            const isActive = i === activeIndex;
            return (
              <li
                key={o.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(i)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center justify-between gap-4 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-brand-soft text-brand font-semibold"
                    : isActive
                      ? "bg-page text-text"
                      : "text-text"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
