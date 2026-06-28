// ============================================================
// LibroReclamaciones — Libro de Reclamaciones Virtual
// ============================================================
// Conforme a la Ley N° 29571 (Código de Protección y Defensa del
// Consumidor) y su Reglamento DS 011-2011-PCM (Anexo I).
//
// Captura los campos obligatorios del Anexo I, genera un código
// único correlativo (HRP-AAAA-NNNNN) y muestra una constancia
// imprimible. El envío al backend está PREPARADO pero deshabilitado:
// no existe endpoint todavía (ver `persistComplaint` y el SQL
// sugerido en la entrega). Por ahora la constancia vive en frontend.
// ============================================================

import { useState, useMemo, FormEvent } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  ArrowLeft,
  Building2,
  User,
  Package,
  MessageSquareWarning,
  ShieldCheck,
  CheckCircle2,
  Printer,
  Mail,
  Clock,
  Info,
  FileText,
} from "lucide-react";
import { Container } from "../components/Container";

// ── Datos FIJOS del proveedor (Anexo I, sección 1) ──────────────────
// ⚠️ Confirmar la dirección legal exacta de la sede principal.
const PROVEEDOR = {
  razon_social: "BOTICAS CENTRAL MOREL S.A.C.",
  ruc: "20614687259",
  direccion: "Av. Nicolás Ayllón 1245, Ate — Lima, Perú",
} as const;

// Prefijo del código correlativo: Hoja de Reclamación del Proveedor.
const CODE_PREFIX = "HRP";

type DocType = "DNI" | "CE";
type GoodType = "producto" | "servicio";
type ClaimKind = "reclamo" | "queja";

interface FormState {
  // Consumidor
  full_name: string;
  doc_type: DocType;
  doc_number: string;
  address: string;
  phone: string;
  email: string;
  is_minor: boolean;
  // Apoderado (condicional, si es menor de edad)
  guardian_name: string;
  guardian_doc_type: DocType;
  guardian_doc_number: string;
  // Bien contratado
  good_type: GoodType;
  claimed_amount: string;
  good_description: string;
  // Detalle
  kind: ClaimKind;
  detail: string;
  request: string;
  // Conformidad (mecanismo que reemplaza la firma)
  accepted: boolean;
}

const INITIAL_FORM: FormState = {
  full_name: "",
  doc_type: "DNI",
  doc_number: "",
  address: "",
  phone: "",
  email: "",
  is_minor: false,
  guardian_name: "",
  guardian_doc_type: "DNI",
  guardian_doc_number: "",
  good_type: "producto",
  claimed_amount: "",
  good_description: "",
  kind: "reclamo",
  detail: "",
  request: "",
  accepted: false,
};

interface Constancia {
  code: string;
  created_at: Date;
  data: FormState;
}

// ── Generación del código correlativo ───────────────────────────────
// El correlativo REAL debe vivir en el backend (secuencia atómica por
// año). Aquí usamos un contador en localStorage solo para demostrar el
// formato HRP-AAAA-NNNNN mientras no exista el endpoint.
function nextCode(): string {
  const year = new Date().getFullYear();
  const key = `hrp_seq_${year}`;
  let n = 1;
  try {
    n = parseInt(localStorage.getItem(key) || "0", 10) + 1;
    localStorage.setItem(key, String(n));
  } catch {
    // Si localStorage no está disponible, partimos de 1.
  }
  return `${CODE_PREFIX}-${year}-${String(n).padStart(5, "0")}`;
}

// ── Envío al backend (PREPARADO, sin conexión todavía) ──────────────
// Cuando exista el endpoint, descomentar la llamada a `api`.
async function persistComplaint(_payload: Record<string, unknown>): Promise<void> {
  // TODO(backend): POST /api/complaints  → ver SQL sugerido en la entrega.
  // import { api } from "../lib/api";
  // return api.complaints.create(_payload);
  return Promise.resolve();
}

