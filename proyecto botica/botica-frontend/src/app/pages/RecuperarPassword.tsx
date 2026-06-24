// ============================================================
// RecuperarPassword — Pantalla A del flujo "¿Olvidaste tu contraseña?"
// ============================================================
// Pide el email y solicita el enlace de reseteo. Por seguridad el
// backend responde SIEMPRE genérico (no revela si el email existe).
// En desarrollo, si no hay SMTP configurado, el backend devuelve
// dev_link y aquí lo mostramos para poder probar local.
// ============================================================

import { useState, FormEvent } from "react";
import { Link } from "react-router";
import { AlertCircle, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { AuthLayout, AuthSubmit } from "../components/AuthLayout";

export function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Ingresa tu email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Ingresa un email válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email.trim().toLowerCase());
      setDevLink(res.dev_link ?? null);
      setSent(true);
    } catch (err) {
      // Aún ante error, el backend tiende a responder genérico. Solo
      // mostramos error si fue un fallo real (red / 500).
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
      tone="client"
      embedded
      brandLine={
        <>
          Recupera el acceso
          <br />
          a tu cuenta.
        </>
      }
      title={sent ? "Revisa tu correo" : "Recuperar contraseña"}
      subtitle={
        sent
          ? undefined
          : "Ingresa tu email y te enviaremos un enlace para restablecerla."
      }
      footer={
        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: "var(--c-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>
      }
    >
      {sent ? (
        // ===== Estado de confirmación (genérico por seguridad) =====
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--c-success-soft, rgba(22,163,74,0.12))" }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: "var(--c-success, #16A34A)" }} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--c-text)" }}>
              Si el correo está registrado, te enviamos un enlace para
              restablecer tu contraseña.
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
            }}
            className="w-full text-center text-sm font-medium hover:underline"
            style={{ color: "var(--c-brand)" }}
          >
            Usar otro correo
          </button>
        </div>
      ) : (
        // ===== Formulario de email =====
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--c-text)" }}
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--c-faint)" }}
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus
                className="w-full pl-11 pr-4 h-11 rounded-xl border text-[15px] transition-all outline-none"
                style={{
                  backgroundColor: "var(--c-surface)",
                  borderColor: "var(--c-line)",
                  color: "var(--c-text)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--c-brand)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(241,90,41,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--c-line)";
                  e.currentTarget.style.boxShadow = "none";
                }}
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
