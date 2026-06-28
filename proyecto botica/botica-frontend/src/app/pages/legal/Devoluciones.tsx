// ============================================================
// Devoluciones — Política de Cambios, Devoluciones y Garantía
// ============================================================
// Base legal: Ley N° 29571 (Código de Protección y Defensa del
// Consumidor). Complementa los Términos y Condiciones.
// Documento referencial: revisar con asesoría legal antes de producción.
// ============================================================

import { Link } from "react-router";
import { RefreshCcw } from "lucide-react";
import { LegalPage, LegalSection } from "./LegalPage";
import { PROVEEDOR } from "./proveedor";

const SECTIONS: LegalSection[] = [
  {
    id: "marco",
    number: "1",
    title: "Marco general",
    content: (
      <>
        <p>
          En <strong>{PROVEEDOR.razon_social}</strong> respetamos los derechos que el{" "}
          <strong>Código de Protección y Defensa del Consumidor (Ley N° 29571)</strong> reconoce a los
          consumidores. Esta política describe las condiciones aplicables a los cambios, devoluciones y la
          garantía de los productos adquiridos a través de nuestro sitio web.
        </p>
        <p>
          Por tratarse de productos farmacéuticos y afines, aplican consideraciones sanitarias específicas
          que se detallan a continuación.
        </p>
      </>
    ),
  },
  {
    id: "plazos",
    number: "2",
    title: "Plazos y condiciones para cambios y devoluciones",
    content: (
      <>
        <p>
          Para solicitar un cambio o devolución, el producto debe encontrarse en las siguientes
          condiciones:
        </p>
        <ul>
          <li>Conservar su empaque original, sellos y precintos de seguridad intactos.</li>
          <li>No haber sido abierto, usado ni manipulado, salvo en casos de defecto de fábrica.</li>
          <li>Presentar el comprobante de pago (boleta o factura) correspondiente.</li>
        </ul>
        <p>
          La solicitud debe realizarse dentro del plazo informado al momento de la compra. Evaluaremos cada
          caso conforme a la normativa de protección al consumidor y a las condiciones sanitarias del
          producto.
        </p>
      </>
    ),
  },
  {
    id: "no-retornables",
    number: "3",
    title: "Productos no retornables",
    content: (
      <>
        <p>
          Por razones de <strong>seguridad sanitaria</strong>, determinados productos no admiten cambio ni
          devolución una vez entregados, salvo que presenten un defecto de fabricación o exista un error en
          el despacho. Entre ellos:
        </p>
        <ul>
          <li>Medicamentos y productos farmacéuticos.</li>
          <li>Productos que requieren cadena de frío o condiciones especiales de conservación.</li>
          <li>Productos de higiene, cuidado personal y uso íntimo cuyo sello haya sido abierto.</li>
        </ul>
        <p>
          Esta restricción protege la salud de todos nuestros clientes y se aplica conforme a la normativa
          sanitaria vigente.
        </p>
      </>
    ),
  },
  {
    id: "garantia",
    number: "4",
    title: "Productos con defecto o error en el despacho",
    content: (
      <>
        <p>
          Si recibes un producto <strong>defectuoso, vencido, dañado</strong> o que{" "}
          <strong>no corresponde</strong> a tu pedido, tienes derecho a su reposición o a la devolución del
          importe pagado, sin costo adicional para ti.
        </p>
        <ul>
          <li>Comunícate con nosotros lo antes posible conservando el producto y su empaque.</li>
          <li>
            De ser posible, adjunta fotografías que evidencien el defecto o el error para agilizar la
            atención.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "como-solicitar",
    number: "5",
    title: "Cómo solicitar un cambio o devolución",
    content: (
      <>
        <p>Para iniciar tu solicitud:</p>
        <ul>
          <li>
            Escríbenos a <strong>{PROVEEDOR.email_contacto}</strong> o comunícate por nuestros canales de
            atención indicando tu número de pedido.
          </li>
          <li>Describe el motivo del cambio o devolución y adjunta tu comprobante de pago.</li>
          <li>
            Te indicaremos los pasos a seguir según la modalidad de entrega (delivery o retiro en tienda).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "reembolsos",
    number: "6",
    title: "Reembolsos",
    content: (
      <>
        <p>
          Cuando corresponda una devolución del importe, el reembolso se realizará por el mismo medio de
          pago utilizado en la compra, salvo acuerdo distinto entre las partes. El plazo de acreditación
          puede variar según la entidad financiera o la pasarela de pago.
        </p>
      </>
    ),
  },
  {
    id: "reclamos",
    number: "7",
    title: "Libro de Reclamaciones",
    content: (
      <>
        <p>
          Si no estás conforme con la atención de tu solicitud, puedes registrar tu caso en nuestro{" "}
          <Link to="/libro-reclamaciones">Libro de Reclamaciones</Link> virtual, conforme a la Ley N°
          29571. Atenderemos tu reclamo o queja en el plazo máximo que establece la ley.
        </p>
      </>
    ),
  },
];

export function Devoluciones() {
  return (
    <LegalPage
      icon={RefreshCcw}
      title="Cambios, Devoluciones y Garantía"
      legalBasis={
        <>
          Condiciones de cambio, devolución y garantía, conforme a la Ley N° 29571, Código de Protección y
          Defensa del Consumidor.
        </>
      }
      sections={SECTIONS}
    />
  );
}