const DOC_RULES: Record<DocType, { re: RegExp; msg: string; maxLength: number }> = {
  DNI: { re: /^\d{8}$/, msg: "El DNI debe tener 8 dígitos.", maxLength: 8 },
  CE: { re: /^[a-zA-Z0-9]{8,12}$/, msg: "El carné de extranjería debe tener 8 a 12 caracteres.", maxLength: 12 },
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LibroReclamaciones() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [constancia, setConstancia] = useState<Constancia | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const { [key]: _omit, ...rest } = e;
      return rest;
    });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.full_name.trim()) e.full_name = "Ingresa el nombre completo del consumidor.";

    const docRule = DOC_RULES[form.doc_type];
    if (!form.doc_number.trim()) e.doc_number = "El número de documento es obligatorio.";
    else if (!docRule.re.test(form.doc_number.trim())) e.doc_number = docRule.msg;

    if (!form.address.trim()) e.address = "El domicilio es obligatorio.";

    if (!form.email.trim()) e.email = "El email es obligatorio para enviarte copia de la constancia.";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Ingresa un email válido (ej. nombre@dominio.com).";

    if (form.phone && !/^\d{9}$/.test(form.phone.trim()))
      e.phone = "El teléfono debe tener 9 dígitos.";

    if (form.is_minor) {
      if (!form.guardian_name.trim()) e.guardian_name = "Indica el nombre del padre, madre o apoderado.";
      const gRule = DOC_RULES[form.guardian_doc_type];
      if (!form.guardian_doc_number.trim()) e.guardian_doc_number = "El documento del apoderado es obligatorio.";
      else if (!gRule.re.test(form.guardian_doc_number.trim())) e.guardian_doc_number = gRule.msg;
    }

    if (form.claimed_amount && !/^\d+(\.\d{1,2})?$/.test(form.claimed_amount.trim()))
      e.claimed_amount = "Ingresa un monto válido (ej. 49.90).";

    if (!form.good_description.trim()) e.good_description = "Describe el producto o servicio contratado.";

    if (!form.detail.trim()) e.detail = `Describe el detalle del ${form.kind}.`;
    if (!form.request.trim()) e.request = "Indica tu pedido como consumidor.";

    if (!form.accepted) e.accepted = "Debes declarar la conformidad para enviar el reclamo.";

    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Lleva al usuario al primer error.
      const first = document.querySelector(`[data-field="${Object.keys(e)[0]}"]`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const code = nextCode();
    const created_at = new Date();
    try {
      await persistComplaint({
        complaint_code: code,
        ...form,
        claimed_amount: form.claimed_amount ? Number(form.claimed_amount) : null,
        created_at: created_at.toISOString(),
        provider_ruc: PROVEEDOR.ruc,
      });
      setConstancia({ code, created_at, data: form });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setConstancia(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (constancia) {
    return <ConstanciaView constancia={constancia} onReset={resetForm} />;
  }

  return (
    <div style={{ backgroundColor: "var(--c-bg)" }}>
      <Container className="py-10 md:py-16">
       <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors hover:opacity-80"
          style={{ color: "var(--c-brand)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        {/* Encabezado */}
        <header className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--c-brand-soft)" }}
          >
            <BookOpen className="w-7 h-7" style={{ color: "var(--c-brand)" }} />
          </div>
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              Libro de Reclamaciones Virtual
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--c-faint)" }}>
              Conforme a la Ley N° 29571 — Código de Protección y Defensa del Consumidor
            </p>
          </div>
        </header>

        {/* Aviso oficial del Libro de Reclamaciones */}
        <div
          className="rounded-2xl p-5 md:p-6 mb-6 border flex gap-4"
          style={{ backgroundColor: "var(--c-info-soft)", borderColor: "var(--c-line)" }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--c-info)" }} />
          <div>
            <h2 className="text-sm font-bold mb-1" style={{ color: "var(--c-text)" }}>
              Aviso del Libro de Reclamaciones
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Conforme al Código de Protección y Defensa del Consumidor, este establecimiento
              cuenta con un Libro de Reclamaciones a tu disposición. Completa todos los campos
              obligatorios. El proveedor dará respuesta a tu reclamo o queja en un{" "}
              <strong style={{ color: "var(--c-text)" }}>plazo máximo de 15 días hábiles</strong>,
              de acuerdo a ley.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* 1 · Datos del proveedor (solo lectura) */}
          <Section icon={Building2} title="1. Datos del proveedor" subtitle="Información precargada — solo lectura">
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnly label="Razón social" value={PROVEEDOR.razon_social} />
              <ReadOnly label="RUC" value={PROVEEDOR.ruc} />
              <div className="sm:col-span-2">
                <ReadOnly label="Dirección de la sede" value={PROVEEDOR.direccion} />
              </div>
            </div>
          </Section>

          {/* 2 · Identificación del consumidor */}
          <Section icon={User} title="2. Identificación del consumidor reclamante">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2" label="Nombre completo" required error={errors.full_name} name="full_name">
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Nombres y apellidos"
                  className={inputClass(!!errors.full_name)}
                  style={inputStyle(!!errors.full_name)}
                />
              </Field>

              <Field label="Tipo de documento" required name="doc_type">
                <select
                  value={form.doc_type}
                  onChange={(e) => set("doc_type", e.target.value as DocType)}
                  className={inputClass(false)}
                  style={inputStyle(false)}
                >
                  <option value="DNI">DNI</option>
                  <option value="CE">Carné de extranjería (CE)</option>
                </select>
              </Field>

              <Field label="N.° de documento" required error={errors.doc_number} name="doc_number">
                <input
                  type="text"
                  inputMode={form.doc_type === "DNI" ? "numeric" : "text"}
                  value={form.doc_number}
                  maxLength={DOC_RULES[form.doc_type].maxLength}
                  onChange={(e) =>
                    set(
                      "doc_number",
                      form.doc_type === "DNI" ? e.target.value.replace(/\D/g, "") : e.target.value
                    )
                  }
                  placeholder={form.doc_type === "DNI" ? "12345678" : "001234567"}
                  className={inputClass(!!errors.doc_number)}
                  style={inputStyle(!!errors.doc_number)}
                />
              </Field>

              <Field className="sm:col-span-2" label="Domicilio" required error={errors.address} name="address">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Av. / Jr. / Calle, número, distrito"
                  className={inputClass(!!errors.address)}
                  style={inputStyle(!!errors.address)}
                />
              </Field>

              <Field label="Teléfono" hint="(opcional)" error={errors.phone} name="phone">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.phone}
                  maxLength={9}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
                  placeholder="987654321"
                  className={inputClass(!!errors.phone)}
                  style={inputStyle(!!errors.phone)}
                />
              </Field>

              <Field label="Email" required error={errors.email} name="email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="tu@email.com"
                  className={inputClass(!!errors.email)}
                  style={inputStyle(!!errors.email)}
                />
              </Field>
            </div>

            {/* Menor de edad → apoderado */}
            <label
              className="mt-5 flex items-center gap-3 cursor-pointer select-none rounded-xl p-3 border transition-colors"
              style={{ borderColor: "var(--c-line)", backgroundColor: "var(--c-bg)" }}
            >
              <input
                type="checkbox"
                checked={form.is_minor}
                onChange={(e) => set("is_minor", e.target.checked)}
                className="w-4 h-4 rounded accent-[color:var(--c-brand)]"
                style={{ accentColor: "var(--c-brand)" }}
              />
              <span className="text-sm" style={{ color: "var(--c-text)" }}>
                El consumidor es <strong>menor de edad</strong> (registrar datos del padre, madre o apoderado)
              </span>
            </label>

            {form.is_minor && (
              <div className="grid gap-4 sm:grid-cols-2 mt-4 animate-fade-in-up">
                <Field className="sm:col-span-2" label="Nombre del padre / madre / apoderado" required error={errors.guardian_name} name="guardian_name">
                  <input
                    type="text"
                    value={form.guardian_name}
                    onChange={(e) => set("guardian_name", e.target.value)}
                    placeholder="Nombres y apellidos del apoderado"
                    className={inputClass(!!errors.guardian_name)}
                    style={inputStyle(!!errors.guardian_name)}
                  />
                </Field>
                <Field label="Tipo de documento (apoderado)" required name="guardian_doc_type">
                  <select
                    value={form.guardian_doc_type}
                    onChange={(e) => set("guardian_doc_type", e.target.value as DocType)}
                    className={inputClass(false)}
                    style={inputStyle(false)}
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">Carné de extranjería (CE)</option>
                  </select>
                </Field>
                <Field label="N.° de documento (apoderado)" required error={errors.guardian_doc_number} name="guardian_doc_number">
                  <input
                    type="text"
                    inputMode={form.guardian_doc_type === "DNI" ? "numeric" : "text"}
                    value={form.guardian_doc_number}
                    maxLength={DOC_RULES[form.guardian_doc_type].maxLength}
                    onChange={(e) =>
                      set(
                        "guardian_doc_number",
                        form.guardian_doc_type === "DNI" ? e.target.value.replace(/\D/g, "") : e.target.value
                      )
                    }
                    placeholder={form.guardian_doc_type === "DNI" ? "12345678" : "001234567"}
                    className={inputClass(!!errors.guardian_doc_number)}
                    style={inputStyle(!!errors.guardian_doc_number)}
                  />
                </Field>
              </div>
            )}
          </Section>

          {/* 3 · Identificación del bien contratado */}
          <Section icon={Package} title="3. Identificación del bien contratado">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo" required name="good_type">
                <div className="grid grid-cols-2 gap-3">
                  <ChoicePill
                    active={form.good_type === "producto"}
                    label="Producto"
                    onClick={() => set("good_type", "producto")}
                  />
                  <ChoicePill
                    active={form.good_type === "servicio"}
                    label="Servicio"
                    onClick={() => set("good_type", "servicio")}
                  />
                </div>
              </Field>

              <Field label="Monto reclamado" hint="(opcional)" error={errors.claimed_amount} name="claimed_amount">
                <div className="relative">
                  <span
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium"
                    style={{ color: "var(--c-faint)" }}
                  >
                    S/
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.claimed_amount}
                    onChange={(e) => set("claimed_amount", e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="0.00"
                    className={inputClass(!!errors.claimed_amount) + " pl-9"}
                    style={inputStyle(!!errors.claimed_amount)}
                  />
                </div>
              </Field>

              <Field
                className="sm:col-span-2"
                label="Descripción del producto / servicio"
                required
                error={errors.good_description}
                name="good_description"
              >
                <textarea
                  rows={3}
                  value={form.good_description}
                  onChange={(e) => set("good_description", e.target.value)}
                  placeholder="Ej. Paracetamol 500 mg caja x 100, comprado el 20/06/2026 en la sede de Ate."
                  className={textareaClass(!!errors.good_description)}
                  style={inputStyle(!!errors.good_description)}
                />
              </Field>
            </div>
          </Section>

          {/* 4 · Detalle del reclamo / queja */}
          <Section icon={MessageSquareWarning} title="4. Detalle de la reclamación">
            <div className="grid gap-3 sm:grid-cols-2 mb-5">
              <KindCard
                active={form.kind === "reclamo"}
                title="Reclamo"
                desc="Disconformidad relacionada al producto o servicio."
                onClick={() => set("kind", "reclamo")}
              />
              <KindCard
                active={form.kind === "queja"}
                title="Queja"
                desc="Malestar respecto a la atención al público o el proceso de venta."
                onClick={() => set("kind", "queja")}
              />
            </div>

            <div className="space-y-4">
              <Field label={`Detalle del ${form.kind}`} required error={errors.detail} name="detail">
                <textarea
                  rows={4}
                  value={form.detail}
                  onChange={(e) => set("detail", e.target.value)}
                  placeholder="Describe con el mayor detalle posible lo sucedido."
                  className={textareaClass(!!errors.detail)}
                  style={inputStyle(!!errors.detail)}
                />
              </Field>
              <Field label="Pedido del consumidor" required error={errors.request} name="request">
                <textarea
                  rows={3}
                  value={form.request}
                  onChange={(e) => set("request", e.target.value)}
                  placeholder="¿Qué solicitas? Ej. cambio del producto, devolución del monto, etc."
                  className={textareaClass(!!errors.request)}
                  style={inputStyle(!!errors.request)}
                />
              </Field>
            </div>
          </Section>

          {/* 5 · Conformidad (mecanismo que reemplaza la firma) */}
          <Section icon={ShieldCheck} title="5. Declaración de conformidad">
            <label
              className="flex items-start gap-3 cursor-pointer select-none rounded-xl p-4 border transition-colors"
              data-field="accepted"
              style={{
                borderColor: errors.accepted ? "var(--c-error)" : "var(--c-line)",
                backgroundColor: "var(--c-bg)",
              }}
            >
              <input
                type="checkbox"
                checked={form.accepted}
                onChange={(e) => set("accepted", e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded"
                style={{ accentColor: "var(--c-brand)" }}
              />
              <span className="text-sm leading-relaxed" style={{ color: "var(--c-text)" }}>
                Declaro que la información proporcionada es <strong>verídica</strong> y que los hechos
                descritos corresponden a la realidad. Acepto que esta declaración reemplaza mi firma
                en el Libro de Reclamaciones virtual.
              </span>
            </label>
            {errors.accepted && <ErrorText>{errors.accepted}</ErrorText>}

            <p className="mt-4 flex items-start gap-2 text-xs" style={{ color: "var(--c-faint)" }}>
              <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Al enviar, generaremos un código único de identificación y recibirás una constancia
              que podrás imprimir. El proveedor responderá en un plazo máximo de 15 días hábiles.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-60"
              style={{ backgroundColor: "var(--c-brand)" }}
            >
              <FileText className="w-5 h-5" />
              {submitting ? "Registrando..." : "Enviar y generar constancia"}
            </button>
          </Section>
        </form>

        <p className="mt-8 text-xs text-center" style={{ color: "var(--c-faint)" }}>
          {PROVEEDOR.razon_social} — RUC {PROVEEDOR.ruc} · {PROVEEDOR.direccion}
        </p>
       </div>
      </Container>
    </div>
  );
}

// ============================================================
// Constancia (vista posterior al envío)
// ============================================================
function ConstanciaView({ constancia, onReset }: { constancia: Constancia; onReset: () => void }) {
  const { code, created_at, data } = constancia;
  const fecha = useMemo(
    () =>
      created_at.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [created_at]
  );

  return (
    <div style={{ backgroundColor: "var(--c-bg)" }}>
      {/* CSS de impresión: aísla la constancia y oculta el resto del chrome */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #constancia-print, #constancia-print * { visibility: visible !important; }
          #constancia-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <Container className="py-10 md:py-16">
       <div className="max-w-3xl mx-auto">
        {/* Banner de éxito */}
        <div className="text-center mb-8 no-print">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--c-success-soft)" }}
          >
            <CheckCircle2 className="w-9 h-9" style={{ color: "var(--c-success)" }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}>
            Reclamo registrado
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--c-muted)" }}>
            Guarda tu código de identificación. Enviaremos una copia de esta constancia a{" "}
            <strong style={{ color: "var(--c-text)" }}>{data.email}</strong>.
          </p>
        </div>

        {/* Constancia imprimible */}
        <div
          id="constancia-print"
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-line)", boxShadow: "var(--elev-card)" }}
        >
          {/* Cabecera de la constancia */}
          <div className="p-6 md:p-8 border-b" style={{ borderColor: "var(--c-line)" }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--c-brand-soft)" }}>
                  <BookOpen className="w-6 h-6" style={{ color: "var(--c-brand)" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
                    Constancia de {data.kind === "reclamo" ? "Reclamo" : "Queja"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--c-faint)" }}>
                    Libro de Reclamaciones Virtual — Ley N° 29571
                  </p>
                </div>
              </div>
              <div
                className="px-4 py-2 rounded-xl text-right"
                style={{ backgroundColor: "var(--c-brand-soft)" }}
              >
                <p className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: "var(--c-brand)" }}>
                  Código de identificación
                </p>
                <p className="text-lg font-bold tabular-nums" style={{ color: "var(--c-brand)", fontFamily: "var(--font-display)" }}>
                  {code}
                </p>
              </div>
            </div>
            <p className="text-xs mt-4 flex items-center gap-1.5" style={{ color: "var(--c-faint)" }}>
              <Clock className="w-3.5 h-3.5" />
              Fecha y hora de registro: <strong style={{ color: "var(--c-muted)" }}>{fecha}</strong>
            </p>
          </div>

          {/* Cuerpo: datos ingresados */}
          <div className="p-6 md:p-8 space-y-7">
            <ConstanciaBlock title="Proveedor">
              <Row label="Razón social" value={PROVEEDOR.razon_social} />
              <Row label="RUC" value={PROVEEDOR.ruc} />
              <Row label="Dirección" value={PROVEEDOR.direccion} />
            </ConstanciaBlock>

            <ConstanciaBlock title="Consumidor">
              <Row label="Nombre" value={data.full_name} />
              <Row label="Documento" value={`${data.doc_type} ${data.doc_number}`} />
              <Row label="Domicilio" value={data.address} />
              {data.phone && <Row label="Teléfono" value={data.phone} />}
              <Row label="Email" value={data.email} />
              {data.is_minor && (
                <>
                  <Row label="Apoderado" value={data.guardian_name} />
                  <Row label="Doc. apoderado" value={`${data.guardian_doc_type} ${data.guardian_doc_number}`} />
                </>
              )}
            </ConstanciaBlock>

            <ConstanciaBlock title="Bien contratado">
              <Row label="Tipo" value={data.good_type === "producto" ? "Producto" : "Servicio"} />
              {data.claimed_amount && <Row label="Monto reclamado" value={`S/ ${Number(data.claimed_amount).toFixed(2)}`} />}
              <Row label="Descripción" value={data.good_description} />
            </ConstanciaBlock>

            <ConstanciaBlock title={data.kind === "reclamo" ? "Reclamo" : "Queja"}>
              <Row label="Tipo" value={data.kind === "reclamo" ? "Reclamo" : "Queja"} />
              <Row label="Detalle" value={data.detail} />
              <Row label="Pedido del consumidor" value={data.request} />
            </ConstanciaBlock>

            <div
              className="rounded-xl p-4 text-xs flex items-start gap-2"
              style={{ backgroundColor: "var(--c-info-soft)", color: "var(--c-muted)" }}
            >
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--c-info)" }} />
              <span>
                El proveedor responderá este {data.kind} en un plazo máximo de{" "}
                <strong style={{ color: "var(--c-text)" }}>15 días hábiles</strong>. La presente
                constancia acredita el registro de su reclamación conforme a la Ley N° 29571.
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg"
            style={{ backgroundColor: "var(--c-brand)" }}
          >
            <Printer className="w-5 h-5" />
            Imprimir constancia
          </button>
          <div
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border"
            style={{ borderColor: "var(--c-line)", color: "var(--c-muted)", backgroundColor: "var(--c-surface)" }}
          >
            <Mail className="w-4 h-4" style={{ color: "var(--c-success)" }} />
            Se enviará copia a {data.email}
          </div>
          <button
            onClick={onReset}
            className="sm:ml-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border transition-colors"
            style={{ borderColor: "var(--c-line)", color: "var(--c-text)", backgroundColor: "var(--c-surface)" }}
          >
            Registrar otro reclamo
          </button>
        </div>

        <div className="text-center mt-8 no-print">
          <Link to="/" className="text-sm font-medium hover:opacity-80" style={{ color: "var(--c-brand)" }}>
            Volver al inicio
          </Link>
        </div>
       </div>
      </Container>
    </div>
  );
}

