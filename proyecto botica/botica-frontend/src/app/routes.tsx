import { createBrowserRouter, Outlet } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/AuthContext";
import { CartProvider } from "./lib/CartContext";
import { LocationProvider } from "./lib/LocationContext";
import { RequireRole } from "./components/RequireRole";
import { PublicLayout } from "./layouts/PublicLayout";
import { StoreAuthLayout } from "./layouts/StoreAuthLayout";
import StaffLayout from "./layouts/StaffLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Home } from "./pages/Home";
import { Catalogo } from "./pages/Catalogo";
import { ProductoDetalle } from "./pages/ProductoDetalle";
import { Carrito } from "./pages/Carrito";
import { Checkout } from "./pages/Checkout";
import { Confirmacion } from "./pages/Confirmacion";
import { ClientLogin } from "./pages/ClientLogin";
import { Registro } from "./pages/Registro";
import { RecuperarPassword } from "./pages/RecuperarPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { StaffLogin } from "./pages/StaffLogin";
import { AdminLogin } from "./pages/AdminLogin";
import { NotFound } from "./pages/NotFound";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffPedidos from "./pages/staff/StaffPedidos";
import StaffDetallePedido from "./pages/staff/StaffDetallePedido";
import StaffNuevaVenta from "./pages/staff/StaffNuevaVenta";
import StaffCierre from "./pages/staff/StaffCierre";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { GestionProductos } from "./pages/admin/GestionProductos";
import { ControlStock } from "./pages/admin/ControlStock";
import { GestionUsuarios } from "./pages/admin/GestionUsuarios";
import { Reportes } from "./pages/admin/Reportes";
import { MisPedidos } from "./pages/MisPedidos";
import { DetallePedidoCustomer } from "./pages/DetallePedidoCustomer";

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
          <Toaster
            position="bottom-right"
            duration={2500}
            gap={10}
            toastOptions={{
              style: {
                background: "var(--c-surface)",
                color: "var(--c-text)",
                border: "1px solid var(--c-line)",
                borderRadius: "14px",
                boxShadow: "var(--elev-card)",
                fontSize: "14px",
                padding: "12px 14px",
              },
            }}
          />
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
          {
            path: "confirmacion/:orderId",
            element: (
              <RequireRole roles={["cust"]}>
                <Confirmacion />
              </RequireRole>
            ),
          },
          {
            path: "mis-pedidos",
            element: (
              <RequireRole roles={["cust"]}>
                <MisPedidos />
              </RequireRole>
            ),
          },
          {
            path: "mis-pedidos/:id",
            element: (
              <RequireRole roles={["cust"]}>
                <DetallePedidoCustomer />
              </RequireRole>
            ),
          },
          { path: "*", Component: NotFound },
        ],
      },
      // Acceso de cliente: conserva TopBar + Navbar (conectividad del sitio),
      // SIN la barra de categorías ni Footer. Mismas URLs (/login, /registro);
      // solo cambia el chrome que las envuelve.
      {
        Component: StoreAuthLayout,
        children: [
          { path: "/login", Component: ClientLogin },
          { path: "/registro", Component: Registro },
          { path: "/recuperar-password", Component: RecuperarPassword },
          { path: "/reset-password", Component: ResetPassword },
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
                <StaffLayout />
              </RequireRole>
            ),
            children: [
              { path: "dashboard", Component: StaffDashboard },
              { path: "nueva-venta", Component: StaffNuevaVenta },
              { path: "pedidos", Component: StaffPedidos },
              { path: "pedidos/:orderId", Component: StaffDetallePedido },
              { path: "cierre", Component: StaffCierre },
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
              { path: "pedidos", Component: StaffPedidos },
              { path: "pedidos/:orderId", Component: StaffDetallePedido },
              { path: "usuarios", Component: GestionUsuarios },
              { path: "reportes", Component: Reportes },
            ],
          },
        ],
      },
    ],
  },
]);
