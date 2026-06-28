// ============================================================
// Datos del responsable / proveedor — usados por las páginas legales
// (Política de Privacidad y Términos y Condiciones).
// ============================================================
// Fuente única de verdad para razón social, RUC y canales de contacto.
// ⚠️ Revisar los campos marcados como placeholder antes de producción.
// ============================================================

export const PROVEEDOR = {
  razon_social: "BOTICAS CENTRAL MOREL S.A.C.",
  ruc: "20614687259",
  // ⚠️ CONFIRMAR el domicilio fiscal/legal exacto de la sede principal.
  domicilio: "Av. Nicolás Ayllón 1245, Ate — Lima, Perú",
  // Canal general de contacto (ya publicado en el footer del sitio).
  email_contacto: "contacto@boticascentral.com",
  // ⚠️ PLACEHOLDER — definir el correo del canal de datos personales / ARCO.
  email_datos: "{correo de contacto para datos personales}",
  // ⚠️ PLACEHOLDER — definir el teléfono de atención al titular.
  telefono: "{teléfono de contacto}",
} as const;

// Fecha de "última actualización" mostrada en el encabezado de cada
// documento. Texto fijo para no depender de la fecha del navegador.
export const LEGAL_LAST_UPDATED = "28 de junio de 2026";
