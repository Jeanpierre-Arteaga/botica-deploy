// ============================================================
// PrescriptionUpload — Subir receta médica y leerla con IA
// ============================================================
// Ícono en la barra superior → modal para subir/tomar foto de la receta →
// análisis con IA (backend) → pantalla de confirmación tipo carrito donde el
// usuario revisa, edita cantidades, incluye/excluye y confirma.
//
// SEGURIDAD CLÍNICA: la IA solo PROPONE. Nada entra al carrito sin que el
// usuario lo marque y confirme. El aviso permanece visible.
// PRIVACIDAD: la imagen se envía al backend y no se guarda; aquí solo vive en
// memoria (object URL para la vista previa, revocado al cerrar).
// ============================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ScrollText,
  Camera,
  UploadCloud,
  Loader2,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  ShoppingCart,
  Pill,
  ImageOff,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { api, ApiError } from '../lib/api';
import { useCart } from '../lib/CartContext';
import type { PrescriptionMatch, PrescriptionUnmatched } from '../lib/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB (debe coincidir con el backend)

/**
 * Evento global con el que el FAB de acción rápida abre ESTE modal sin duplicar
 * la lógica de subir receta. Lo despacha QuickActionFab; lo escucha la instancia
 * de PrescriptionUpload marcada con `respondToFab`.
 */
export const PRESCRIPTION_OPEN_EVENT = 'botica:open-prescription';

type Step = 'upload' | 'loading' | 'result' | 'error';

// Fila editable de la pantalla de confirmación.
interface MatchRow extends PrescriptionMatch {
  include: boolean;
  qty: number;
}

interface PrescriptionUploadProps {
  /** light = headers claros (storefront) · dark = top bars oscuras */
  variant?: 'light' | 'dark';
  className?: string;
  /**
   * Si es true, esta instancia abre el modal cuando el FAB despacha
   * PRESCRIPTION_OPEN_EVENT. Solo UNA instancia debe tenerlo (el Navbar monta
   * dos: desktop y móvil) para no abrir dos diálogos a la vez. El Dialog usa
   * portal, así que la instancia desktop también funciona en móvil.
   */
  respondToFab?: boolean;
}

