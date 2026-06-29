// ============================================================
// ProfileModal — Edición del PERFIL PROPIO (admin y staff)
// ============================================================
// Se abre desde el lápiz del sidebar. Permite al usuario logueado:
//  - editar nombre y email/acceso (user_code)
//  - cambiar su contraseña (opcional; el backend la hashea con bcrypt)
//  - subir una FOTO de rostro con vista previa (S3/CloudFront)
//  - DESACTIVAR su cuenta (con confirmación) → cierra sesión
// Todo pasa por api.ts y endpoints protegidos por token (/api/users/me*).
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  X, Camera, Trash2, KeyRound, AlertCircle, Loader2, ShieldOff, UserCog, Check,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO = 5 * 1024 * 1024; // 5 MB
const OK_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const LABEL = "block text-sm font-semibold mb-1.5 text-text";
const fieldCls = (err: boolean) =>
  `w-full px-4 py-2.5 bg-page border rounded-xl text-sm text-text focus:outline-none focus:ring-2 transition-colors ${err ? "border-error focus:ring-error/30 focus:border-error" : "border-line focus:ring-brand/30 focus:border-brand"}`;

function ErrText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 flex items-center gap-1 text-xs font-medium text-error"><AlertCircle className="w-3 h-3 shrink-0" /> {msg}</p>;
}

function initials(name?: string) {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U";
}

