// ============================================================
// Seguridad — Política de Seguridad
// ============================================================
// Describe las medidas de seguridad del sitio (pagos, datos, cuenta)
// y cómo reportar un problema. Complementa la Política de Privacidad y
// la de Cookies. Documento referencial: revisar con asesoría legal /
// equipo técnico antes de producción.
// ============================================================

import { ShieldCheck, Lock } from "lucide-react";
import { LegalPage, LegalSection } from "./LegalPage";
import { Link } from "react-router";

const SECTIONS: LegalSection[] = [
  {
    id: "compromiso",
    number: "1",
    title: "Nuestro compromiso con tu seguridad",
    content: (
      <>
        <p>
          La seguridad de tu información es una prioridad. Aplicamos medidas técnicas y organizativas
          razonables para proteger tus datos personales y tus transacciones frente a accesos no
          autorizados, pérdida o uso indebido.
        </p>
        <p>
          Esta política describe, de forma general, cómo protegemos la información que tratamos cuando
          usas nuestro sitio.
        </p>
      </>
    ),
  },
  {
    id: "pagos",
    number: "2",
    title: "Pagos seguros",
    content: (
      <>
        <p>
          Los pagos con tarjeta se procesan a través de la pasarela de pago{" "}
          <strong>MercadoPago</strong>, un proveedor especializado y certificado. La botica{" "}
          <strong>nunca recibe ni almacena</strong> los datos completos de tu tarjeta: estos viajan
          cifrados directamente al procesador de pago.
        </p>
        <ul>
          <li>No guardamos el número completo, la fecha de vencimiento ni el CVV de tu tarjeta.</li>
          <li>Las operaciones se realizan sobre conexiones cifradas (HTTPS/TLS).</li>
          <li>Para pagos con Yape, Plin, transferencia o efectivo, el staff valida el pago antes de procesar el pedido.</li>
        </ul>
      </>
    ),
  },
  {
    id: "datos",
    number: "3",
    title: "Protección de tus datos",
    content: (
      <>
        <p>Entre las medidas que aplicamos se incluyen:</p>
        <ul>
          <li><strong>Cifrado en tránsito:</strong> la comunicación con el sitio usa HTTPS/TLS.</li>
          <li><strong>Contraseñas protegidas:</strong> se almacenan cifradas (hash), nunca en texto plano.</li>
          <li><strong>Control de acceso:</strong> el personal accede solo a la información necesaria para su función.</li>
          <li><strong>Tokens de sesión:</strong> el acceso a tu cuenta usa tokens con expiración.</li>
        </ul>
        <p>
          Para conocer qué datos tratamos y con qué finalidad, revisa nuestra{" "}
          <Link to="/privacidad">Política de Privacidad</Link>.
        </p>
      </>
    ),
  },
  {
    id: "cuenta",
    number: "4",
    title: "Cuida tu cuenta",
    content: (
      <>
        <p>Tu colaboración también es clave para mantener tu cuenta segura:</p>
        <ul>
          <li>Usa una contraseña robusta y no la reutilices en otros sitios.</li>
          <li>No compartas tu contraseña ni tus códigos de pago con terceros.</li>
          <li>Cierra sesión si usas un dispositivo compartido.</li>
          <li>Desconfía de correos o mensajes que te pidan tus datos: nunca te los solicitaremos por esos medios.</li>
        </ul>
      </>
    ),
  },
  {
    id: "reportar",
    number: "5",
    title: "Cómo reportar un problema de seguridad",
    content: (
      <>
        <p>
          Si detectas una vulnerabilidad o un uso sospechoso de tu cuenta, contáctanos lo antes posible.
          Atenderemos tu reporte con la mayor prontitud posible.
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
          Podemos actualizar esta Política de Seguridad para reflejar mejoras en nuestras medidas o
          cambios normativos. La versión vigente será siempre la publicada en esta página, con su fecha
          de última actualización.
        </p>
      </>
    ),
  },
];

export function Seguridad() {
  return (
    <LegalPage
      icon={ShieldCheck}
      title="Política de Seguridad"
      legalBasis={
        <>
          <Lock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" style={{ color: "var(--c-brand)" }} aria-hidden="true" />
          Medidas que aplicamos para proteger tus pagos, tus datos y tu cuenta.
        </>
      }
      sections={SECTIONS}
    />
  );
}
