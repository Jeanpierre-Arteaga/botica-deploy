// ============================================================
// LiveRegion — regiones aria-live globales + reset de voz por ruta
// ============================================================
// Renderiza dos regiones visualmente ocultas (sr-only):
//   · polite    → cambios no urgentes ("Producto agregado al carrito",
//                 "N resultados encontrados", confirmaciones).
//   · assertive → errores críticos (role="alert").
// Escucha el evento global de announce() y, para forzar la relectura
// aunque el texto se repita, limpia y reescribe el contenido.
//
// Además, al cambiar de ruta corta cualquier lectura por voz en curso
// (evita que se solapen voces al navegar) y limpia los anuncios viejos.
// ============================================================

import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { ANNOUNCE_EVENT, type AnnounceDetail } from "../lib/announce";
import { cancelSpeech } from "../lib/voiceReader";

export function LiveRegion() {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const location = useLocation();

  useEffect(() => {
    const onAnnounce = (e: Event) => {
      const detail = (e as CustomEvent<AnnounceDetail>).detail;
      if (!detail?.text) return;
      const set = detail.assertive ? setAssertive : setPolite;
      // Limpiar y reescribir para que el lector relea aunque el texto repita.
      set("");
      window.setTimeout(() => set(detail.text), 60);
    };
    window.addEventListener(ANNOUNCE_EVENT, onAnnounce);
    return () => window.removeEventListener(ANNOUNCE_EVENT, onAnnounce);
  }, []);

  // Al navegar: corta la voz en curso y limpia anuncios anteriores.
  useEffect(() => {
    cancelSpeech();
    setPolite("");
    setAssertive("");
  }, [location.pathname]);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div aria-live="assertive" aria-atomic="true" role="alert" className="sr-only">
        {assertive}
      </div>
    </>
  );
}
