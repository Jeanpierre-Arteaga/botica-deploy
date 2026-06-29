// ============================================================
// CustomerProfileModal — "Mi perfil" del CLIENTE (storefront)
// ============================================================
// Se abre desde el menú de usuario del navbar. Permite al cliente logueado:
//  - editar sus datos (nombre, email/acceso, teléfono, DNI, dirección)
//  - cambiar (o crear, si entró con Google) su contraseña con el patrón seguro
//    actual + nueva + repetir, con ojo ver/ocultar y validación en vivo
//  - elegir su avatar: subir una FOTO con vista previa (S3/CloudFront) O
//    seleccionar un AVATAR predefinido (no depende de S3)
//  - DESACTIVAR su cuenta (con confirmación) → cierra sesión
// Todo pasa por api.ts y endpoints protegidos por token (/api/customers/me*).
//
// Portal a document.body + z por encima del header sticky (z-1100) para no
// quedar medio tapado en el storefront (ver memoria customer-modal-zindex).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  X, Camera, Trash2, KeyRound, AlertCircle, Loader2, ShieldOff, UserCog,
  Check, ImageIcon, Upload,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { PasswordInput } from './PasswordInput';
import { PRESET_AVATARS, isPresetAvatar } from '../lib/avatars';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHOTO = 5 * 1024 * 1024; // 5 MB
const OK_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const LABEL = 'block text-sm font-semibold mb-1.5 text-text';
const fieldCls = (err: boolean) =>
  `w-full px-4 py-2.5 bg-page border rounded-xl text-sm text-text focus:outline-none focus:ring-2 transition-colors ${err ? 'border-error focus:ring-error/30 focus:border-error' : 'border-line focus:ring-brand/30 focus:border-brand'}`;

function ErrText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 flex items-center gap-1 text-xs font-medium text-error"><AlertCircle className="w-3 h-3 shrink-0" /> {msg}</p>;
}

