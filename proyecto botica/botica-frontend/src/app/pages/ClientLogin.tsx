import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  HeartPulse,
} from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { ApiError } from "../lib/api";
import login_hero from "@/imports/login_hero.jpg";

export function ClientLogin() {
  const { loginCustomer, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    try {
      await loginCustomer(email.trim().toLowerCase(), password);
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

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: "var(--c-bg)" }}
    >
      {/* ===== LADO IZQUIERDO — Foto con overlay ===== */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-[55%] overflow-hidden">
        <img
          src={login_hero}
          alt="Atención farmacéutica profesional"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay con tinte naranja sutil para integrar con marca */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(241,90,41,0.45) 0%, rgba(26,31,46,0.65) 50%, rgba(26,31,46,0.85) 100%)",
          }}
        />
        {/* Patrón decorativo sutil */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%)",
          }}
        />

        {/* Contenido sobre la foto */}
        <div className="relative z-10 flex flex-col justify-between p-10 lg:p-14 w-full text-white">
          {/* Header — Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
            >
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <div
                className="text-lg font-bold leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Boticas Central
              </div>
              <div className="text-xs opacity-80">Salud y bienestar</div>
            </div>
          </div>

          {/* Mensaje central */}
          <div className="max-w-md">
            <h1
              className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Tu salud,
              <br />
              <span style={{ color: "#FDBA74" }}>a un clic de distancia</span>
            </h1>
            <p className="text-base lg:text-lg leading-relaxed opacity-90">
              Accede a tu cuenta y disfruta de medicamentos certificados,
              atención profesional y delivery rápido a tu puerta.
            </p>
          </div>

          {/* Footer — Sellos de confianza */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2 opacity-90">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#34D399" }}
              />
              Certificado DIGEMID
            </div>
            <div className="flex items-center gap-2 opacity-90">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "#FDBA74" }}
              />
              Delivery en 24–48 h
            </div>
          </div>
        </div>
      </div>

      {/* ===== LADO DERECHO — Form ===== */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative">
        {/* Botón "volver al inicio" arriba a la izquierda */}
        <Link
          to="/"
          className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: "var(--c-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div
          className="w-full max-w-md animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Header del form */}
          <div className="mb-8">
            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{
                color: "var(--c-text)",
                fontFamily: "var(--font-display)",
              }}
            >
              Iniciar sesión
            </h2>
            <p style={{ color: "var(--c-muted)" }}>
              Accede a tu cuenta de Boticas Central
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
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
                  className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm transition-all outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--c-surface)",
                    borderColor: "var(--c-line)",
                    color: "var(--c-text)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--c-brand)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(241,90,41,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--c-line)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold"
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
                  className="w-full pl-11 pr-12 py-3 rounded-xl border text-sm transition-all outline-none"
                  style={{
                    backgroundColor: "var(--c-surface)",
                    borderColor: "var(--c-line)",
                    color: "var(--c-text)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--c-brand)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(241,90,41,0.1)";
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
              <span
                className="text-sm"
                style={{ color: "var(--c-muted)" }}
              >
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
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--c-brand)" }}
              onMouseEnter={(e) => {
                if (!isLoading)
                  e.currentTarget.style.backgroundColor =
                    "var(--c-brand-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isLoading)
                  e.currentTarget.style.backgroundColor = "var(--c-brand)";
              }}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

            {/* Divisor "o continuar con" */}
            <div className="relative flex items-center my-2">
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: "var(--c-line)" }}
              />
              <span
                className="px-4 text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--c-faint)" }}
              >
                o continuar con
              </span>
              <div
                className="flex-1 h-px"
                style={{ backgroundColor: "var(--c-line)" }}
              />
            </div>

            {/* Botón Google */}
            <button
              type="button"
              onClick={() => toast.info("Login con Google próximamente")}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 border"
              style={{
                backgroundColor: "var(--c-surface)",
                borderColor: "var(--c-line)",
                color: "var(--c-text)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--c-brand)";
                e.currentTarget.style.backgroundColor = "var(--c-bg-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--c-line)";
                e.currentTarget.style.backgroundColor = "var(--c-surface)";
              }}
            >
              {/* Logo oficial Google */}
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
              <span>Continuar con Google</span>
            </button>
          </form>

          {/* Footer */}
          <p
            className="text-center text-sm mt-8"
            style={{ color: "var(--c-muted)" }}
          >
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="font-semibold hover:underline"
              style={{ color: "var(--c-brand)" }}
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}