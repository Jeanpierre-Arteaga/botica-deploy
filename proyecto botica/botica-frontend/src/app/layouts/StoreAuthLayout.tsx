import { Outlet } from "react-router";
import { TopBar } from "../components/TopBar";
import { Navbar } from "../components/Navbar";

/**
 * StoreAuthLayout — chrome para el ACCESO de cliente (/login, /registro).
 *
 * Conserva la TopBar (teléfonos) y la Navbar (búsqueda, ubicación, carrito)
 * para que el login se sienta DENTRO del sitio y mantenga la conectividad,
 * pero OMITE la barra de categorías (SecondaryNav) y el Footer: en el acceso
 * no se compra ni se navega catálogo.
 *
 * La página ocupa exactamente el viewport (min-h-screen) y el área de auth
 * llena el alto restante (flex-1), de modo que la pantalla de login entra
 * completa sin scroll en una laptop/PC común.
 */
export function StoreAuthLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Navbar />
      <main className="relative flex min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
