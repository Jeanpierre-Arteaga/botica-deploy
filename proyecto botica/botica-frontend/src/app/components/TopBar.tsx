import { Phone, MessageCircle, Facebook, Instagram, Truck } from "lucide-react";

/**
 * Barra naranja superior (redes + envío gratis + teléfonos de sede).
 * Va SIEMPRE visible al tope del header sticky del cliente: no se colapsa
 * ni se oculta al hacer scroll.
 */
export function TopBar() {
  return (
    <div className="bg-brand text-white">
      <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between gap-4 text-xs">
        {/* IZQUIERDA: redes + envío gratis */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-0.5">
            <a
              href="https://wa.me/51900000000"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="p-1 rounded-full hover:bg-white/15 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com/boticascentral"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="p-1 rounded-full hover:bg-white/15 transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://www.instagram.com/boticascentral?igsh=ZGZjNjF1bGVjN2xx&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-1 rounded-full hover:bg-white/15 transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
          {/* Texto solo desde sm+ para no saturar el móvil */}
          <span className="hidden sm:flex items-center gap-1.5 font-medium border-l border-white/25 pl-3 whitespace-nowrap">
            <Truck className="w-3.5 h-3.5" />
            Envío gratis desde S/ 50
          </span>
        </div>

        {/* DERECHA: teléfonos de las sedes */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <a
            href="tel:013572468"
            className="flex items-center gap-1.5 hover:text-white/80 transition-colors whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="font-medium">
              <span className="hidden sm:inline">Ate: </span>(01) 357-2468
            </span>
          </a>
          <span className="hidden sm:inline text-white/40">|</span>
          {/* Segundo teléfono solo desde sm+ (en móvil dejamos lo esencial) */}
          <a
            href="tel:013621547"
            className="hidden sm:flex items-center gap-1.5 hover:text-white/80 transition-colors whitespace-nowrap"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="font-medium">Santa Anita: (01) 362-1547</span>
          </a>
        </div>
      </div>
    </div>
  );
}
