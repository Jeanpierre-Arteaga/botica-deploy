import { Link } from "react-router";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ChevronRight,
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
  { to: "/seguridad", label: "Política de Seguridad" },
  { to: "/devoluciones", label: "Cambios y Devoluciones" },
];

// Enlaces legales compactos de la barra inferior.
const BOTTOM_LINKS = [
  { to: "/privacidad", label: "Privacidad" },
  { to: "/terminos", label: "Términos" },
  { to: "/cookies", label: "Cookies" },
  { to: "/libro-reclamaciones", label: "Libro de Reclamaciones" },
];

// Medios de pago — logos reales servidos desde public/payments/.
// Yape va sobre su morado de marca (el logo es blanco); el resto, sobre blanco.
const PAYMENTS: { src: string; alt: string; bg: string }[] = [
  { src: "/payments/visa.svg", alt: "Visa", bg: "#FFFFFF" },
  { src: "/payments/mastercard.svg", alt: "Mastercard", bg: "#FFFFFF" },
  { src: "/payments/amex.svg", alt: "American Express", bg: "#FFFFFF" },
  { src: "/payments/yape.png", alt: "Yape", bg: "var(--c-pay-yape)" },
  { src: "/payments/plin.png", alt: "Plin", bg: "#FFFFFF" },
];

// Estilo de hover compartido por todos los enlaces del footer.
const linkHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
    (e.currentTarget.style.color = "var(--c-brand)"),
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) =>
    (e.currentTarget.style.color = "rgba(226,232,240,0.62)"),
};

