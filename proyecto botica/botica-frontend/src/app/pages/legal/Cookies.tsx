// ============================================================
// Cookies — Política de Cookies
// ============================================================
// Base legal: Ley N° 29733 (Protección de Datos Personales) y su
// Reglamento, D.S. 016-2024-JUS. Complementa la Política de
// Privacidad y se vincula con el banner de consentimiento.
// Documento referencial: revisar con asesoría legal antes de producción.
// ============================================================

import { Cookie, SlidersHorizontal } from "lucide-react";
import { LegalPage, LegalSection } from "./LegalPage";
import { Link } from "react-router";
import { openCookiePreferences } from "../../components/CookieConsent";

const SECTIONS: LegalSection[] = [
  {
    id: "que-son",
    number: "1",
    title: "Qué son las cookies",
    content: (
      <>
        <p>
          Las cookies son pequeños archivos de texto que un sitio web almacena en tu navegador cuando lo
          visitas. Permiten que el sitio recuerde información sobre tu visita, como tus preferencias, para
          facilitar tu navegación y mejorar tu experiencia.
        </p>
        <p>
          Junto a las cookies utilizamos tecnologías similares (como el almacenamiento local del
          navegador), a las que esta política se aplica por igual.
        </p>
      </>
    ),
  },
  {
    id: "tipos",
    number: "2",
    title: "Qué tipos de cookies usamos",
    content: (
      <>
        <p>En este sitio utilizamos las siguientes categorías de cookies:</p>
        <ul>
          <li>
            <strong>Técnicas o de sesión (siempre activas):</strong> imprescindibles para el
            funcionamiento del sitio. Permiten iniciar sesión, mantener los productos en tu carrito,
            recordar el tema claro/oscuro y completar el proceso de compra. Sin ellas el sitio no
            funcionaría correctamente.
          </li>
          <li>
            <strong>Analíticas (opcionales):</strong> nos ayudan a entender de forma agregada cómo se usa
            el sitio (páginas más visitadas, errores), para mejorarlo. No te identifican personalmente.
          </li>
          <li>
            <strong>De personalización (opcionales):</strong> permiten recordar tus preferencias y
            mostrarte contenido más relevante según tu navegación.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "finalidad",
    number: "3",
    title: "Para qué las usamos",
    content: (
      <>
        <p>Empleamos cookies con el fin de:</p>
        <ul>
          <li>Garantizar el funcionamiento seguro del sitio y de tu sesión.</li>
          <li>Mantener el contenido de tu carrito y tus preferencias de visualización.</li>
          <li>Procesar tus pedidos y pagos a través de proveedores seguros.</li>
          <li>Medir y mejorar el rendimiento y la usabilidad del sitio (si aceptas las analíticas).</li>
        </ul>
      </>
    ),
  },
  {
    id: "terceros",
    number: "4",
    title: "Cookies de terceros",
    content: (
      <>
        <p>
          Algunos servicios que integramos pueden instalar sus propias cookies cuando los utilizas, por
          ejemplo la pasarela de pago (MercadoPago) durante el proceso de compra. Estas cookies se rigen
          por las políticas de privacidad y cookies de cada proveedor.
        </p>
      </>
    ),
  },
  {
    id: "gestion",
    number: "5",
    title: "Cómo gestionar o desactivar las cookies",
    content: (
      <>
        <p>
          Puedes decidir qué cookies opcionales aceptas en cualquier momento desde nuestro panel de
          preferencias:
        </p>
        <p>
          <button
            type="button"
            onClick={openCookiePreferences}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow-sm hover:shadow-md"
            style={{ backgroundColor: "var(--c-brand)" }}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Configurar cookies
          </button>
        </p>
        <p>
          Además, puedes bloquear o eliminar las cookies desde la configuración de tu navegador. Cada
          navegador ofrece sus propias opciones; consulta su sección de ayuda. Ten en cuenta que
          desactivar las cookies técnicas puede afectar el funcionamiento de algunas secciones del sitio.
        </p>
        <p>
          Para más información sobre el tratamiento de tus datos, revisa nuestra{" "}
          <Link to="/privacidad">Política de Privacidad</Link>.
        </p>
      </>
    ),
  },
  {
    id: "cambios",
    number: "6",
    title: "Cambios en esta política",
    content: (
      <>
        <p>
          Podemos actualizar esta Política de Cookies para reflejar cambios en el sitio o en la normativa
          aplicable. La versión vigente será siempre la publicada en esta página, con su fecha de última
          actualización.
        </p>
      </>
    ),
  },
];

export function Cookies() {
  return (
    <LegalPage
      icon={Cookie}
      title="Política de Cookies"
      legalBasis={
        <>
          Información sobre el uso de cookies en este sitio, conforme a la Ley N° 29733 y su Reglamento
          (D.S. 016-2024-JUS).
        </>
      }
      sections={SECTIONS}
    />
  );
}