export function PrescriptionUpload({
  variant = 'light',
  className = '',
  respondToFab = false,
}: PrescriptionUploadProps) {
  const { addItems } = useCart();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [rows, setRows] = useState<MatchRow[]>([]);
  const [unmatched, setUnmatched] = useState<PrescriptionUnmatched[]>([]);
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoca el object URL anterior para no filtrar memoria.
  const setPreview = useCallback((url: string | null) => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El FAB de acción rápida abre ESTE mismo modal (no se duplica la función):
  // escucha un evento global y abre el diálogo de subir receta.
  useEffect(() => {
    if (!respondToFab) return;
    const openFromFab = () => setOpen(true);
    window.addEventListener(PRESCRIPTION_OPEN_EVENT, openFromFab);
    return () => window.removeEventListener(PRESCRIPTION_OPEN_EVENT, openFromFab);
  }, [respondToFab]);

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setDragOver(false);
    setErrorMsg('');
    setRows([]);
    setUnmatched([]);
    setNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setPreview]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetState();
  };

  const pickFile = useCallback(
    (f: File | undefined | null) => {
      if (!f) return;
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error('Formato no permitido. Usa una imagen JPG, PNG o WEBP.');
        return;
      }
      if (f.size > MAX_SIZE) {
        toast.error('La imagen es muy pesada (máx. 8 MB).');
        return;
      }
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setStep('upload');
      setErrorMsg('');
    },
    [setPreview]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    pickFile(e.target.files?.[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  };

  const analyze = useCallback(async () => {
    if (!file) return;
    setStep('loading');
    setErrorMsg('');
    try {
      const res = await api.prescriptions.scan(file);
      setRows(
        res.matched.map((m) => ({
          ...m,
          include: true,
          qty: m.quantity > 0 ? m.quantity : 1,
        }))
      );
      setUnmatched(res.unmatched);
      setNotes(res.notes);
      setStep('result');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'No se pudo analizar la receta. Inténtalo de nuevo.';
      setErrorMsg(msg);
      setStep('error');
    }
  }, [file]);

  const toggleInclude = (id: number) =>
    setRows((prev) =>
      prev.map((r) => (r.product_id === id ? { ...r, include: !r.include } : r))
    );

  const setQty = (id: number, qty: number) =>
    setRows((prev) =>
      prev.map((r) =>
        r.product_id === id ? { ...r, qty: Math.max(1, qty) } : r
      )
    );

  const selected = rows.filter((r) => r.include);
  const total = selected.reduce((sum, r) => sum + r.product_price * r.qty, 0);

  const addToCart = () => {
    if (selected.length === 0) {
      toast.error('Marca al menos un producto para añadir.');
      return;
    }
    addItems(
      selected.map((r) => ({
        product: {
          product_id: r.product_id,
          product_name: r.product_name,
          product_price: r.product_price,
          image_url: r.image_url,
        },
        amount: r.qty,
      }))
    );
    const n = selected.reduce((s, r) => s + r.qty, 0);
    toast.success(
      `${n} ${n === 1 ? 'producto añadido' : 'productos añadidos'} al carrito desde tu receta`
    );
    handleOpenChange(false);
  };

  const triggerStyles =
    variant === 'dark'
      ? 'text-white/70 hover:bg-white/10 hover:text-white'
      : 'text-text hover:bg-brand-soft hover:text-brand';

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Subir receta médica"
        title="Subir receta médica"
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${triggerStyles}`}
      >
        <ScrollText className="w-5 h-5" />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden bg-surface border-line max-h-[90vh] flex flex-col">
          {/* ===== Encabezado ===== */}
          <div className="px-6 pt-6 pb-4 border-b border-line">
            <DialogTitle className="flex items-center gap-2 text-text text-lg font-semibold">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-soft text-brand">
                <ScrollText className="w-4 h-4" />
              </span>
              Subir receta médica
            </DialogTitle>
            <DialogDescription className="text-muted text-sm mt-1">
              Sube una foto de tu receta y te sugerimos los productos del catálogo.
            </DialogDescription>
          </div>

          {/* ===== Aviso de seguridad clínica (siempre visible) ===== */}
          <div className="px-6 pt-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft border border-warning/30 px-3.5 py-2.5">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text leading-relaxed">
                Sugerencia automática con IA: revisa los productos antes de añadir.
                Algunos medicamentos requieren <strong>receta válida</strong> para su despacho.
              </p>
            </div>
          </div>

          {/* ===== Cuerpo (scroll) ===== */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* ---------- PASO: subir / vista previa ---------- */}
            {(step === 'upload' || step === 'loading') && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onInputChange}
                  // TODO futuro: handoff por QR para subir desde el celular a la sesión del PC
                />

                {!previewUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 px-4 transition-colors ${
                      dragOver
                        ? 'border-brand bg-brand-soft'
                        : 'border-line hover:border-brand hover:bg-brand-soft/50'
                    }`}
                  >
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-soft text-brand">
                      <UploadCloud className="w-7 h-7" />
                    </span>
                    <span className="text-sm font-semibold text-text">
                      Toca para tomar foto o subir imagen
                    </span>
                    <span className="text-xs text-muted text-center max-w-xs">
                      En el celular se abre la cámara. En la computadora puedes
                      arrastrar la imagen aquí. JPG, PNG o WEBP (máx. 8 MB).
                    </span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-line bg-page flex items-center justify-center max-h-72">
                      <img
                        src={previewUrl}
                        alt="Vista previa de la receta"
                        className="max-h-72 w-auto object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={step === 'loading'}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      Cambiar imagen
                    </button>
                  </div>
                )}

                {step === 'loading' && (
                  <div className="flex items-center justify-center gap-2.5 py-3 text-brand">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Leyendo tu receta…</span>
                  </div>
                )}
              </div>
            )}

            {/* ---------- PASO: error ---------- */}
            {step === 'error' && (
              <div className="flex flex-col items-center text-center gap-3 py-8">
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-error-soft text-error">
                  <AlertTriangle className="w-7 h-7" />
                </span>
                <p className="text-sm font-semibold text-text">No pudimos leer la receta</p>
                <p className="text-xs text-muted max-w-sm">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Intentar de nuevo
                </button>
              </div>
            )}

            {/* ---------- PASO: resultado / confirmación ---------- */}
            {step === 'result' && (
              <div className="space-y-4">
                {rows.length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-3 py-8">
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-brand-soft text-brand">
                      <Pill className="w-7 h-7" />
                    </span>
                    <p className="text-sm font-semibold text-text">
                      No detectamos medicamentos del catálogo
                    </p>
                    <p className="text-xs text-muted max-w-sm">
                      Intenta con una foto más clara y bien iluminada de la receta.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep('upload')}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Probar con otra foto
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text">
                      Productos detectados ({rows.length})
                    </p>

                    <div className="space-y-2.5">
                      {rows.map((r) => {
                        const showOld =
                          r.is_offer &&
                          r.old_price != null &&
                          r.old_price > r.product_price;
                        const discount = showOld
                          ? Math.round(
                              (1 - r.product_price / (r.old_price as number)) * 100
                            )
                          : 0;
                        return (
                          <div
                            key={r.product_id}
                            className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                              r.include
                                ? 'border-line bg-surface'
                                : 'border-line bg-page opacity-60'
                            }`}
                          >
                            {/* Checkbox incluir/excluir */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={r.include}
                              aria-label={
                                r.include
                                  ? `Excluir ${r.product_name}`
                                  : `Incluir ${r.product_name}`
                              }
                              onClick={() => toggleInclude(r.product_id)}
                              className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                r.include
                                  ? 'bg-brand border-brand text-white'
                                  : 'bg-surface border-line'
                              }`}
                            >
                              {r.include && <Check className="w-3.5 h-3.5" />}
                            </button>

                            {/* Imagen */}
                            <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-page flex items-center justify-center border border-line-2">
                              {r.image_url ? (
                                <img
                                  src={r.image_url}
                                  alt={r.product_name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <ImageOff className="w-5 h-5 text-faint" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-semibold text-text line-clamp-1">
                                  {r.product_name}
                                </h4>
                                {r.confidence === 'baja' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-warning-soft text-warning">
                                    <AlertTriangle className="w-3 h-3" />
                                    Verificar
                                  </span>
                                )}
                              </div>
                              {(r.active_ingredient || r.strength) && (
                                <p className="text-xs text-faint line-clamp-1">
                                  {[r.active_ingredient, r.strength]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              )}
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-sm font-bold text-brand leading-none">
                                  S/ {r.product_price.toFixed(2)}
                                </span>
                                {showOld && (
                                  <>
                                    <span className="text-xs line-through text-faint leading-none">
                                      S/ {(r.old_price as number).toFixed(2)}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none text-white bg-sale">
                                      -{discount}%
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Stepper de cantidad */}
                            <div className="flex items-center gap-1 bg-page rounded-lg flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setQty(r.product_id, r.qty - 1)}
                                disabled={!r.include}
                                className="w-7 h-7 flex items-center justify-center rounded-l-lg hover:bg-line transition-colors disabled:opacity-40"
                                aria-label="Disminuir cantidad"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold">
                                {r.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => setQty(r.product_id, r.qty + 1)}
                                disabled={!r.include}
                                className="w-7 h-7 flex items-center justify-center rounded-r-lg hover:bg-line transition-colors disabled:opacity-40"
                                aria-label="Aumentar cantidad"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* No encontrados (transparencia) */}
                {unmatched.length > 0 && (
                  <div className="rounded-xl bg-page border border-line-2 p-3">
                    <p className="text-xs font-semibold text-muted mb-1">
                      No encontramos en catálogo:
                    </p>
                    <p className="text-xs text-faint">
                      {unmatched.map((u) => u.detected_name).join(', ')}
                    </p>
                  </div>
                )}

                {/* Notas de la IA */}
                {notes && (
                  <p className="text-xs text-faint italic">Nota de lectura: {notes}</p>
                )}
              </div>
            )}
          </div>

          {/* ===== Pie ===== */}
          <div className="px-6 py-4 border-t border-line flex items-center justify-between gap-3">
            {step === 'result' && rows.length > 0 ? (
              <>
                <div className="text-sm">
                  <span className="text-muted">Total estimado: </span>
                  <span className="font-bold text-text">S/ {total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenChange(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-page transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={selected.length === 0}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Añadir al carrito
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-page transition-colors"
                >
                  Cancelar
                </button>
                {(step === 'upload' || step === 'loading') && (
                  <button
                    type="button"
                    onClick={analyze}
                    disabled={!file || step === 'loading'}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {step === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ScrollText className="w-4 h-4" />
                    )}
                    Analizar receta
                  </button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