type FieldKey = "full_name" | "user_code" | "password" | "confirm";

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, applyUserPatch, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [userCode, setUserCode] = useState(user?.user_code ?? "");
  const [changePwd, setChangePwd] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Foto: archivo nuevo (preview local) o eliminar la actual.
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const busy = saving || deactivating;

  useEffect(() => {
    firstRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [busy, onClose]);

  // Revoca el object URL al desmontar / cambiar de archivo.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const touch = (k: FieldKey) => setTouched((t) => new Set(t).add(k));

  const codeUnchangedLegacy = userCode.trim() === (user?.user_code ?? "");

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!fullName.trim()) e.full_name = "El nombre completo es obligatorio.";
    if (!userCode.trim()) e.user_code = "El email/acceso es obligatorio.";
    else if (!codeUnchangedLegacy && !EMAIL_RE.test(userCode.trim())) e.user_code = "Ingresa un email válido (ej. nombre@boticas.pe).";
    if (changePwd) {
      if (password.length < 8) e.password = "Mínimo 8 caracteres.";
      else if (confirm !== password) e.confirm = "Las contraseñas no coinciden.";
    }
    return e;
  }, [fullName, userCode, codeUnchangedLegacy, changePwd, password, confirm]);

  const isValid = Object.keys(errors).length === 0;
  const showErr = (k: FieldKey) => ((submitAttempted || touched.has(k)) ? errors[k] : undefined);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // permite re-seleccionar el mismo archivo
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) { toast.error("Formato no permitido. Usa JPG, PNG o WEBP."); return; }
    if (f.size > MAX_PHOTO) { toast.error("La imagen supera el límite de 5 MB."); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setRemovePhoto(false);
  };

  const clearSelectedPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    // Si había foto guardada, marcar para quitarla; si no, no hace nada.
    setRemovePhoto(!!user?.photo_url);
  };

  // Imagen mostrada en el avatar grande del modal.
  const shownPhoto = previewUrl ?? (removePhoto ? null : user?.photo_url ?? null);

  const submit = async () => {
    setSubmitAttempted(true);
    if (busy || !isValid) return;
    setSaving(true);
    try {
      let photoChanged = false;
      let newPhotoUrl: string | null | undefined;

      if (file) {
        const { photo_url } = await api.users.uploadMyPhoto(file);
        newPhotoUrl = photo_url;
        photoChanged = true;
      } else if (removePhoto) {
        newPhotoUrl = null;
        photoChanged = true;
      }

      const updated = await api.users.updateMe({
        full_name: fullName.trim(),
        user_code: userCode.trim(),
        ...(changePwd && password ? { user_password: password } : {}),
        ...(photoChanged ? { photo_url: newPhotoUrl ?? null } : {}),
      });

      applyUserPatch({
        full_name: updated.full_name,
        user_code: updated.user_code,
        photo_url: updated.photo_url ?? null,
      });
      toast.success(changePwd && password ? "Perfil y contraseña actualizados." : "Perfil actualizado.");
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : "No se pudo guardar el perfil.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const doDeactivate = async () => {
    if (busy) return;
    setDeactivating(true);
    try {
      await api.users.deactivateMe();
      toast.success("Tu cuenta fue desactivada. Cerramos tu sesión.");
      const role = user?.role;
      logout();
      navigate(role === "admin" ? "/admin" : "/staff", { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : "No se pudo desactivar la cuenta.";
      toast.error(msg);
      setDeactivating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Editar mi perfil" className="bg-surface rounded-2xl shadow-pop border border-line w-full max-w-lg max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0"><UserCog className="w-5 h-5" /></span>
            <h2 className="text-lg font-bold text-text">Editar mi perfil</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="p-2 text-muted hover:bg-page rounded-lg transition-colors disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Foto de perfil */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {shownPhoto ? (
                <img src={shownPhoto} alt="Foto de perfil" className="w-20 h-20 rounded-full object-cover border border-line" />
              ) : (
                <span className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold">{initials(fullName)}</span>
              )}
              <button type="button" onClick={() => fileRef.current?.click()} aria-label="Subir foto" title="Subir foto" className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-soft hover:bg-brand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Foto de perfil</p>
              <p className="text-xs text-muted mt-0.5">JPG, PNG o WEBP · máx. 5 MB. Reemplaza el avatar de iniciales.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-page text-xs font-semibold text-text hover:border-brand hover:text-brand transition-colors">
                  <Camera className="w-3.5 h-3.5" /> {shownPhoto ? "Cambiar foto" : "Subir foto"}
                </button>
                {shownPhoto && (
                  <button type="button" onClick={clearSelectedPhoto} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-page text-xs font-semibold text-muted hover:border-error hover:text-error transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Quitar
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickFile} className="hidden" />
            </div>
          </div>

          {/* Datos */}
          <div>
            <label className={LABEL} htmlFor="pf-name">Nombre completo *</label>
            <input ref={firstRef} id="pf-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => touch("full_name")} className={fieldCls(!!showErr("full_name"))} placeholder="Ej: Ana Torres" />
            <ErrText msg={showErr("full_name")} />
          </div>
          <div>
            <label className={LABEL} htmlFor="pf-code">Email corporativo (acceso) *</label>
            <input id="pf-code" type="email" value={userCode} onChange={(e) => setUserCode(e.target.value)} onBlur={() => touch("user_code")} className={fieldCls(!!showErr("user_code"))} placeholder="usuario@boticascentral.pe" autoComplete="off" />
            {showErr("user_code") ? <ErrText msg={showErr("user_code")} /> : <p className="mt-1 text-xs text-muted">Con este correo inicias sesión.</p>}
          </div>

          {/* Contraseña */}
          <div>
            {!changePwd ? (
              <button type="button" onClick={() => setChangePwd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-page text-sm font-semibold text-text hover:border-brand hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <KeyRound className="w-4 h-4" /> Cambiar contraseña
              </button>
            ) : (
              <div className="rounded-xl border border-line bg-page p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text flex items-center gap-2"><KeyRound className="w-4 h-4 text-brand" /> Nueva contraseña</p>
                  <button type="button" onClick={() => { setChangePwd(false); setPassword(""); setConfirm(""); }} className="text-xs font-semibold text-muted hover:text-error transition-colors">Cancelar</button>
                </div>
                <div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch("password")} className={fieldCls(!!showErr("password"))} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                  <ErrText msg={showErr("password")} />
                </div>
                <div>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onBlur={() => touch("confirm")} className={fieldCls(!!showErr("confirm"))} placeholder="Repite la contraseña" autoComplete="new-password" />
                  <ErrText msg={showErr("confirm")} />
                </div>
              </div>
            )}
          </div>

          {/* Zona de peligro: desactivar cuenta — SOLO para personal (rol 'emp').
              El admin NO ve esta opción. */}
          {user?.role === "emp" && (
          <div className="rounded-xl border border-error/30 bg-error-soft/40 p-4">
            {!confirmOff ? (
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text flex items-center gap-2"><ShieldOff className="w-4 h-4 text-error" /> Desactivar mi cuenta</p>
                  <p className="text-xs text-muted mt-0.5">Perderás el acceso al panel y se cerrará tu sesión. Un administrador puede reactivarte.</p>
                </div>
                <button type="button" onClick={() => setConfirmOff(true)} disabled={busy} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-error/50 text-error text-xs font-bold hover:bg-error hover:text-white transition-colors disabled:opacity-50">
                  Desactivar
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-error flex items-center gap-2"><ShieldOff className="w-4 h-4" /> ¿Seguro que quieres desactivar tu cuenta?</p>
                <p className="text-xs text-muted mt-1">Esta acción cierra tu sesión de inmediato. No podrás volver a entrar hasta que un administrador te reactive.</p>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={doDeactivate} disabled={busy} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-error text-white text-xs font-bold hover:bg-[color-mix(in_srgb,var(--c-error)_88%,black)] transition-colors disabled:opacity-50">
                    {deactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {deactivating ? "Desactivando…" : "Sí, desactivar"}
                  </button>
                  <button type="button" onClick={() => setConfirmOff(false)} disabled={busy} className="px-4 py-2 rounded-lg border border-line bg-surface text-xs font-semibold text-muted hover:bg-page transition-colors disabled:opacity-50">Cancelar</button>
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <button type="button" onClick={submit} disabled={busy || !isValid} className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <button type="button" onClick={onClose} disabled={busy} className="flex-1 bg-page text-muted border border-line py-3 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
