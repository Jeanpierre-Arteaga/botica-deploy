import image_botica_icono_2 from '@/imports/botica_icono-2.jpeg'
import image_botica_icono_1 from '@/imports/botica_icono-1.jpeg'
import { Link } from "react-router";
import { MapPin, Clock, Phone, Mail, BookOpen, ShieldCheck, CreditCard } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0B1F3A] text-gray-200 mt-12 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <img
                src={image_botica_icono_2}
                alt="Boticas Central"
                className="h-16 md:h-20 w-40 md:w-48 object-contain rounded-[24px]"
              />
            </div>
            <p className="text-gray-300 leading-relaxed text-[14px]">
              Tu farmacia de confianza con medicamentos certificados y los mejores precios del mercado.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-gray-300">
              <ShieldCheck className="w-4 h-4 text-[#FFD60A]" />
              <span>Certificado por DIGEMID</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-base text-white uppercase tracking-wide">Enlaces</h3>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li><Link to="/" className="hover:text-[#F26430] transition-colors">Inicio</Link></li>
              <li><Link to="/catalogo" className="hover:text-[#F26430] transition-colors">Catálogo</Link></li>
              <li><Link to="/carrito" className="hover:text-[#F26430] transition-colors">Mi Carrito</Link></li>
              <li><Link to="/mis-pedidos" className="hover:text-[#F26430] transition-colors">Mis Pedidos</Link></li>
              <li><Link to="/login" className="hover:text-[#F26430] transition-colors">Iniciar Sesión</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-base text-white uppercase tracking-wide">Sede Ate</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F26430]" />
                <span>Av. Separadora Industrial 123, Ate - Lima</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F26430]" />
                <span>Lun - Dom: 8:00 AM - 10:00 PM</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F26430]" />
                <span>(01) 555-1234</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-base text-white uppercase tracking-wide">Sede Santa Anita</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F26430]" />
                <span>Av. Los Frutales 456, Santa Anita - Lima</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F26430]" />
                <span>Lun - Dom: 8:00 AM - 10:00 PM</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#F26430]" />
                <span>(01) 555-5678</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <a
              href="#libro-reclamaciones"
              className="inline-flex items-center gap-3 bg-white text-[#0B1F3A] px-5 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-md hover:shadow-lg w-full md:w-auto"
            >
              <div className="bg-[#F26430] p-2 rounded-lg flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Conforme a Ley N° 29571</div>
                <div className="text-sm font-bold">Libro de Reclamaciones</div>
              </div>
            </a>

            <div className="flex flex-col md:items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-300 font-medium uppercase tracking-wide">
                <CreditCard className="w-4 h-4" />
                Métodos de pago
              </div>
              <div className="flex items-center gap-2 flex-wrap md:justify-end">
                <span className="bg-white text-[#0B1F3A] px-3 py-1.5 rounded-md text-xs font-bold">Efectivo</span>
                <span className="bg-[#702F8A] text-white px-3 py-1.5 rounded-md text-xs font-bold">Yape</span>
                <span className="bg-[#00B2E2] text-white px-3 py-1.5 rounded-md text-xs font-bold">Plin</span>
                <span className="bg-[#1A1F71] text-white px-3 py-1.5 rounded-md text-xs font-bold">Visa</span>
                <span className="bg-[#EB001B] text-white px-3 py-1.5 rounded-md text-xs font-bold">Mastercard</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#06152A]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © 2026 Boticas Central. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap justify-center">
            <a href="#privacidad" className="hover:text-white transition-colors">Política de Privacidad</a>
            <span className="text-gray-600">·</span>
            <a href="#terminos" className="hover:text-white transition-colors">Términos y Condiciones</a>
            <span className="text-gray-600">·</span>
            <a href="mailto:contacto@boticascentral.com" className="hover:text-white transition-colors inline-flex items-center gap-1">
              <Mail className="w-3 h-3" />
              contacto@boticascentral.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
