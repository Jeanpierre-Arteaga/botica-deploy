// ============================================================
// Privacidad — Política de Privacidad
// ============================================================
// Base legal: Ley N° 29733 (Ley de Protección de Datos Personales)
// y su Reglamento, D.S. 016-2024-JUS.
// Contenido redactado para BOTICAS CENTRAL MOREL S.A.C.
// Documento referencial: revisar con asesoría legal antes de producción.
// ============================================================

import { ShieldCheck } from "lucide-react";
import { LegalPage, LegalSection } from "./LegalPage";
import { PROVEEDOR } from "./proveedor";

const SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    number: "1",
    title: "Identidad del responsable del tratamiento",
    content: (
      <>
        <p>
          El responsable del tratamiento de los datos personales recopilados a través de este sitio
          web es:
        </p>
        <ul>
          <li>
            <strong>Razón social:</strong> {PROVEEDOR.razon_social}
          </li>
          <li>
            <strong>RUC:</strong> {PROVEEDOR.ruc}
          </li>
          <li>
            <strong>Domicilio:</strong> {PROVEEDOR.domicilio}
          </li>
          <li>
            <strong>Correo de contacto para datos personales:</strong> {PROVEEDOR.email_datos}
          </li>
          <li>
            <strong>Teléfono:</strong> {PROVEEDOR.telefono}
          </li>
        </ul>
        <p>
          Cualquier consulta relacionada con el tratamiento de tus datos personales puede dirigirse al
          correo indicado, que funciona como canal oficial de atención al titular.
        </p>
      </>
    ),
  },
  {
    id: "datos-recopilados",
    number: "2",
    title: "Qué datos personales recopilamos",
    content: (
      <>
        <p>
          Recopilamos únicamente los datos personales necesarios para prestarte nuestros servicios.
          Según la interacción, estos pueden incluir:
        </p>
        <ul>
          <li>Nombres y apellidos.</li>
          <li>Número de documento de identidad (DNI o carné de extranjería).</li>
          <li>Dirección de domicilio o de entrega.</li>
          <li>Número de teléfono y correo electrónico.</li>
          <li>Datos de tus pedidos: productos solicitados, montos y comprobante.</li>
          <li>
            Datos de pago necesarios para procesar la transacción (gestionados a través de pasarelas
            seguras; no almacenamos los datos completos de tu tarjeta).
          </li>
        </ul>
        <p>Recopilamos estos datos cuando, por ejemplo:</p>
        <ul>
          <li>Creas una cuenta o te registras en el sitio.</li>
          <li>Realizas una compra o solicitas un delivery.</li>
          <li>Subes una receta médica para la atención de un producto que la requiere.</li>
          <li>Te comunicas con nosotros por nuestros canales de atención.</li>
        </ul>
      </>
    ),
  },
  {
    id: "finalidad",
    number: "3",
    title: "Finalidad del tratamiento",
    content: (
      <>
        <p>Tratamos tus datos personales con las siguientes finalidades:</p>
        <ul>
          <li>Procesar, gestionar y dar seguimiento a tus pedidos.</li>
          <li>Coordinar la entrega a domicilio (delivery) o el retiro en tienda.</li>
          <li>Emitir los comprobantes de pago correspondientes (boleta o factura).</li>
          <li>Brindarte atención al cliente y responder tus consultas o reclamos.</li>
          <li>
            Enviarte comunicaciones relacionadas con tu pedido (confirmaciones, estado de entrega y
            avisos del servicio).
          </li>
          <li>
            Cumplir con las obligaciones legales y tributarias que correspondan a la actividad
            farmacéutica.
          </li>
        </ul>
        <p>
          No utilizaremos tus datos para finalidades distintas a las aquí declaradas sin obtener
          previamente tu consentimiento.
        </p>
      </>
    ),
  },
  {
    id: "consentimiento",
    number: "4",
    title: "Consentimiento",
    content: (
      <>
        <p>
          El tratamiento de tus datos personales se realiza con tu consentimiento previo, informado,
          expreso e inequívoco, que otorgas al registrarte, realizar una compra o aceptar la presente
          política durante el proceso correspondiente.
        </p>
        <p>
          Puedes <strong>retirar tu consentimiento</strong> en cualquier momento, sin efecto
          retroactivo, escribiéndonos a {PROVEEDOR.email_datos}. El retiro del consentimiento podría
          impedirnos continuar prestándote determinados servicios que dependen de dichos datos (por
          ejemplo, procesar nuevos pedidos).
        </p>
      </>
    ),
  },
  {
    id: "comparticion",
    number: "5",
    title: "Con quién compartimos tus datos",
    content: (
      <>
        <p>
          Para cumplir con las finalidades descritas, podemos compartir determinados datos con terceros
          que actúan como encargados del tratamiento, exclusivamente en lo necesario:
        </p>
        <ul>
          <li>
            <strong>Empresas de mensajería y courier</strong> de delivery, para coordinar y ejecutar la
            entrega de tus pedidos.
          </li>
          <li>
            <strong>Pasarelas de pago</strong> (por ejemplo, MercadoPago) y entidades financieras, para
            procesar de forma segura los pagos en línea.
          </li>
          <li>
            <strong>Autoridades competentes</strong>, cuando exista una obligación legal o un
            requerimiento válido que así lo exija.
          </li>
        </ul>
        <p>
          <strong>No vendemos, alquilamos ni cedemos tus datos personales</strong> a terceros con fines
          comerciales ajenos a la prestación del servicio.
        </p>
      </>
    ),
  },
  {
    id: "conservacion",
    number: "6",
    title: "Plazo de conservación y medidas de seguridad",
    content: (
      <>
        <p>
          Conservamos tus datos personales durante el tiempo necesario para cumplir las finalidades para
          las que fueron recopilados y, posteriormente, durante los plazos exigidos por la normativa
          tributaria, sanitaria y de protección al consumidor aplicable. Una vez cumplidos dichos plazos,
          los datos se eliminan o anonimizan de forma segura.
        </p>
        <p>
          Aplicamos medidas técnicas, organizativas y legales razonables para proteger tus datos frente a
          accesos no autorizados, pérdida, alteración o divulgación indebida, conforme a lo establecido en
          la Ley N° 29733 y su Reglamento.
        </p>
      </>
    ),
  },
  {
    id: "derechos-arco",
    number: "7",
    title: "Tus derechos (ARCO)",
    content: (
      <>
        <p>Como titular de los datos, la Ley N° 29733 te reconoce los siguientes derechos:</p>
        <ul>
          <li>
            <strong>Acceso:</strong> conocer qué datos tuyos tratamos y con qué finalidad.
          </li>
          <li>
            <strong>Rectificación:</strong> corregir tus datos cuando sean inexactos o estén
            incompletos.
          </li>
          <li>
            <strong>Cancelación:</strong> solicitar la supresión de tus datos cuando ya no sean
            necesarios o retires tu consentimiento.
          </li>
          <li>
            <strong>Oposición:</strong> oponerte al tratamiento de tus datos por motivos legítimos.
          </li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, envía tu solicitud al correo{" "}
          <strong>{PROVEEDOR.email_datos}</strong>, indicando tu nombre completo, número de documento y el
          derecho que deseas ejercer. Atenderemos tu solicitud en los plazos establecidos por la normativa
          vigente.
        </p>
      </>
    ),
  },
  {
    id: "autoridad",
    number: "8",
    title: "Banco de datos y autoridad competente",
    content: (
      <>
        <p>
          Los datos personales recopilados se almacenan en los bancos de datos de titularidad de{" "}
          {PROVEEDOR.razon_social}, gestionados conforme a la normativa de protección de datos personales.
        </p>
        <p>
          Si consideras que el tratamiento de tus datos no se ajusta a la ley, tienes derecho a presentar
          un reclamo ante la <strong>Autoridad Nacional de Protección de Datos Personales (ANPDP)</strong>,
          dependiente del Ministerio de Justicia y Derechos Humanos, sin perjuicio de comunicarte
          previamente con nosotros para intentar resolver tu solicitud.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    number: "9",
    title: "Uso de cookies",
    content: (
      <>
        <p>
          Este sitio web utiliza cookies y tecnologías similares para su correcto funcionamiento, recordar
          tus preferencias (como el contenido de tu carrito o el tema claro/oscuro) y mejorar tu experiencia
          de navegación.
        </p>
        <p>
          Puedes configurar tu navegador para bloquear o eliminar las cookies. Ten en cuenta que
          deshabilitarlas podría afectar el funcionamiento de algunas secciones del sitio.
        </p>
      </>
    ),
  },
];

export function Privacidad() {
  return (
    <LegalPage
      icon={ShieldCheck}
      title="Política de Privacidad"
      legalBasis={
        <>
          Conforme a la Ley N° 29733, Ley de Protección de Datos Personales, y su Reglamento
          (D.S. 016-2024-JUS).
        </>
      }
      sections={SECTIONS}
    />
  );
}
