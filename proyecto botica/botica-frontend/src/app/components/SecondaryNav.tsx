import { Link, useLocation } from "react-router";
import { ChevronDown, Tag, Baby, Pill, Heart, Book } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function SecondaryNav() {
  const [showCategories, setShowCategories] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const categories = [
    { label: "Analgésicos", slug: "analgesicos" },
    { label: "Antibióticos", slug: "antibioticos" },
    { label: "Vitaminas", slug: "vitaminas" },
    { label: "Mamá & Bebé", slug: "mama-bebe" },
    { label: "Cuidado Personal", slug: "cuidado-personal" },
    { label: "Dermatología", slug: "dermatologia" },
    { label: "Gastroenterología", slug: "gastroenterologia" },
    { label: "Respiratorio", slug: "respiratorio" },
    { label: "Cardiovascular", slug: "cardiovascular" },
    { label: "Diabetes", slug: "diabetes" },
    { label: "Suplementos", slug: "suplementos" },
    { label: "Genéricos", slug: "genericos" },
  ];

  const menuItems = [
    { label: "Ofertas", icon: Tag, to: "/catalogo?tipo=ofertas" },
    { label: "Vitaminas", icon: Pill, to: "/catalogo?categoria=vitaminas" },
    { label: "Mamá & Bebé", icon: Baby, to: "/catalogo?categoria=mama-bebe" },
    { label: "Genéricos", icon: Heart, to: "/catalogo?tipo=generico" },
    { label: "Cuidado Personal", to: "/catalogo?categoria=cuidado-personal" },
    { label: "Catálogos", icon: Book, to: "/catalogo" },
  ];

  useEffect(() => {
    if (showCategories && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [showCategories]);

  const isActive = (to: string) => {
    return location.pathname + location.search === to;
  };

  return (
    <>
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Categorías Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                ref={buttonRef}
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-3 md:py-4 text-[#4A5260] hover:text-[#F26430] transition-colors text-sm font-medium whitespace-nowrap border-b-2 border-transparent"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
                <span>Categorías</span>
              </button>
            </div>

            {/* Other Menu Items */}
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-3 md:py-4 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0 border-b-2 ${
                  isActive(item.to)
                    ? 'text-[#F26430] border-[#F26430]'
                    : 'text-[#4A5260] hover:text-[#F26430] border-transparent'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Portal-style Dropdown Menu */}
      {showCategories && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={() => setShowCategories(false)}
          />

          <div
            className="fixed z-[9999] bg-white rounded-[16px] shadow-lg border border-[#E5E7EB] py-4 px-3 w-[calc(100vw-2rem)] md:w-80 grid grid-cols-2 gap-2 max-h-[450px] overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: window.innerWidth < 768 ? '1rem' : `${dropdownPosition.left}px`
            }}
          >
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/catalogo?categoria=${category.slug}`}
                onClick={() => setShowCategories(false)}
                className="px-4 py-3 rounded-[10px] hover:bg-[#FFF4EE] hover:text-[#F26430] transition-colors text-sm font-normal text-[#1A1F2E]"
              >
                {category.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