// ============================================================
// Subcomponentes de presentación
// ============================================================
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-6 md:p-7"
      style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-line)", boxShadow: "var(--elev-xs)" }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--c-brand-soft)" }}>
          <Icon className="w-5 h-5" style={{ color: "var(--c-brand)" }} />
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
          {subtitle && <p className="text-xs" style={{ color: "var(--c-faint)" }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  name,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  name: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className} data-field={name}>
      <label className="block mb-1.5 text-sm font-medium" style={{ color: "var(--c-text)" }}>
        {label}
        {required && <span style={{ color: "var(--c-brand)" }}> *</span>}
        {hint && <span className="font-normal ml-1" style={{ color: "var(--c-faint)" }}>{hint}</span>}
      </label>
      {children}
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-xs font-medium" style={{ color: "var(--c-error)" }}>
      {children}
    </p>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: "var(--c-faint)" }}>{label}</p>
      <div
        className="rounded-[10px] px-3.5 py-2.5 text-sm font-medium border"
        style={{ backgroundColor: "var(--c-bg)", borderColor: "var(--c-line)", color: "var(--c-text)" }}
      >
        {value}
      </div>
    </div>
  );
}

function ChoicePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-11 rounded-[10px] text-sm font-semibold border transition-all"
      style={{
        borderColor: active ? "var(--c-brand)" : "var(--c-line)",
        backgroundColor: active ? "var(--c-brand-soft)" : "var(--c-surface)",
        color: active ? "var(--c-brand)" : "var(--c-muted)",
      }}
    >
      {label}
    </button>
  );
}

