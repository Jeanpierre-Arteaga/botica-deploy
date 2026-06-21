import image_botica_icono_2 from "@/imports/botica_icono-2.jpeg";
import { Link } from "react-router";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  BookOpen,
  ShieldCheck,
  CreditCard,
  ChevronRight,
} from "lucide-react";

export function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--c-ink)" }}>
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Columna 1: Logo + descripción */}
          <div>
            <div className="mb-5">
              <img
                src={image_botica_icono_2}
                alt="Boticas Central"
                className="h-16 md:h-20 w-40 md:w-48 object-contain rounded-[24px]"
              />
            </div>
            <p
              className="leading-relaxed text-sm"
              style={{ color: "rgba(226,232,240,0.7)" }}
            >
              Tu farmacia de confianza con medicamentos certificados y los
              mejores precios del mercado.
            </p>
            <div
              className="mt-5 flex items-center gap-2 text-sm"
              style={{ color: "rgba(226,232,240,0.8)" }}
            >
              <ShieldCheck className="w-4 h-4" style={{ color: "#FBBF24" }} />
              <span>Certificado por DIGEMID</span>
            </div>
          </div>

          {/* Columna 2: Enlaces */}
          <div>
            <h3
              className="font-bold mb-5 text-sm text-white uppercase tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Enlaces
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: "/", label: "Inicio" },
                { to: "/catalogo", label: "Catálogo" },
                { to: "/carrito", label: "Mi Carrito" },
                { to: "/mis-pedidos", label: "Mis Pedidos" },
                { to: "/login", label: "Iniciar Sesión" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1.5 transition-colors"
                    style={{ color: "rgba(226,232,240,0.6)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--c-brand)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(226,232,240,0.6)")
                    }
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Sede Ate */}
          <div>
            <h3
              className="font-bold mb-5 text-sm text-white uppercase tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sede Ate
            </h3>
            <ul className="space-y-3 text-sm" style={{ color: "rgba(226,232,240,0.6)" }}>
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--c-brand)" }}
                />
                <span>Av. Separadora Industrial 123, Ate - Lima</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--c-brand)" }}
                />
                <span>Lun - Dom: 8:00 AM - 10:00 PM</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--c-brand)" }}
                />
                <span>(01) 555-1234</span>
              </li>
            </ul>
          </div>

          {/* Columna 4: Sede Santa Anita */}
          <div>
            <h3
              className="font-bold mb-5 text-sm text-white uppercase tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Sede Santa Anita
            </h3>
            <ul className="space-y-3 text-sm" style={{ color: "rgba(226,232,240,0.6)" }}>
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--c-brand)" }}
                />
                <span>Av. Los Frutales 456, Santa Anita - Lima</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--c-brand)" }}
                />
                <span>Lun - Dom: 8:00 AM - 10:00 PM</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "var(--c-brand)" }}
                />
                <span>(01) 555-5678</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Libro de Reclamaciones + Métodos de pago */}
        <div
          className="mt-12 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <Link
              to="/libro-reclamaciones"
              className="inline-flex items-center gap-3 bg-white px-5 py-3.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg w-full md:w-auto"
              style={{ color: "var(--c-ink)" }}
            >
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: "var(--c-brand)" }}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--c-muted)" }}>
                  Conforme a Ley N° 29571
                </div>
                <div className="text-sm font-bold">Libro de Reclamaciones</div>
              </div>
            </Link>

            <div className="flex flex-col md:items-end gap-2">
              <div
                className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide"
                style={{ color: "rgba(226,232,240,0.5)" }}
              >
                <CreditCard className="w-4 h-4" />
                Métodos de pago
              </div>
              <div className="flex items-center gap-2 flex-wrap md:justify-end">
                {[
                  { label: "Efectivo", bg: "white", color: "var(--c-ink)" },
                  { label: "Yape", bg: "#702F8A", color: "white" },
                  { label: "Plin", bg: "#00B2E2", color: "white" },
                  { label: "Visa", bg: "#1A1F71", color: "white" },
                  { label: "Mastercard", bg: "#EB001B", color: "white" },
                ].map((pm) => (
                  <span
                    key={pm.label}
                    className="px-3 py-1.5 rounded-md text-xs font-bold"
                    style={{ backgroundColor: pm.bg, color: pm.color }}
                  >
                    {pm.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ backgroundColor: "var(--c-ink)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "rgba(226,232,240,0.4)" }}>
            © 2026 Boticas Central. Todos los derechos reservados.
          </p>
          <div
            className="flex items-center gap-4 text-xs flex-wrap justify-center"
            style={{ color: "rgba(226,232,240,0.4)" }}
          >
            <Link
              to="/privacidad"
              className="hover:text-white transition-colors"
            >
              Política de Privacidad
            </Link>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <Link
              to="/terminos"
              className="hover:text-white transition-colors"
            >
              Términos y Condiciones
            </Link>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <a
              href="mailto:contacto@boticascentral.com"
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              contacto@boticascentral.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
