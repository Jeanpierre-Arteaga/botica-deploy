// ============================================================
// Terminos — Términos y Condiciones
// ============================================================
// Contrato de e-commerce coherente con la Ley N° 29571 (Código de
// Protección y Defensa del Consumidor) y normativa peruana aplicable.
// Contenido redactado para BOTICAS CENTRAL MOREL S.A.C.
// Documento referencial: revisar con asesoría legal antes de producción.
// ============================================================

import { Link } from "react-router";
import { ScrollText } from "lucide-react";
import { LegalPage, LegalSection } from "./LegalPage";
import { PROVEEDOR } from "./proveedor";

const SECTIONS: LegalSection[] = [
  {
    id: "identificacion",
    number: "1",
    title: "Identificación de la empresa y aceptación",
    content: (
      <>
        <p>
          El presente sitio web es operado por <strong>{PROVEEDOR.razon_social}</strong>, con RUC{" "}
          {PROVEEDOR.ruc} y domicilio en {PROVEEDOR.domicilio} (en adelante, "la Botica").
        </p>
        <p>
          Al navegar, registrarte o realizar una compra en este sitio, declaras haber leído y aceptado
          estos Términos y Condiciones, así como nuestra{" "}
          <Link to="/privacidad">Política de Privacidad</Link>. Si no estás de acuerdo con ellos, te
          pedimos no utilizar el sitio.
        </p>
        <p>
          La Botica podrá actualizar estos términos en cualquier momento; la versión vigente será siempre
          la publicada en esta página.
        </p>
      </>
    ),
  },
  {
    id: "objeto",
    number: "2",
    title: "Objeto",
    content: (
      <>
        <p>
          Estos términos regulan el uso del sitio web y la venta en línea de productos farmacéuticos,
          dispositivos médicos y productos afines ofrecidos por la Botica, dentro del marco de la
          normativa sanitaria peruana y bajo la supervisión de la autoridad competente (DIGEMID).
        </p>
      </>
    ),
  },
  {
    id: "registro",
    number: "3",
    title: "Registro de usuario y responsabilidad de la cuenta",
    content: (
      <>
        <p>
          Para realizar compras puede requerirse la creación de una cuenta. Te comprometes a brindar
          información veraz, completa y actualizada, y a mantenerla así.
        </p>
        <ul>
          <li>
            Eres responsable de la confidencialidad de tus credenciales de acceso y de toda actividad
            realizada desde tu cuenta.
          </li>
          <li>
            Debes notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta.
          </li>
          <li>
            El registro está dirigido a personas mayores de edad con capacidad legal para contratar.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "productos-precios",
    number: "4",
    title: "Productos, precios y disponibilidad",
    content: (
      <>
        <p>
          Los precios se expresan en <strong>soles (S/)</strong> e incluyen los impuestos de ley, salvo
          que se indique lo contrario. Los precios y promociones pueden variar sin previo aviso, pero el
          precio aplicable será el vigente al momento de confirmar tu pedido.
        </p>
        <ul>
          <li>
            La disponibilidad de los productos está sujeta a stock; ante una eventual falta de stock, te
            informaremos y podrás optar por un reemplazo, esperar la reposición o la devolución del importe
            pagado.
          </li>
          <li>
            Algunos <strong>medicamentos requieren receta médica válida</strong>. La Botica podrá
            condicionar o rechazar su dispensación cuando no se presente la receta correspondiente,
            conforme a la normativa sanitaria.
          </li>
          <li>
            Las imágenes de los productos son referenciales y pueden presentar variaciones respecto del
            empaque real.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "compra-pago",
    number: "5",
    title: "Proceso de compra, pago y comprobantes",
    content: (
      <>
        <p>
          La compra se concreta cuando seleccionas tus productos, confirmas el pedido y se valida el pago.
          Recibirás una confirmación con el detalle de tu compra.
        </p>
        <p>Aceptamos los siguientes métodos de pago:</p>
        <ul>
          <li>Billeteras digitales: Yape y Plin.</li>
          <li>Tarjetas de crédito o débito a través de la pasarela MercadoPago.</li>
          <li>Efectivo (según la modalidad de entrega disponible).</li>
        </ul>
        <p>
          Por cada compra emitiremos el comprobante de pago correspondiente (<strong>boleta</strong> o{" "}
          <strong>factura</strong>), de acuerdo con los datos que proporciones al momento de la compra.
        </p>
      </>
    ),
  },
  {
    id: "entrega",
    number: "6",
    title: "Entrega y zonas de cobertura",
    content: (
      <>
        <p>Ofrecemos dos modalidades de recepción de tus productos:</p>
        <ul>
          <li>
            <strong>Delivery a domicilio:</strong> entrega estimada en un plazo de 24 a 48 horas dentro de
            las zonas de cobertura, según la disponibilidad y la dirección de entrega.
          </li>
          <li>
            <strong>Retiro en tienda:</strong> puedes recoger tu pedido en la sede que elijas una vez
            confirmada su disponibilidad.
          </li>
        </ul>
        <p>
          Los plazos de entrega son estimados y pueden variar por factores externos (tráfico, clima,
          fuerza mayor). Las zonas de cobertura y los costos de envío se muestran durante el proceso de
          compra.
        </p>
      </>
    ),
  },
  {
    id: "devoluciones",
    number: "7",
    title: "Cambios, devoluciones y derechos del consumidor",
    content: (
      <>
        <p>
          Como consumidor, te amparan los derechos reconocidos en el{" "}
          <strong>Código de Protección y Defensa del Consumidor (Ley N° 29571)</strong>. Atenderemos
          cambios y devoluciones cuando el producto presente defectos, no corresponda a lo solicitado o se
          encuentre en mal estado al momento de la entrega.
        </p>
        <ul>
          <li>
            Por razones sanitarias, determinados productos farmacéuticos no admiten cambio ni devolución
            una vez entregados, salvo defecto de fabricación o error en el despacho.
          </li>
          <li>
            Para iniciar una solicitud, conserva tu comprobante de pago y comunícate con nuestros canales
            de atención.
          </li>
        </ul>
        <p>
          Si tienes una disconformidad, puedes registrarla en nuestro{" "}
          <Link to="/libro-reclamaciones">Libro de Reclamaciones</Link> virtual, conforme a ley.
        </p>
      </>
    ),
  },
  {
    id: "uso-medicamentos",
    number: "8",
    title: "Uso correcto de medicamentos y descargo",
    content: (
      <>
        <p>
          La información sobre productos publicada en este sitio tiene carácter <strong>referencial</strong>{" "}
          y <strong>no reemplaza la consulta, el diagnóstico ni la prescripción de un profesional de la
          salud</strong>.
        </p>
        <ul>
          <li>
            Antes de consumir cualquier medicamento, lee el prospecto y sigue las indicaciones de tu médico
            o químico farmacéutico.
          </li>
          <li>
            Los medicamentos sujetos a receta solo se dispensarán contra la presentación de una receta
            médica válida.
          </li>
          <li>
            La Botica no se responsabiliza por el uso indebido de los productos contrario a las
            indicaciones profesionales o del fabricante.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "propiedad-ley",
    number: "9",
    title: "Propiedad intelectual, responsabilidad y ley aplicable",
    content: (
      <>
        <p>
          Todos los contenidos del sitio (marcas, logotipos, textos, imágenes y diseño) son de titularidad
          de la Botica o de sus respectivos titulares y están protegidos por la normativa de propiedad
          intelectual. Queda prohibida su reproducción o uso no autorizado.
        </p>
        <p>
          La Botica procura mantener el sitio operativo y la información actualizada, pero no garantiza la
          ausencia de interrupciones o errores, ni se responsabiliza por daños derivados de causas ajenas a
          su control.
        </p>
        <p>
          Estos términos se rigen por las <strong>leyes de la República del Perú</strong>. Cualquier
          controversia se someterá a la jurisdicción de los jueces y tribunales competentes, sin perjuicio
          de los derechos que la normativa de protección al consumidor reconozca al usuario.
        </p>
      </>
    ),
  },
];

export function Terminos() {
  return (
    <LegalPage
      icon={ScrollText}
      title="Términos y Condiciones"
      legalBasis={
        <>
          Condiciones de uso y venta en línea, conforme a la Ley N° 29571, Código de Protección y Defensa
          del Consumidor, y normativa peruana aplicable.
        </>
      }
      sections={SECTIONS}
    />
  );
}
