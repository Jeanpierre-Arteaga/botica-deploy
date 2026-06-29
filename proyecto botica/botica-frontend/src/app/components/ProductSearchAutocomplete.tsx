// ============================================================
// ProductSearchAutocomplete — Búsqueda con sugerencias bajo la barra
// ============================================================
// Input + lista desplegable que aparece a medida que se escribe (debounce
// 250ms). Cada resultado: miniatura (CloudFront) + nombre + precio. Accesible
// (combobox/listbox, flechas/Enter/Esc). Se usa SOLO en:
//   (a) la barra de búsqueda del Navbar (home/tienda)
//   (b) el modal "Registrar Reposición" del admin
//
// onSelect(p)        → se eligió un producto (click o Enter sobre uno).
// onSubmitQuery(q)   → Enter sin selección (p. ej. "ver todos" en el catálogo).
// clearOnSelect      → true: limpia el input tras elegir (Navbar);
//                      false: deja el nombre del producto (Reposición).
// ============================================================

import { useState, useEffect, useRef, useId } from 'react';
import { Search, Loader2, PackageX, Pill } from 'lucide-react';
import { api } from '../lib/api';
import type { Product } from '../lib/types';

interface Props {
  onSelect: (product: Product) => void;
  onSubmitQuery?: (q: string) => void;
  /** Se dispara cuando el usuario ESCRIBE (no al seleccionar). Útil para
   *  invalidar una selección previa cuando el texto cambia. */
  onQueryChange?: (q: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  initialQuery?: string;
  clearOnSelect?: boolean;
  limit?: number;
}

const DEFAULT_INPUT_CLS =
  'w-full h-11 pl-11 pr-4 rounded-lg border border-line bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-colors';

export function ProductSearchAutocomplete({
  onSelect,
  onSubmitQuery,
  onQueryChange,
  placeholder = 'Buscar medicamentos…',
  autoFocus = false,
  className = '',
  inputClassName,
  initialQuery = '',
  clearOnSelect = false,
  limit = 8,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Búsqueda con debounce (~250ms). Menos de 2 caracteres no consulta.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(() => {
      api.products
        .search(q, limit)
        .then((data) => setResults(data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, limit]);

  // Cerrar al hacer click fuera.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const showDropdown = open && query.trim().length >= 2;

  const choose = (p: Product) => {
    onSelect(p);
    setOpen(false);
    setActiveIndex(-1);
    setQuery(clearOnSelect ? '' : p.product_name);
  };

  const submitFree = () => {
    const q = query.trim();
    if (q && onSubmitQuery) {
      onSubmitQuery(q);
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Enter') submitFree();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, results.length ? 0 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) choose(results[activeIndex]);
      else submitFree();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          value={query}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); onQueryChange?.(e.target.value); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={inputClassName ?? DEFAULT_INPUT_CLS}
        />
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-[60] rounded-xl border border-line bg-surface shadow-pop overflow-hidden"
          style={{ animation: 'acPop .14s ease-out' }}
        >
          <ul id={listId} role="listbox" aria-label="Sugerencias de productos" className="max-h-[22rem] overflow-y-auto py-1">
            {loading && results.length === 0 ? (
              <li className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-muted">
                <Loader2 size={16} className="animate-spin" /> Buscando…
              </li>
            ) : results.length === 0 ? (
              <li className="px-4 py-8 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-2xl bg-surface-2 flex items-center justify-center mb-2">
                  <PackageX size={20} className="text-faint" />
                </div>
                <p className="text-sm font-semibold text-text">Sin resultados</p>
                <p className="text-xs text-muted mt-0.5">No encontramos “{query.trim()}”.</p>
              </li>
            ) : (
              results.map((p, i) => (
                <li key={p.product_id} id={`${listId}-opt-${i}`} role="option" aria-selected={i === activeIndex}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => choose(p)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${i === activeIndex ? 'bg-brand-soft' : 'hover:bg-page'}`}
                  >
                    <Thumb url={p.image_url} alt={p.product_name} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-text truncate">{p.product_name}</span>
                      {p.category_name && <span className="block text-xs text-muted truncate">{p.category_name}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-text tabular-nums">S/ {Number(p.product_price).toFixed(2)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <style>{`@keyframes acPop{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function Thumb({ url, alt }: { url?: string | null; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <span className="w-10 h-10 shrink-0 rounded-lg bg-brand-soft flex items-center justify-center">
        <Pill size={18} className="text-brand" />
      </span>
    );
  }
  return (
    <img src={url} alt={alt ?? ''} onError={() => setFailed(true)} className="w-10 h-10 shrink-0 rounded-lg object-cover border border-line" />
  );
}
