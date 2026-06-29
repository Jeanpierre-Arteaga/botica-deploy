// ============================================================
// announce — anuncios a lectores de pantalla (aria-live)
// ============================================================
// Capa SEMÁNTICA (la importante): permite anunciar cambios que ocurren
// sin recargar la página a CUALQUIER lector de pantalla, no solo al
// widget propio de voz. Desacoplado por evento global; el componente
// <LiveRegion/> (montado en el layout) escucha y escribe en las
// regiones aria-live.
//
//   announce("Producto agregado al carrito")        → cortés (polite)
//   announce("No se pudo procesar el pago", true)    → asertivo (errores críticos)
// ============================================================

export const ANNOUNCE_EVENT = "app:announce";

export interface AnnounceDetail {
  text: string;
  assertive: boolean;
}

/**
 * Anuncia un mensaje a la región aria-live correspondiente.
 * @param text     Mensaje a leer.
 * @param assertive `true` solo para errores críticos (interrumpe). Por
 *                  defecto `false` (cortés: espera a que el lector termine).
 */
export function announce(text: string, assertive = false): void {
  if (typeof window === "undefined") return;
  const clean = text.trim();
  if (!clean) return;
  window.dispatchEvent(
    new CustomEvent<AnnounceDetail>(ANNOUNCE_EVENT, {
      detail: { text: clean, assertive },
    })
  );
}
