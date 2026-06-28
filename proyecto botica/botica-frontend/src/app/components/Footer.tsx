import image_botica_icono_2 from "@/imports/botica_icono-2.jpeg";
import yape_logo from "@/imports/yape_logo.png";
import plin_logo from "@/imports/plin_logo.png";
import { Link } from "react-router";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  BookOpen,
  CreditCard,
  ChevronRight,
  Stethoscope,
  Info,
  Cookie,
  Mail,
} from "lucide-react";
import { useLocations } from "../lib/LocationContext";
import { telHref, whatsappHref, storePhone } from "../lib/contact";
import { PROVEEDOR } from "../pages/legal/proveedor";
import { openCookiePreferences } from "./CookieConsent";

// Enlaces de navegación general.
const NAV_LINKS = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/carrito", label: "Mi Carrito" },
  { to: "/mis-pedidos", label: "Mis Pedidos" },
  { to: "/login", label: "Iniciar Sesión" },
];

// Enlaces de la zona "Legal" (orden consistente).
const LEGAL_LINKS = [
  { to: "/libro-reclamaciones", label: "Libro de Reclamaciones" },
  { to: "/privacidad", label: "Política de Privacidad" },
  { to: "/terminos", label: "Términos y Condiciones" },
  { to: "/cookies", label: "Política de Cookies" },
  { to: "/devoluciones", label: "Cambios y Devoluciones" },
];

// Estilo de hover compartido por todos los enlaces del footer.
const linkHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
    (e.currentTarget.style.color = "var(--c-brand)"),
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) =>
    (e.currentTarget.style.color = "rgba(226,232,240,0.6)"),
};

