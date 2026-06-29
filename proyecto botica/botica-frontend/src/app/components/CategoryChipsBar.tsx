// ============================================================
// CategoryChipsBar — Fila de chips de categoría con flechas de scroll
// ============================================================
// La fila de chips se recorre con touch/trackpad y con MOUSE vía dos flechas
// (izq./der.) que hacen scrollBy suave. Las flechas se posicionan ABSOLUTAS
// sobre los bordes (con un degradado de la superficie) para NO indentar los
// chips: el primer chip queda siempre alineado (flush) al borde izquierdo.
// Cada flecha se oculta al llegar a su extremo. Compartido por Gestión de
// Productos, Control de Stock y Nueva Venta. `selected` es "" (Todas) o
// String(category_id).
// ============================================================

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { CategoryChip } from './CategoryChip';
import type { Category } from '../lib/types';

export function CategoryChipsBar({
  categories,
  selected,
  onSelect,
  className = '',
}: {
  categories: Category[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update, categories.length]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(220, el.clientWidth * 0.7), behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1"
      >
        <CategoryChip
          label="Todas"
          icon={LayoutGrid}
          active={selected === ''}
          onClick={() => onSelect('')}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.category_id}
            label={c.category_name}
            iconName={c.icon_name}
            colorHex={c.color_hex}
            active={selected === String(c.category_id)}
            onClick={() => onSelect(String(c.category_id))}
          />
        ))}
      </div>
      <ArrowBtn dir="left" show={canLeft} onClick={() => scrollByDir(-1)} />
      <ArrowBtn dir="right" show={canRight} onClick={() => scrollByDir(1)} />
    </div>
  );
}

function ArrowBtn({
  dir,
  show,
  onClick,
}: {
  dir: 'left' | 'right';
  show: boolean;
  onClick: () => void;
}) {
  const Icon = dir === 'left' ? ChevronLeft : ChevronRight;
  return (
    <div
      aria-hidden={!show}
      className={`absolute top-0 bottom-0 flex items-center transition-opacity ${
        dir === 'left'
          ? 'left-0 pr-6 bg-gradient-to-r from-surface via-surface'
          : 'right-0 pl-6 bg-gradient-to-l from-surface via-surface'
      } to-transparent ${show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <button
        type="button"
        onClick={onClick}
        tabIndex={show ? 0 : -1}
        aria-label={dir === 'left' ? 'Categorías anteriores' : 'Más categorías'}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-line bg-surface text-muted hover:border-brand hover:text-brand shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Icon size={16} />
      </button>
    </div>
  );
}
