import image_botica_icono_2 from "@/imports/botica_icono-2.jpeg";
import yape_logo from "@/imports/yape_logo.png";
import plin_logo from "@/imports/plin_logo.png";
import { Link } from "react-router";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  BookOpen,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { useLocations } from "../lib/LocationContext";
import {
  telHref,
  whatsappHref,
  mailtoHref,
  mapsQueryOf,
  mapsSearchUrl,
  storePhone,
} from "../lib/contact";

export function Footer() {
  const { locations } = useLocations();

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
              Tu farmacia de confianza: medicamentos certificados, atención
              profesional y los mejores precios del mercado.
            </p>
            <div
              className="digemid-badge mt-5 flex items-center gap-2 text-sm"
              style={{ color: "rgba(226,232,240,0.8)" }}
            >
              <svg className="digemid-check digemid-check-on-dark" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" className="digemid-ring" />
                <path d="M7 12.5l3.5 3.5L17 9" className="digemid-tick" />
              </svg>
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

          {/* Columnas dinámicas: una por sede (datos del backend) */}
          {locations.map((store) => {
            const phone = storePhone(store);
            const tel = telHref(phone);
            const wa = whatsappHref(phone);
            const mail = mailtoHref(store.location_email);
            const mapQuery = mapsQueryOf(store);
            return (
              <div key={store.location_id}>
                <h3
                  className="font-bold mb-5 text-sm text-white uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {store.district || store.location_name}
                </h3>
                <ul className="space-y-3 text-sm" style={{ color: "rgba(226,232,240,0.6)" }}>
                  {store.location_address && (
                    <li className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                      <span>{store.location_address}</span>
                    </li>
                  )}
                  {store.schedule && (
                    <li className="flex items-start gap-2.5">
                      <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                      <span>{store.schedule}</span>
                    </li>
                  )}
                  {tel && (
                    <li className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <a href={tel} className="hover:text-white transition-colors">
                          {phone.trim()}
                        </a>
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium transition-colors"
                            style={{ color: "var(--c-brand)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-brand)")}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </li>
                  )}
                  {mail && (
                    <li className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                      <a href={mail} className="hover:text-white transition-colors break-all">
                        {store.location_email}
                      </a>
                    </li>
                  )}
                  {mapQuery && (
                    <li className="flex items-start gap-2.5">
                      <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                      <a
                        href={mapsSearchUrl(mapQuery)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors"
                      >
                        Ver en Google Maps
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
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

              {/* Logos visuales de métodos de pago */}
              <div className="flex items-center gap-2 flex-wrap md:justify-end">

                {/* ======== YAPE ========
                    Imagen real con fondo morado a juego
                */}
                <div
                  className="h-10 w-20 rounded-md flex items-center justify-center shadow-sm overflow-hidden"
                  style={{ backgroundColor: "#702F8A" }}
                  title="Yape"
                >
                  <img
                    src={yape_logo}
                    alt="Yape"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* ======== PLIN ========
                    Imagen real sobre fondo blanco
                */}
                <div
                  className="h-10 w-20 rounded-md flex items-center justify-center shadow-sm overflow-hidden"
                  style={{ backgroundColor: "#FFFFFF" }}
                  title="Plin"
                >
                  <img
                    src={plin_logo}
                    alt="Plin"
                    className="w-full h-full object-contain p-1"
                  />
                </div>

                {/* ======== EFECTIVO ========
                    Verde con icono de billete + texto "Efectivo"
                */}
                <div
                  className="h-10 px-3 rounded-md flex items-center justify-center gap-1.5 shadow-sm"
                  style={{ backgroundColor: "#16A34A" }}
                  title="Efectivo"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2.5" />
                    <path d="M6 10v.01M18 14v.01" />
                  </svg>
                  <span
                    className="text-white text-[11px] font-bold uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Efectivo
                  </span>
                </div>

                {/* ======== VISA ========
                    Azul oficial con "VISA" en cursiva
                */}
                <div
                  className="h-10 w-20 rounded-md flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: "#1A1F71" }}
                  title="Visa"
                >
                  <span
                    className="text-white font-extrabold text-base italic tracking-wider"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    VISA
                  </span>
                </div>

                {/* ======== MASTERCARD ========
                    Fondo blanco con círculos rojo + naranja superpuestos
                */}
                <div
                  className="h-10 w-20 rounded-md flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--c-line)" }}
                  title="Mastercard"
                >
                  <svg viewBox="0 0 36 22" className="h-6">
                    <circle cx="13" cy="11" r="9" fill="#EB001B" />
                    <circle cx="23" cy="11" r="9" fill="#F79E1B" fillOpacity="0.9" />
                    <path d="M18 4.5 a9 9 0 0 1 0 13 a9 9 0 0 1 0 -13" fill="#FF5F00" />
                  </svg>
                </div>

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