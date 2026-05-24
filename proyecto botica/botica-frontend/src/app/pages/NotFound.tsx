import { Link } from "react-router";
import { Home, Search } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-9xl mb-6">🔍</div>
        <h1 className="text-6xl font-bold text-[#FF6633] mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
          404
        </h1>
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-family-heading)' }}>
          Página no encontrada
        </h2>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-[#FF6633] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#E85522] transition-colors"
          >
            <Home className="w-5 h-5" />
            Volver al inicio
          </Link>
          <Link
            to="/catalogo"
            className="inline-flex items-center justify-center gap-2 border-2 border-[#2B7DBF] text-[#2B7DBF] px-6 py-3 rounded-lg font-semibold hover:bg-[#2B7DBF] hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
            Ver catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