export function Footer() {
  const { locations } = useLocations();

  // "Ver en el mapa" → sección de tiendas (id="tiendas" en Home).
  const scrollToTiendas = (e: React.MouseEvent) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      document.getElementById("tiendas")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer style={{ backgroundColor: "var(--c-ink)" }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ============================================================
            Franja del Libro de Reclamaciones — slim (acceso secundario;
            el principal vive en la 4ª columna)
            ============================================================ */}
        <div
          className="mb-7 rounded-xl border px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:justify-between"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}
        >
          <p className="text-[12.5px] leading-snug" style={{ color: "rgba(226,232,240,0.78)" }}>
            <span style={{ color: "var(--c-brand)" }} className="font-semibold">
              Conforme a la Ley N° 29571
            </span>
            {" · "}
            Tienes un <strong className="text-white">Libro de Reclamaciones</strong> virtual a tu disposición.
          </p>
          <Link
            to="/libro-reclamaciones"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-[12.5px] text-white transition-all shadow-sm hover:shadow-md flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ backgroundColor: "var(--c-brand)", outlineColor: "#fff" }}
          >
            Ábrelo aquí
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* ============================================================
            3 columnas de contenido + 1 columna utilitaria a la derecha
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-8">
          {/* Col 1 · Enlaces */}
          <nav className="lg:col-span-3" aria-label="Enlaces de navegación">
            <FooterHeading>Enlaces</FooterHeading>
            <ul className="space-y-2 text-[13px]">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1.5 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ color: "rgba(226,232,240,0.62)", outlineColor: "var(--c-brand)" }}
                    {...linkHover}
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 2 · Legal */}
          <nav className="lg:col-span-3" aria-label="Información legal">
            <FooterHeading>Legal</FooterHeading>
            <ul className="space-y-2 text-[13px]">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="inline-flex items-center gap-1.5 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ color: "rgba(226,232,240,0.62)", outlineColor: "var(--c-brand)" }}
                    {...linkHover}
                  >
                    <ChevronRight className="w-3 h-3 opacity-50" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="inline-flex items-center gap-1.5 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ color: "rgba(226,232,240,0.62)", outlineColor: "var(--c-brand)" }}
                  {...linkHover}
                >
                  <Cookie className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                  Configurar cookies
                </button>
              </li>
            </ul>
          </nav>

          {/* Col 3 · Sedes / Contacto (ambas, compactas) */}
          <div className="lg:col-span-3">
            <FooterHeading>Sedes y contacto</FooterHeading>
            <div className="space-y-4">
              {locations.map((store) => {
                const phone = storePhone(store);
                const tel = telHref(phone);
                const wa = whatsappHref(phone);
                const schedule = store.schedule
                  ? store.schedule.replace(/\s*\(medianoche\)\s*/gi, "").trim()
                  : "";
                return (
                  <div key={store.location_id}>
                    <p className="text-[13px] font-semibold text-white mb-1">
                      {store.district || store.location_name}
                    </p>
                    <ul className="space-y-1 text-[12.5px]" style={{ color: "rgba(226,232,240,0.62)" }}>
                      {schedule && (
                        <li className="flex items-start gap-2 leading-snug">
                          <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} aria-hidden="true" />
                          <span>{schedule}</span>
                        </li>
                      )}
                      {tel && (
                        <li className="flex items-center gap-2 flex-wrap leading-snug">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--c-brand)" }} aria-hidden="true" />
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
                              <MessageCircle className="w-3 h-3" aria-hidden="true" />
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
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          Ver en el mapa
                        </Link>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 4 · Utilitaria — Libro de Reclamaciones + Medios de pago */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-6">
            {/* Libro de Reclamaciones (acceso principal: imagen oficial clicable) */}
            <div>
              <FooterHeading>Libro de Reclamaciones</FooterHeading>
              <Link
                to="/libro-reclamaciones"
                aria-label="Abrir el Libro de Reclamaciones"
                className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ outlineColor: "var(--c-brand)" }}
              >
                <img
                  src="/libro-reclamaciones.svg"
                  alt="Libro de Reclamaciones — Ley N° 29571"
                  className="h-14 w-auto rounded-lg shadow-sm transition-transform hover:scale-[1.02]"
                />
              </Link>
            </div>

            {/* Medios de pago */}
            <div>
              <FooterHeading>Medios de pago</FooterHeading>
              <ul className="flex items-center gap-2 flex-wrap" aria-label="Medios de pago aceptados">
                {PAYMENTS.map((p) => (
                  <li
                    key={p.alt}
                    className="h-8 w-12 rounded-md flex items-center justify-center shadow-sm overflow-hidden"
                    style={{ backgroundColor: p.bg }}
                    title={p.alt}
                  >
                    <img src={p.src} alt={p.alt} className="max-h-5 max-w-[85%] w-auto object-contain" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ============================================================
            Barra inferior de legales — razón social, RUC, DIGEMID,
            enlaces clave y copyright (compacta)
            ============================================================ */}
        <div
          className="mt-8 pt-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
            {/* DIGEMID — reubicado aquí (sobrio y visible) */}
            <div
              className="digemid-badge flex items-center gap-2 text-[12.5px]"
              style={{ color: "rgba(226,232,240,0.82)" }}
            >
              <svg className="digemid-check digemid-check-on-dark" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" className="digemid-ring" />
                <path d="M7 12.5l3.5 3.5L17 9" className="digemid-tick" />
              </svg>
              <span>Certificado por DIGEMID</span>
            </div>
            <p className="text-[12px]" style={{ color: "rgba(226,232,240,0.5)" }}>
              {PROVEEDOR.razon_social} — RUC {PROVEEDOR.ruc}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
            {BOTTOM_LINKS.map((link, i) => (
              <span key={link.to} className="inline-flex items-center gap-3">
                <Link
                  to={link.to}
                  className="transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ color: "rgba(226,232,240,0.55)", outlineColor: "var(--c-brand)" }}
                  {...linkHover}
                >
                  {link.label}
                </Link>
                {i < BOTTOM_LINKS.length - 1 && (
                  <span style={{ color: "rgba(226,232,240,0.25)" }} aria-hidden="true">·</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Copyright + contacto */}
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-center md:text-left" style={{ color: "rgba(226,232,240,0.45)" }}>
            © 2026 {PROVEEDOR.razon_social}. Todos los derechos reservados.
          </p>
          <a
            href={`mailto:${PROVEEDOR.email_contacto}`}
            className="text-xs hover:text-white transition-colors inline-flex items-center gap-1"
            style={{ color: "rgba(226,232,240,0.45)" }}
          >
            <Mail className="w-3 h-3" aria-hidden="true" />
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
      className="font-bold mb-3 text-[13px] text-white uppercase tracking-wider"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {children}
    </h3>
  );
}
