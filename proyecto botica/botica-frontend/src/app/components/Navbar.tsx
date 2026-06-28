import image_botica_icono from '@/imports/botica_icono.jpeg'
import { Link, useNavigate } from "react-router";
import { Search, MapPin, Package, User, ShoppingCart, Menu, X, LogOut, Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, FormEvent } from "react";
import { toast } from "sonner";
import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import { useLocations } from "../lib/LocationContext";
import { UserMenu } from "./UserMenu";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { PrescriptionUpload } from "./PrescriptionUpload";

export function Navbar() {
  const { user, isCheckingSession, logout } = useAuth();
  const { itemCount } = useCart();
  const { locations, selectedLocation, setSelectedLocation, isLoading: isLoadingLocations } = useLocations();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");

  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside para cerrar dropdown de sedes
  useEffect(() => {
    if (!locationDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [locationDropdownOpen]);

  const handleMobileLogout = () => {
    logout();
    setMobileMenuOpen(false);
    toast.success('Sesión cerrada correctamente.');
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/catalogo?nombre=${encodeURIComponent(q)}`);
      setQuery("");
      setMobileMenuOpen(false);
    }
  };

  const locationLabel =
    selectedLocation?.district || selectedLocation?.location_name || 'Sede';

  return (
    <nav className="bg-surface border-b border-line">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src={image_botica_icono}
              alt="Boticas Central BM"
              className="h-14 md:h-16 w-auto"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca medicamentos, vitaminas, cuidado personal..."
                className="w-full pl-4 pr-12 py-3 rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-surface text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand text-white rounded-md hover:bg-brand-hover transition-colors"
                aria-label="Buscar"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {/* Subir receta médica (IA) */}
            <PrescriptionUpload variant="light" />

            {/* Accesibilidad */}
            <AccessibilityMenu variant="light" />

            {/* Branch Selector (dropdown) */}
            <div ref={locationDropdownRef} className="relative">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                disabled={isLoadingLocations || locations.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1E4D8C] text-white rounded-lg hover:bg-[#1B4480] transition-colors font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="Seleccionar sede"
              >
                <MapPin className="w-4 h-4" />
                <span>{isLoadingLocations ? 'Cargando...' : locationLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    locationDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {locationDropdownOpen && locations.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-lg border border-line py-2 z-50">
                  <div className="px-4 py-2 border-b border-line">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide">
                      Elige tu sede
                    </p>
                  </div>
                  {locations.map((loc) => {
                    const isSelected =
                      selectedLocation?.location_id === loc.location_id;
                    return (
                      <button
                        key={loc.location_id}
                        onClick={() => {
                          setSelectedLocation(loc);
                          setLocationDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left text-sm hover:bg-brand-soft transition-colors ${
                          isSelected ? 'bg-brand-soft' : ''
                        }`}
                      >
                        <MapPin
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            isSelected ? 'text-brand' : 'text-faint'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text">
                            {loc.district || loc.location_name}
                          </p>
                          {loc.location_address && (
                            <p className="text-xs text-muted truncate">
                              {loc.location_address}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-brand flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mis Pedidos (solo customers logueados) */}
            {user?.role === 'cust' && (
              <Link
                to="/mis-pedidos"
                className="flex items-center gap-2 px-4 py-2.5 text-text hover:text-brand hover:bg-brand-soft rounded-lg transition-colors font-medium text-sm"
              >
                <Package className="w-4 h-4" />
                <span className="hidden lg:inline">Mis Pedidos</span>
              </Link>
            )}

            {/* Login / UserMenu */}
            {isCheckingSession ? (
              <div className="w-28 h-10 bg-surface-2 rounded-lg animate-pulse" />
            ) : user ? (
              <UserMenu variant="light" />
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2.5 text-text hover:text-brand hover:bg-brand-soft rounded-lg transition-colors font-medium text-sm"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">Ingresar</span>
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/carrito"
              className="relative flex items-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-sm font-semibold text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden lg:inline">Carrito</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#1E4D8C] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <PrescriptionUpload variant="light" />
            <AccessibilityMenu variant="light" />
            <Link to="/carrito" className="relative" aria-label="Ir al carrito">
              <div className="p-2 bg-brand text-white rounded-lg shadow-sm">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#1E4D8C] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted hover:bg-surface-2 rounded-lg transition-colors"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        <form onSubmit={handleSearch} className="md:hidden mt-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar medicamentos..."
              className="w-full pl-4 pr-12 py-3 rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all bg-surface text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand text-white rounded-md hover:bg-brand-hover transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-line pt-4">
            <div className="space-y-2">
              {/* Branch Selector Mobile */}
              {locations.length > 0 && (
                <div>
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide px-4 mb-2">
                    Elige tu sede
                  </p>
                  <div className="space-y-1">
                    {locations.map((loc) => {
                      const isSelected =
                        selectedLocation?.location_id === loc.location_id;
                      return (
                        <button
                          key={loc.location_id}
                          onClick={() => {
                            setSelectedLocation(loc);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
                            isSelected
                              ? 'bg-[#1E4D8C] text-white'
                              : 'bg-surface-2 text-text hover:bg-line'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <MapPin className="w-4 h-4" />
                            <span>{loc.district || loc.location_name}</span>
                          </span>
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mis Pedidos Mobile (solo customer) */}
              {user?.role === 'cust' && (
                <Link
                  to="/mis-pedidos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-muted hover:bg-brand-soft rounded-lg transition-colors font-medium text-sm"
                >
                  <Package className="w-5 h-5" />
                  <span>Mis Pedidos</span>
                </Link>
              )}

              {/* Login / Logout Mobile */}
              {isCheckingSession ? (
                <div className="w-full h-12 bg-surface-2 rounded-lg animate-pulse" />
              ) : user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 text-text">
                    <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center font-semibold text-sm">
                      {user.full_name.trim().charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-sm truncate">{user.full_name}</span>
                  </div>
                  <button
                    onClick={handleMobileLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-error hover:bg-error-soft rounded-lg transition-colors font-medium text-sm"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar sesión</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-muted hover:bg-brand-soft rounded-lg transition-colors font-medium text-sm"
                >
                  <User className="w-5 h-5" />
                  <span>Iniciar sesión</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
