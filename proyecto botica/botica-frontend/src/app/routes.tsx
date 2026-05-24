import { createBrowserRouter, Outlet } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/AuthContext";
import { CartProvider } from "./lib/CartContext";
import { LocationProvider } from "./lib/LocationContext";
import { RequireRole } from "./components/RequireRole";
import { PublicLayout } from "./layouts/PublicLayout";
import { WorkerLayout } from "./layouts/WorkerLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Home } from "./pages/Home";
import { Catalogo } from "./pages/Catalogo";
import { ProductoDetalle } from "./pages/ProductoDetalle";
import { Carrito } from "./pages/Carrito";
import { Checkout } from "./pages/Checkout";
import { Confirmacion } from "./pages/Confirmacion";
import { ClientLogin } from "./pages/ClientLogin";
import { Registro } from "./pages/Registro";
import { StaffLogin } from "./pages/StaffLogin";
import { AdminLogin } from "./pages/AdminLogin";
import { NotFound } from "./pages/NotFound";
import { WorkerDashboard } from "./pages/worker/WorkerDashboard";
import { NuevaVenta } from "./pages/worker/NuevaVenta";
import { PedidosWeb } from "./pages/worker/PedidosWeb";
import { DetallePedido } from "./pages/worker/DetallePedido";
import { CierreCaja } from "./pages/worker/CierreCaja";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { GestionProductos } from "./pages/admin/GestionProductos";
import { ControlStock } from "./pages/admin/ControlStock";
import { GestionUsuarios } from "./pages/admin/GestionUsuarios";
import { Reportes } from "./pages/admin/Reportes";
import { MisPedidos } from "./pages/MisPedidos";

// ============================================================
// RootProviders
// ============================================================
// Wrapper raíz: envuelve toda la app en AuthProvider + CartProvider
// y renderiza el Toaster global. Vive aquí (no en App.tsx) porque
// AuthProvider usa useNavigate, que requiere estar DENTRO del Router.
// ============================================================
function RootProviders() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <Outlet />
          <Toaster richColors position="top-right" />
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    Component: RootProviders,
    children: [
      {
        path: "/",
        Component: PublicLayout,
        children: [
          { index: true, Component: Home },
          { path: "catalogo", Component: Catalogo },
          { path: "producto/:id", Component: ProductoDetalle },
          { path: "carrito", Component: Carrito },
          {
            path: "checkout",
            element: (
              <RequireRole roles={["cust"]}>
                <Checkout />
              </RequireRole>
            ),
          },
          { path: "confirmacion", Component: Confirmacion },
          { path: "login", Component: ClientLogin },
          { path: "registro", Component: Registro },
          {
            path: "mis-pedidos",
            element: (
              <RequireRole roles={["cust"]}>
                <MisPedidos />
              </RequireRole>
            ),
          },
          {
            // TODO F2: crear página DetallePedidoCustomer dedicada.
            // Por ahora apunta a MisPedidos para evitar 404 desde el link en MisPedidos.tsx:228
            path: "mis-pedidos/:id",
            element: (
              <RequireRole roles={["cust"]}>
                <MisPedidos />
              </RequireRole>
            ),
          },
          { path: "*", Component: NotFound },
        ],
      },
      {
        path: "/staff",
        children: [
          { index: true, Component: StaffLogin },
          {
            path: "",
            element: (
              <RequireRole roles={["emp", "admin"]}>
                <WorkerLayout />
              </RequireRole>
            ),
            children: [
              { path: "dashboard", Component: WorkerDashboard },
              { path: "nueva-venta", Component: NuevaVenta },
              { path: "pedidos", Component: PedidosWeb },
              { path: "pedidos/:id", Component: DetallePedido },
              { path: "cierre", Component: CierreCaja },
            ],
          },
        ],
      },
      {
        path: "/admin",
        children: [
          { index: true, Component: AdminLogin },
          {
            path: "",
            element: (
              <RequireRole roles={["admin"]}>
                <AdminLayout />
              </RequireRole>
            ),
            children: [
              { path: "dashboard", Component: AdminDashboard },
              { path: "productos", Component: GestionProductos },
              { path: "stock", Component: ControlStock },
              { path: "pedidos", Component: PedidosWeb },
              { path: "usuarios", Component: GestionUsuarios },
              { path: "reportes", Component: Reportes },
            ],
          },
        ],
      },
    ],
  },
]);
