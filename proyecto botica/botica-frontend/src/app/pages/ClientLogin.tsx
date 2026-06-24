import { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { ApiError } from "../lib/api";
import { useGoogleAuth } from "../lib/useGoogleAuth";
import { AuthLayout, AuthField, AuthSubmit } from "../components/AuthLayout";

export function ClientLogin() {
  const { loginCustomer, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Recibe el access_token del popup de Google y lo canjea en el backend.
  const handleGoogleToken = async (accessToken: string) => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle(accessToken, remember);
      toast.success("¡Bienvenido!");
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo iniciar sesión con Google."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const {
    configured: googleConfigured,
    signIn: googleSignIn,
    error: googleError,
  } = useGoogleAuth(handleGoogleToken);

  // Refleja errores del popup de Google (popup cerrado, etc.) en el formulario.
  useEffect(() => {
    if (googleError) {
      setError(googleError);
      setGoogleLoading(false);
    }
  }, [googleError]);

  const handleGoogleClick = () => {
    if (!googleConfigured) {
      toast.info("Inicio con Google no configurado todavía.");
      return;
    }
    setError(null);
    googleSignIn();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    try {
      await loginCustomer(email.trim().toLowerCase(), password, remember);
      toast.success("¡Bienvenido!");
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Email o contraseña incorrectos.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Error al iniciar sesión.");
      }
    }
  };

  const busy = isLoading || googleLoading;

  return (
    <AuthLayout
      tone="client"
      embedded
      brandLine={
        <>
          Tu bienestar,
          <br />
          más cerca y seguro.
        </>
      }
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de Boticas Central"
      footer={
        <p className="text-center text-sm" style={{ color: "var(--c-muted)" }}>
          ¿No tienes cuenta?{" "}
          <Link
            to="/registro"
            className="font-semibold hover:underline"
            style={{ color: "var(--c-brand)" }}
          >
            Regístrate aquí
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <AuthField label="Email" htmlFor="email">
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
              className="w-full pl-11 pr-4 h-11 rounded-xl border text-[15px] transition-all outline-none focus:ring-2"
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
        </AuthField>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: "var(--c-text)" }}
            >
              Contraseña
            </label>
            <Link
              to="/recuperar-password"
              className="text-sm font-medium hover:underline transition-colors"
              style={{ color: "var(--c-brand)" }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
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
              placeholder="••••••••"
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
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--c-faint)" }}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Recordarme */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-orange-500"
          />
          <span className="text-sm" style={{ color: "var(--c-muted)" }}>
            Recordarme en este dispositivo
          </span>
        </label>

        {/* Error */}
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

        {/* Botón principal */}
        <AuthSubmit disabled={busy} loading={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </AuthSubmit>

        {/* Divisor "o continuar con" */}
        <div className="relative flex items-center my-2">
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--c-line)" }} />
          <span
            className="px-4 text-xs font-medium uppercase tracking-wide"
            style={{ color: "var(--c-faint)" }}
          >
            o continuar con
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "var(--c-line)" }} />
        </div>

        {/* Botón Google */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={busy}
          className="w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 border disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--c-surface)",
            borderColor: "var(--c-line)",
            color: "var(--c-text)",
          }}
          onMouseEnter={(e) => {
            if (busy) return;
            e.currentTarget.style.borderColor = "var(--c-brand)";
            e.currentTarget.style.backgroundColor = "var(--c-bg-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--c-line)";
            e.currentTarget.style.backgroundColor = "var(--c-surface)";
          }}
        >
          {googleLoading ? (
            <span
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{
                borderColor: "var(--c-line)",
                borderTopColor: "var(--c-brand)",
              }}
            />
          ) : (
            /* Logo oficial Google */
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>{googleLoading ? "Conectando con Google..." : "Continuar con Google"}</span>
        </button>
      </form>
    </AuthLayout>
  );
}