function KindCard({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl p-4 border transition-all"
      style={{
        borderColor: active ? "var(--c-brand)" : "var(--c-line)",
        backgroundColor: active ? "var(--c-brand-soft)" : "var(--c-surface)",
        boxShadow: active ? "var(--elev-soft)" : "none",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
          style={{ borderColor: active ? "var(--c-brand)" : "var(--c-line)" }}
        >
          {active && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--c-brand)" }} />}
        </span>
        <span className="text-sm font-bold" style={{ color: active ? "var(--c-brand)" : "var(--c-text)" }}>
          {title}
        </span>
      </div>
      <p className="text-xs leading-relaxed pl-6" style={{ color: "var(--c-muted)" }}>
        {desc}
      </p>
    </button>
  );
}

function ConstanciaBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b"
        style={{ color: "var(--c-brand)", borderColor: "var(--c-line-2)" }}
      >
        {title}
      </h3>
      <dl className="space-y-2.5">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <dt className="font-medium" style={{ color: "var(--c-faint)" }}>{label}</dt>
      <dd className="col-span-2 break-words" style={{ color: "var(--c-text)" }}>{value}</dd>
    </div>
  );
}

// ── Estilos compartidos de inputs ───────────────────────────────────
function inputClass(error: boolean) {
  return `w-full h-11 rounded-[10px] px-3.5 text-sm border transition-colors outline-none ${
    error ? "" : ""
  }`;
}
function textareaClass(error: boolean) {
  return `w-full rounded-[10px] px-3.5 py-2.5 text-sm border transition-colors outline-none resize-y ${
    error ? "" : ""
  }`;
}
function inputStyle(error: boolean): React.CSSProperties {
  return {
    borderColor: error ? "var(--c-error)" : "var(--c-line)",
    backgroundColor: "var(--c-surface)",
    color: "var(--c-text)",
  };
}
