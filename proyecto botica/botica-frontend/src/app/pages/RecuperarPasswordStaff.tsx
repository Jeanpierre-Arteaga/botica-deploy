// ============================================================
// RecuperarPasswordStaff — "¿Olvidaste tu contraseña?" del PERSONAL/ADMIN
// ============================================================
// Equivalente a RecuperarPassword (cliente) pero para la tabla `users`. El
// personal se identifica con su CÓDIGO de usuario (TRAB01) o con su CORREO. El
// backend responde SIEMPRE genérico (no revela si la cuenta existe) y envía el
// enlace al correo del usuario. En desarrollo sin SMTP devuelve dev_link.
// El enlace lleva a /reset-password (pantalla compartida con el cliente).
// ============================================================

import { useState, FormEvent } from "react";
import { Link } from "react-router";
import { AlertCircle, User, CheckCircle2, ArrowLeft } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { AuthLayout, AuthSubmit, authInputClass } from "../components/AuthLayout";

interface RecuperarPasswordStaffProps {
  /** Tono y destino del "volver": staff (default) o admin. */
  tone?: "staff" | "admin";
  backTo?: string;
}

export function RecuperarPasswordStaff({
  tone = "staff",
  backTo = "/staff",
}: RecuperarPasswordStaffProps) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [emailMasked, setEmailMasked] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = identifier.trim();
    if (!value) {
      setError("Ingresa tu código de usuario o tu correo.");
      return;
    }

    setLoading(true);
    try {
      // Si parece correo, se manda tal cual; si no, se normaliza el código.
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const res = await api.auth.staffForgotPassword(
        isEmail ? value.toLowerCase() : value.toUpperCase()
      );
      setDevLink(res.dev_link ?? null);
      setEmailMasked(res.email_masked ?? null);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo procesar la solicitud. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      tone={tone}
      brandLine={
        <>
          Recupera el acceso
          <br />
          a tu panel.
        </>
      }
      title={sent ? "Revisa tu correo" : "Recuperar contraseña"}
      subtitle={
        sent
          ? undefined
          : "Ingresa tu código de usuario o tu correo y te enviaremos un enlace para restablecerla."
      }
      footer={
        <Link
          to={backTo}
          className="flex items-center justify-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: "var(--c-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        // ===== Confirmación genérica (no revela si la cuenta existe) =====
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--c-success-soft, rgba(22,163,74,0.12))" }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: "var(--c-success, #16A34A)" }} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--c-text)" }}>
              Si la cuenta existe, te enviamos un enlace para restablecer tu
              contraseña{emailMasked ? <> a <span className="font-semibold">{emailMasked}</span></> : null}.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--c-muted)" }}>
              Revisa también tu carpeta de spam. El enlace caduca en 1 hora.
            </p>
          </div>

          {/* Ayuda de desarrollo: enlace directo cuando no hay SMTP */}
          {devLink && (
            <div
              className="rounded-xl border p-3 text-xs"
              style={{
                backgroundColor: "var(--c-bg-2)",
                borderColor: "var(--c-line)",
                color: "var(--c-muted)",
              }}
            >
              <p className="mb-1 font-semibold" style={{ color: "var(--c-text)" }}>
                Modo desarrollo (sin correo configurado)
              </p>
              <a
                href={devLink}
                className="break-all font-medium hover:underline"
                style={{ color: "var(--c-brand)" }}
              >
                {devLink}
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setDevLink(null);
              setEmailMasked(null);
            }}
            className="w-full text-center text-sm font-medium hover:underline"
            style={{ color: "var(--c-brand)" }}
          >
            Probar con otro dato
          </button>
        </div>
      ) : (
        // ===== Formulario de identificación =====
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--c-text)" }}
            >
              Código de usuario o correo
            </label>
            <div className="relative">
              <User
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--c-faint)" }}
              />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="TRAB01 o tu@correo.com"
                autoFocus
                className={`${authInputClass} pl-11`}
              />
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-2.5 rounded-xl border p-3 text-sm"
              style={{
                backgroundColor: "var(--c-error-soft)",
                borderColor: "var(--c-error)",
                color: "var(--c-error)",
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <AuthSubmit disabled={loading} loading={loading}>
            {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
          </AuthSubmit>
        </form>
      )}
    </AuthLayout>
  );
}
