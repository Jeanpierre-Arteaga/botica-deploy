// ============================================================
// ResetPassword — Pantalla B del flujo "¿Olvidaste tu contraseña?"
// ============================================================
// Lee ?token=XXX, lo valida contra el backend y según el resultado
// muestra: validando / token inválido / formulario nueva contraseña
// / éxito. Al guardar, el backend actualiza el password (bcrypt) e
// invalida el token; redirigimos al login.
// ============================================================

import { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { AuthLayout, AuthSubmit } from "../components/AuthLayout";

type Status = "validating" | "invalid" | "form" | "success";
type Audience = "customer" | "staff" | "admin";

// A dónde volver según el dueño del token (cliente, personal o admin).
const LOGIN_PATHS: Record<Audience, string> = {
  customer: "/login",
  staff: "/staff",
  admin: "/admin",
};
const RECOVER_PATHS: Record<Audience, string> = {
  customer: "/recuperar-password",
  staff: "/staff/recuperar-password",
  admin: "/admin/recuperar-password",
};

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<Status>("validating");
  const [audience, setAudience] = useState<Audience>("customer");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginPath = LOGIN_PATHS[audience];
  const recoverPath = RECOVER_PATHS[audience];

  // Valida el token al montar.
  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setStatus("invalid");
      return;
    }
    api.auth
      .validateResetToken(token)
      .then((res) => {
        if (cancelled) return;
        if (res.audience) setAudience(res.audience);
        setStatus(res.valid ? "form" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setStatus("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    try {
      await api.auth.resetPassword(token, password);
      setStatus("success");
      toast.success("Contraseña actualizada.");
      // Redirige al login correspondiente (cliente / personal / admin).
      setTimeout(() => navigate(loginPath, { replace: true }), 2200);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        // Token expiró/usado entre la validación y el submit.
        setStatus("invalid");
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "No se pudo actualizar la contraseña. Intenta de nuevo."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Pantallas de estado =====
  const brandLine = (
    <>
      Crea una contraseña
      <br />
      nueva y segura.
    </>
  );

  if (status === "validating") {
    return (
      <AuthLayout tone="client" embedded brandLine={brandLine} title="Verificando enlace">
        <div className="flex flex-col items-center py-6 text-center">
          <span
            className="h-9 w-9 animate-spin rounded-full border-2"
            style={{ borderColor: "var(--c-line)", borderTopColor: "var(--c-brand)" }}
          />
          <p className="mt-4 text-sm" style={{ color: "var(--c-muted)" }}>
            Validando tu enlace de recuperación...
          </p>
        </div>
      </AuthLayout>
    );
  }

  if (status === "invalid") {
    return (
      <AuthLayout
        tone="client"
        embedded
        brandLine={brandLine}
        title="Enlace no válido"
        subtitle="El enlace ha expirado o ya fue utilizado."
        footer={
          <Link
            to={loginPath}
            className="flex items-center justify-center gap-1.5 text-sm font-medium hover:underline"
            style={{ color: "var(--c-muted)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </Link>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--c-error-soft)" }}
            >
              <XCircle className="h-7 w-7" style={{ color: "var(--c-error)" }} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--c-text)" }}>
              Este enlace de recuperación no es válido o ya expiró.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--c-muted)" }}>
              Solicita uno nuevo para continuar.
            </p>
          </div>
          <Link to={recoverPath} className="block">
            <span
              className="flex w-full h-11 items-center justify-center rounded-xl font-semibold text-white text-[15px] shadow-md transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: "var(--c-brand)" }}
            >
              Solicitar un nuevo enlace
            </span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout tone="client" embedded brandLine={brandLine} title="¡Contraseña actualizada!">
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--c-success-soft, rgba(22,163,74,0.12))" }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: "var(--c-success, #16A34A)" }} />
            </div>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--c-text)" }}>
              Tu contraseña se actualizó correctamente.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--c-muted)" }}>
              Te llevamos al inicio de sesión...
            </p>
          </div>
          <Link to={loginPath} className="block">
            <span
              className="flex w-full h-11 items-center justify-center rounded-xl font-semibold text-white text-[15px] shadow-md transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: "var(--c-brand)" }}
            >
              Ir a iniciar sesión
            </span>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ===== status === "form" =====
  return (
    <AuthLayout
      tone="client"
      embedded
      brandLine={brandLine}
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta."
      footer={
        <Link
          to={loginPath}
          className="flex items-center justify-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: "var(--c-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nueva contraseña */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--c-text)" }}
          >
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "var(--c-faint)" }}
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoFocus
              className="w-full pl-11 pr-12 h-11 rounded-xl border text-[15px] transition-all outline-none"
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
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--c-faint)" }}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div>
          <label
            htmlFor="confirm"
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--c-text)" }}
          >
            Confirmar contraseña
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: "var(--c-faint)" }}
            />
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
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

        <AuthSubmit disabled={submitting} loading={submitting}>
          {submitting ? "Guardando..." : "Guardar contraseña"}
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
