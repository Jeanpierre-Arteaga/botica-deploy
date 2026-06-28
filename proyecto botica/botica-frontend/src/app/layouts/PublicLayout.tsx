import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { TopBar } from "../components/TopBar";
import { SecondaryNav } from "../components/SecondaryNav";
import { Footer } from "../components/Footer";
import { QuickActionFab } from "../components/QuickActionFab";
import { CookieConsent } from "../components/CookieConsent";

/**
 * Layout del CLIENTE (home, catálogo, PDP, carrito, checkout).
 * El header completo (barra naranja + navbar + nav de categorías) queda FIJO
 * arriba al hacer scroll — esto NO aplica a staff/admin, que usan sidebar propio.
 *
 * El header es `sticky top-0`: TODOS sus bloques (naranja → búsqueda → categorías)
 * quedan SIEMPRE visibles, pegados y en ese orden, aunque se baje hasta el fondo.
 * No se oculta ningún bloque al hacer scroll. Como es `sticky` (no `fixed`),
 * reserva su espacio en el flujo y el contenido NO salta ni queda tapado.
 *
 * z-index: el header usa z-[1100] para quedar SOBRE los mapas Leaflet (cuyos
 * controles llegan a z-index 1000) y los banners. Los dropdowns de búsqueda y
 * categorías viven dentro del header con z mayor y siguen abriéndose encima.
 */
export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-[1100] shadow-sm">
        <TopBar />
        <Navbar />
        <SecondaryNav />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* FAB de acción rápida (asesoría + subir receta) — solo cliente */}
      <QuickActionFab />
      {/* Banner de consentimiento de cookies (primera visita) */}
      <CookieConsent />
    </div>
  );
}