function initials(name?: string) {
  if (!name?.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
}

type FieldKey = 'full_name' | 'email' | 'phone' | 'dni' | 'current' | 'password' | 'confirm';
type PhotoTab = 'upload' | 'preset';

export function CustomerProfileModal({ onClose }: { onClose: () => void }) {
  const { user, applyUserPatch, logout } = useAuth();
  const navigate = useNavigate();

  const hasPassword = user?.has_password !== false; // por defecto asume que sí

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [dni, setDni] = useState(user?.dni ?? '');
  const [address, setAddress] = useState(user?.address ?? '');

  const [changePwd, setChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Foto: archivo nuevo (preview local), avatar predefinido elegido, o eliminar.
  const [photoTab, setPhotoTab] = useState<PhotoTab>(isPresetAvatar(user?.photo_url) ? 'preset' : 'upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
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
    firstRef.current?.focus({ preventScroll: true });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [busy, onClose]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const touch = (k: FieldKey) => setTouched((t) => new Set(t).add(k));

  const errors = useMemo(() => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (!fullName.trim()) e.full_name = 'El nombre completo es obligatorio.';
    if (!email.trim()) e.email = 'El email es obligatorio.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Ingresa un email válido (ej. nombre@correo.com).';
    if (phone.trim() && !/^\d{9}$/.test(phone.trim())) e.phone = 'El teléfono debe tener 9 dígitos.';
    if (dni.trim() && !/^\d{8}$/.test(dni.trim())) e.dni = 'El DNI debe tener 8 dígitos.';
    if (changePwd) {
      if (hasPassword && !currentPwd) e.current = 'Ingresa tu contraseña actual.';
      if (password.length < 6) e.password = 'Mínimo 6 caracteres.';
      else if (confirm !== password) e.confirm = 'Las contraseñas no coinciden.';
    }
    return e;
  }, [fullName, email, phone, dni, changePwd, hasPassword, currentPwd, password, confirm]);

  const isValid = Object.keys(errors).length === 0;
  const showErr = (k: FieldKey) => ((submitAttempted || touched.has(k)) ? errors[k] : undefined);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!OK_TYPES.includes(f.type)) { toast.error('Formato no permitido. Usa JPG, PNG o WEBP.'); return; }
    if (f.size > MAX_PHOTO) { toast.error('La imagen supera el límite de 5 MB.'); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setSelectedAvatar(null);
    setRemovePhoto(false);
  };

  const pickAvatar = (url: string) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setSelectedAvatar(url);
    setRemovePhoto(false);
  };

  const clearSelectedPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setSelectedAvatar(null);
    setRemovePhoto(!!user?.photo_url);
  };

  // Imagen mostrada en el avatar grande del modal.
  const shownPhoto =
    previewUrl ?? selectedAvatar ?? (removePhoto ? null : user?.photo_url ?? null);

  const submit = async () => {
    setSubmitAttempted(true);
    if (busy || !isValid) return;
    setSaving(true);
    try {
      let photoChanged = false;
      let newPhotoUrl: string | null | undefined;

      if (file) {
        const { photo_url } = await api.customers.uploadMyPhoto(file);
        newPhotoUrl = photo_url;
        photoChanged = true;
      } else if (selectedAvatar && selectedAvatar !== user?.photo_url) {
        newPhotoUrl = selectedAvatar;
        photoChanged = true;
      } else if (removePhoto) {
        newPhotoUrl = null;
        photoChanged = true;
      }

      const updated = await api.customers.updateMe({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        dni: dni.trim() || null,
        address: address.trim() || null,
        ...(changePwd && password
          ? { customer_password: password, ...(hasPassword ? { current_password: currentPwd } : {}) }
          : {}),
        ...(photoChanged ? { photo_url: newPhotoUrl ?? null } : {}),
      });

      applyUserPatch({
        full_name: updated.full_name,
        email: updated.email ?? undefined,
        phone: updated.phone,
        dni: updated.dni,
        address: updated.address,
        photo_url: updated.photo_url ?? null,
        has_password: updated.has_password ?? true,
      });
      toast.success(changePwd && password ? 'Perfil y contraseña actualizados.' : 'Perfil actualizado.');
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : 'No se pudo guardar el perfil.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const doDeactivate = async () => {
    if (busy) return;
    setDeactivating(true);
    try {
      await api.customers.deactivateMe();
      toast.success('Tu cuenta fue desactivada. Cerramos tu sesión.');
      logout();
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? ((err.body as { message?: string })?.message || err.message) : 'No se pudo desactivar la cuenta.';
      toast.error(msg);
      setDeactivating(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[1200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Mi perfil" className="bg-surface rounded-2xl shadow-pop border border-line w-full max-w-lg max-h-[92vh] my-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0"><UserCog className="w-5 h-5" /></span>
            <h2 className="text-lg font-bold text-text">Mi perfil</h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar" className="p-2 text-muted hover:bg-page rounded-lg transition-colors disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Avatar grande + acciones */}
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {shownPhoto ? (
                <img src={shownPhoto} alt="Avatar" className="w-20 h-20 rounded-full object-cover border border-line bg-page" />
              ) : (
                <span className="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-2xl font-bold">{initials(fullName)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Tu avatar</p>
              <p className="text-xs text-muted mt-0.5">Sube una foto o elige un avatar. Reemplaza el de iniciales.</p>
              {shownPhoto && (
                <button type="button" onClick={clearSelectedPhoto} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-page text-xs font-semibold text-muted hover:border-error hover:text-error transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Quitar avatar
                </button>
              )}
            </div>
          </div>

          {/* Selector de modo: subir foto / elegir avatar */}
          <div>
            <div role="tablist" aria-label="Tipo de avatar" className="inline-flex items-center gap-1 rounded-xl border border-line bg-page p-1 mb-3">
              <button type="button" role="tab" aria-selected={photoTab === 'upload'} onClick={() => setPhotoTab('upload')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${photoTab === 'upload' ? 'bg-surface text-brand shadow-sm' : 'text-muted hover:text-text'}`}>
                <Upload className="w-3.5 h-3.5" /> Subir foto
              </button>
              <button type="button" role="tab" aria-selected={photoTab === 'preset'} onClick={() => setPhotoTab('preset')} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${photoTab === 'preset' ? 'bg-surface text-brand shadow-sm' : 'text-muted hover:text-text'}`}>
                <ImageIcon className="w-3.5 h-3.5" /> Elegir avatar
              </button>
            </div>

            {photoTab === 'upload' ? (
              <div className="rounded-xl border border-dashed border-line bg-page/60 p-4 flex items-center gap-3">
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                  <Camera className="w-4 h-4" /> {file ? 'Cambiar foto' : 'Elegir archivo'}
                </button>
                <p className="text-xs text-muted">JPG, PNG o WEBP · máx. 5 MB.{file ? ' Vista previa lista — guarda para aplicar.' : ''}</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickFile} className="hidden" />
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                {PRESET_AVATARS.map((url) => {
                  const active = selectedAvatar === url || (!selectedAvatar && !previewUrl && !removePhoto && user?.photo_url === url);
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => pickAvatar(url)}
                      aria-label="Elegir este avatar"
                      aria-pressed={active}
                      className={`relative rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${active ? 'ring-2 ring-brand ring-offset-2' : ''}`}
                    >
                      <img src={url} alt="" className="w-full aspect-square rounded-full" />
                      {active && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Datos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="cp-name">Nombre completo *</label>
              <input ref={firstRef} id="cp-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => touch('full_name')} className={fieldCls(!!showErr('full_name'))} placeholder="Ej: Ana Torres" />
              <ErrText msg={showErr('full_name')} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="cp-email">Email (acceso) *</label>
              <input id="cp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch('email')} className={fieldCls(!!showErr('email'))} placeholder="nombre@correo.com" autoComplete="off" />
              {showErr('email') ? <ErrText msg={showErr('email')} /> : <p className="mt-1 text-xs text-muted">Con este correo inicias sesión.</p>}
            </div>
            <div>
              <label className={LABEL} htmlFor="cp-phone">Teléfono</label>
              <input id="cp-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} onBlur={() => touch('phone')} className={fieldCls(!!showErr('phone'))} placeholder="9 dígitos" />
              <ErrText msg={showErr('phone')} />
            </div>
            <div>
              <label className={LABEL} htmlFor="cp-dni">DNI</label>
              <input id="cp-dni" type="text" inputMode="numeric" value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={() => touch('dni')} className={fieldCls(!!showErr('dni'))} placeholder="8 dígitos" />
              <ErrText msg={showErr('dni')} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL} htmlFor="cp-address">Dirección</label>
              <input id="cp-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={fieldCls(false)} placeholder="Av. / Calle, número, distrito (opcional)" />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            {!changePwd ? (
              <button type="button" onClick={() => setChangePwd(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-page text-sm font-semibold text-text hover:border-brand hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <KeyRound className="w-4 h-4" /> {hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}
              </button>
            ) : (
              <div className="rounded-xl border border-line bg-page p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text flex items-center gap-2"><KeyRound className="w-4 h-4 text-brand" /> {hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}</p>
                  <button type="button" onClick={() => { setChangePwd(false); setCurrentPwd(''); setPassword(''); setConfirm(''); }} className="text-xs font-semibold text-muted hover:text-error transition-colors">Cancelar</button>
                </div>
                {!hasPassword && (
                  <p className="text-xs text-muted">Tu cuenta usa Google. Crea una contraseña para también entrar con tu email.</p>
                )}
                {hasPassword && (
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted" htmlFor="cp-current">Contraseña actual</label>
                    <PasswordInput id="cp-current" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} onBlur={() => touch('current')} inputClassName={fieldCls(!!showErr('current'))} placeholder="Tu contraseña actual" autoComplete="current-password" />
                    <ErrText msg={showErr('current')} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted" htmlFor="cp-new">Nueva contraseña</label>
                  <PasswordInput id="cp-new" value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch('password')} inputClassName={fieldCls(!!showErr('password'))} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                  <ErrText msg={showErr('password')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted" htmlFor="cp-confirm">Repite la nueva contraseña</label>
                  <PasswordInput id="cp-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} onBlur={() => touch('confirm')} inputClassName={fieldCls(!!showErr('confirm'))} placeholder="Repite la nueva contraseña" autoComplete="new-password" />
                  <ErrText msg={showErr('confirm')} />
                </div>
              </div>
            )}
          </div>

          {/* Zona de peligro: desactivar cuenta */}
          <div className="rounded-xl border border-error/30 bg-error-soft/40 p-4">
            {!confirmOff ? (
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text flex items-center gap-2"><ShieldOff className="w-4 h-4 text-error" /> Desactivar mi cuenta</p>
                  <p className="text-xs text-muted mt-0.5">Perderás el acceso y se cerrará tu sesión. Podrás reactivarla contactándonos.</p>
                </div>
                <button type="button" onClick={() => setConfirmOff(true)} disabled={busy} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-error/50 text-error text-xs font-bold hover:bg-error hover:text-white transition-colors disabled:opacity-50">
                  Desactivar
                </button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-error flex items-center gap-2"><ShieldOff className="w-4 h-4" /> ¿Seguro que quieres desactivar tu cuenta?</p>
                <p className="text-xs text-muted mt-1">Esta acción cierra tu sesión de inmediato y no podrás volver a entrar hasta reactivarla.</p>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={doDeactivate} disabled={busy} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-error text-white text-xs font-bold hover:bg-[color-mix(in_srgb,var(--c-error)_88%,black)] transition-colors disabled:opacity-50">
                    {deactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {deactivating ? 'Desactivando…' : 'Sí, desactivar'}
                  </button>
                  <button type="button" onClick={() => setConfirmOff(false)} disabled={busy} className="px-4 py-2 rounded-lg border border-line bg-surface text-xs font-semibold text-muted hover:bg-page transition-colors disabled:opacity-50">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-line">
          <button type="button" onClick={submit} disabled={busy || !isValid} className="flex-1 inline-flex items-center justify-center gap-2 bg-brand text-white py-3 rounded-xl font-semibold hover:bg-brand-hover active:scale-[0.99] shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <button type="button" onClick={onClose} disabled={busy} className="flex-1 bg-page text-muted border border-line py-3 rounded-xl font-semibold hover:bg-line-2 transition-colors disabled:opacity-60">Cancelar</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
