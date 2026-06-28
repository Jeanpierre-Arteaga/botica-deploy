import { Link, useLocation } from "react-router";
import { ChevronDown, Tag } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "../lib/api";
import { CategoryIcon } from "./CategoryIcon";
import type { Category } from "../lib/types";

export function SecondaryNav() {
  const [showCategories, setShowCategories] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Category[]>([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

  // Categorías destacadas (chips horizontales)
  useEffect(() => {
    api.categories
      .getAll({ featured: true })
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setIsLoadingFeatured(false));
  }, []);

  // Todas las categorías (dropdown completo)
  useEffect(() => {
    api.categories
      .getAll()
      .then(setAllCategories)
      .catch(() => setAllCategories([]));
  }, []);

  useEffect(() => {
    if (showCategories && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [showCategories]);

  const isActive = (to: string) =>
    location.pathname + location.search === to;

  const offersHref = "/catalogo?is_offer=true";

  return (
    <>
      <div className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Categorías Dropdown (TODAS desde BD) */}
            <div className="relative flex-shrink-0">
              <button
                ref={buttonRef}
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-3 md:py-4 text-muted hover:text-brand transition-colors text-sm font-medium whitespace-nowrap border-b-2 border-transparent"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`}
                />
                <span>Categorías</span>
              </button>
            </div>

            {/* Ofertas (filtro especial, NO es categoría) */}
            <Link
              to={offersHref}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-3 md:py-4 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 ${
                isActive(offersHref)
                  ? 'text-brand border-brand'
                  : 'text-brand hover:text-brand-hover border-transparent'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Ofertas</span>
            </Link>

            {/* Chips destacados (featured desde BD) */}
            {isLoadingFeatured ? (
              <div className="flex gap-2 py-3 md:py-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-24 bg-surface-2 rounded-full animate-pulse"
                  />
                ))}
              </div>
            ) : (
              featured.map((cat) => {
                const to = `/catalogo?category_id=${cat.category_id}`;
                const active = isActive(to);
                return (
                  <Link
                    key={cat.category_id}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 md:px-4 py-3 md:py-4 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 ${
                      active
                        ? 'text-brand border-brand'
                        : 'text-muted hover:text-brand border-transparent'
                    }`}
                  >
                    <CategoryIcon name={cat.icon_name} size={16} />
                    <span>{cat.category_name}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Portal-style Dropdown Menu (TODAS las categorías desde BD) */}
      {showCategories && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={() => setShowCategories(false)}
          />

          <div
            className="fixed z-[9999] bg-surface rounded-[16px] shadow-lg border border-line py-4 px-3 w-[calc(100vw-2rem)] md:w-96 max-h-[450px] overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: window.innerWidth < 768 ? '1rem' : `${dropdownPosition.left}px`
            }}
          >
            {allCategories.length === 0 ? (
              <p className="px-4 py-3 text-sm text-faint">
                No hay categorías disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {allCategories.map((cat) => (
                  <Link
                    key={cat.category_id}
                    to={`/catalogo?category_id=${cat.category_id}`}
                    onClick={() => setShowCategories(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-brand-soft hover:text-brand transition-colors text-text"
                  >
                    <CategoryIcon
                      name={cat.icon_name}
                      size={16}
                      className="flex-shrink-0"
                    />
                    <span className="truncate">{cat.category_name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
