// ============================================================
// useGoogleAuth — Inicio de sesión con Google (cliente)
// ============================================================
// Carga Google Identity Services (GIS) bajo demanda y expone un
// signIn() que abre el popup REAL de selección de cuenta de Google.
// Devuelve un access_token que el backend verifica contra Google.
//
// No requiere instalar dependencias: usa el script oficial de GIS.
// Necesita VITE_GOOGLE_CLIENT_ID en el front (.env).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Carga el script una sola vez (memoizado a nivel de módulo).
let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no-window'));
  // @ts-expect-error google se inyecta por el script externo
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('gis-load-error')));
      return;
    }
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gis-load-error'));
    document.head.appendChild(s);
  });
  return gisPromise;
}

interface UseGoogleAuthResult {
  /** Hay VITE_GOOGLE_CLIENT_ID configurado */
  configured: boolean;
  /** GIS cargado y token client listo */
  ready: boolean;
  /** Abre el popup de Google */
  signIn: () => void;
  /** Error de carga / popup (sobrio, en español) */
  error: string | null;
  setError: (v: string | null) => void;
}

export function useGoogleAuth(
  onToken: (accessToken: string) => void
): UseGoogleAuthResult {
  const configured = Boolean(CLIENT_ID);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<{ requestAccessToken: () => void } | null>(null);

  // Mantén la última callback sin recrear el token client.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    loadGis()
      .then(() => {
        if (cancelled) return;
        // @ts-expect-error google se inyecta por el script externo
        const google = window.google;
        clientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'openid email profile',
          callback: (resp: { access_token?: string }) => {
            if (resp?.access_token) {
              onTokenRef.current(resp.access_token);
            }
          },
          error_callback: (err: { type?: string }) => {
            if (err?.type === 'popup_closed') {
              setError('Cerraste la ventana de Google antes de terminar.');
            } else if (err?.type === 'popup_failed_to_open') {
              setError('No se pudo abrir Google. Revisa el bloqueador de ventanas.');
            } else {
              setError('No se pudo continuar con Google. Intenta de nuevo.');
            }
          },
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar Google. Revisa tu conexión.');
      });

    return () => {
      cancelled = true;
    };
  }, [configured]);

  const signIn = useCallback(() => {
    setError(null);
    if (!clientRef.current) {
      setError('Google aún se está cargando. Intenta de nuevo en un momento.');
      return;
    }
    clientRef.current.requestAccessToken();
  }, []);

  return { configured, ready, signIn, error, setError };
}