export function Footer() {
  const { locations } = useLocations();

  // "Ver en el mapa" → lleva a la sección de tiendas (id="tiendas" en Home).
  // Si ya estamos en Home, hace scroll suave; si no, el Link navega a "/#tiendas"
  // y ScrollToTop posiciona la sección.
  const scrollToTiendas = (e: React.MouseEvent) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      document.getElementById("tiendas")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer style={{ backgroundColor: "var(--c-ink)" }}>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ============================================================
            Banner del Libro de Reclamaciones — slim (DS 011-2011-PCM)
            ============================================================ */}
        <div
          className="mb-9 rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--c-brand)" }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm leading-snug" style={{ color: "rgba(226,232,240,0.9)" }}>
              <span style={{ color: "var(--c-brand)" }} className="font-semibold">
                Conforme a la Ley N° 29571
              </span>
              {" · "}
              Boticas Central cuenta con un{" "}
              <strong className="text-white">Libro de Reclamaciones</strong> a tu disposición.
            </p>
          </div>
          <Link
            to="/libro-reclamaciones"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all shadow-sm hover:shadow-md flex-shrink-0"
            style={{ backgroundColor: "var(--c-brand)" }}
          >
            Ábrelo aquí
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ============================================================
            Grilla compacta — 12 cols en desktop, 2 en tablet, 1 en móvil
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-9">
          {/* Col 1 · Marca + DIGEMID (única vez) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <img
              src={image_botica_icono_2}
              alt="Boticas Central"
              className="h-14 w-36 object-contain rounded-[20px] mb-4"
            />
            <p className="leading-relaxed text-sm" style={{ color: "rgba(226,232,240,0.7)" }}>
              Tu farmacia de confianza: medicamentos certificados, atención profesional y los mejores
              precios del mercado.
            </p>
            <div
              className="digemid-badge mt-4 flex items-center gap-2 text-sm"
              style={{ color: "rgba(226,232,240,0.85)" }}
            >
              <svg className="digemid-check digemid-check-on-dark" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" className="digemid-ring" />
                <path d="M7 12.5l3.5 3.5L17 9" className="digemid-tick" />
              </svg>
              <span>Certificado por DIGEMID</span>
            </div>
          </div>

          {/* Col 2 · Enlaces */}
          <div className="lg:col-span-2">
            <FooterHeading>Enlaces</FooterHeading>
            <ul className="space-y-2.5 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1.5 transition-colors"
                    style={{ color: "rgba(226,232,240,0.6)" }}
                    {...linkHover}
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 · Legal */}
          <div className="lg:col-span-2">
            <FooterHeading>Legal</FooterHeading>
            <ul className="space-y-2.5 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1.5 transition-colors"
                    style={{ color: "rgba(226,232,240,0.6)" }}
                    {...linkHover}
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="inline-flex items-center gap-1.5 transition-colors"
                  style={{ color: "rgba(226,232,240,0.6)" }}
                  {...linkHover}
                >
                  <Cookie className="w-3.5 h-3.5 opacity-60" />
                  Configurar cookies
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 · Sedes (ambas, compactas) */}
          <div className="lg:col-span-3">
            <FooterHeading>Sedes</FooterHeading>
            <div className="space-y-5">
              {locations.map((store) => {
                const phone = storePhone(store);
                const tel = telHref(phone);
                const wa = whatsappHref(phone);
                // Limpia el "(medianoche)" que viene en el horario del backend.
                const schedule = store.schedule
                  ? store.schedule.replace(/\s*\(medianoche\)\s*/gi, "").trim()
                  : "";
                return (
                  <div key={store.location_id}>
                    <p className="text-sm font-semibold text-white mb-1.5">
                      {store.district || store.location_name}
                    </p>
                    <ul className="space-y-1.5 text-[13px]" style={{ color: "rgba(226,232,240,0.6)" }}>
                      {schedule && (
                        <li className="flex items-start gap-2 leading-snug">
                          <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                          <span>{schedule}</span>
                        </li>
                      )}
                      {tel && (
                        <li className="flex items-center gap-2 flex-wrap leading-snug">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
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
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </a>
                          )}
                        </li>
                      )}
                      <li>
                        <Link
                          to="/#tiendas"
                          onClick={scrollToTiendas}
                          className="inline-flex items-center gap-1.5 font-medium transition-colors"
                          style={{ color: "var(--c-brand)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--c-brand)")}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Ver en el mapa
                        </Link>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 5 · Métodos de pago + aviso del rubro (breve) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <FooterHeading>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" style={{ color: "var(--c-brand)" }} />
                Pago
              </span>
            </FooterHeading>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {/* Yape */}
              <div
                className="h-9 w-16 rounded-md flex items-center justify-center shadow-sm overflow-hidden"
                style={{ backgroundColor: "var(--c-pay-yape)" }}
                title="Yape"
              >
                <img src={yape_logo} alt="Yape" className="w-full h-full object-contain" />
              </div>
              {/* Plin */}
              <div
                className="h-9 w-16 rounded-md flex items-center justify-center shadow-sm overflow-hidden"
                style={{ backgroundColor: "#FFFFFF" }}
                title="Plin"
              >
                <img src={plin_logo} alt="Plin" className="w-full h-full object-contain p-1" />
              </div>
              {/* Efectivo */}
              <div
                className="h-9 px-2.5 rounded-md flex items-center justify-center gap-1 shadow-sm"
                style={{ backgroundColor: "var(--c-success)" }}
                title="Efectivo"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth="2">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2.5" />
                  <path d="M6 10v.01M18 14v.01" />
                </svg>
                <span
                  className="text-white text-[10px] font-bold uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  Efectivo
                </span>
              </div>
              {/* Visa */}
              <div
                className="h-9 w-16 rounded-md flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "var(--c-pay-visa)" }}
                title="Visa"
              >
                <span
                  className="text-white font-extrabold text-sm italic tracking-wider"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  VISA
                </span>
              </div>
              {/* Mastercard */}
              <div
                className="h-9 w-16 rounded-md flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#FFFFFF" }}
                title="Mastercard"
              >
                <svg viewBox="0 0 36 22" className="h-5">
                  <circle cx="13" cy="11" r="9" fill="#EB001B" />
                  <circle cx="23" cy="11" r="9" fill="#F79E1B" fillOpacity="0.9" />
                  <path d="M18 4.5 a9 9 0 0 1 0 13 a9 9 0 0 1 0 -13" fill="#FF5F00" />
                </svg>
              </div>
            </div>

            {/* Aviso del rubro farmacia — breve */}
            <ul className="space-y-2 text-[12px]" style={{ color: "rgba(226,232,240,0.55)" }}>
              <li className="flex items-start gap-2 leading-snug">
                <Stethoscope className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                <span>Algunos medicamentos requieren receta médica y solo se dispensan con ella.</span>
              </li>
              <li className="flex items-start gap-2 leading-snug">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} />
                <span>Información referencial; no reemplaza la consulta con un profesional de salud.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================
            Copyright — misma caja, separado solo por un divisor
            (sin dirección: ya vive en la columna de su sede)
            ============================================================ */}
        <div
          className="mt-9 pt-5 flex flex-col md:flex-row items-center justify-between gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs text-center md:text-left" style={{ color: "rgba(226,232,240,0.45)" }}>
            © 2026 {PROVEEDOR.razon_social} — RUC {PROVEEDOR.ruc}. Todos los derechos reservados.
          </p>
          <a
            href={`mailto:${PROVEEDOR.email_contacto}`}
            className="text-xs hover:text-white transition-colors inline-flex items-center gap-1"
            style={{ color: "rgba(226,232,240,0.45)" }}
          >
            <Mail className="w-3 h-3" />
            {PROVEEDOR.email_contacto}
          </a>
        </div>
      </div>
    </footer>
  );
}

// Encabezado de columna del footer (estilo unificado).
function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="font-bold mb-4 text-sm text-white uppercase tracking-wider"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </h3>
  );
}
