// ============================================================
// Geocodificación ligera (solo frontend)
// ------------------------------------------------------------
// Convierte un texto de dirección en coordenadas usando el
// servicio público Nominatim (OpenStreetMap). Sin API key.
// Se usa SOLO como respaldo cuando la sede no trae latitude/
// longitude desde el backend. Cachea cada consulta en memoria
// para no repetir peticiones por la misma dirección.
// ============================================================

export interface LatLng {
  lat: number;
  lng: number;
}

const cache = new Map<string, Promise<LatLng | null>>();

/** Geocodifica una dirección/consulta. Devuelve null si no hay resultado. */
export function geocode(query: string): Promise<LatLng | null> {
  const key = query.trim().toLowerCase();
  if (!key) return Promise.resolve(null);

  const cached = cache.get(key);
  if (cached) return cached;

  const request = fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { 'Accept-Language': 'es' } },
  )
    .then((res) => (res.ok ? res.json() : null))
    .then((data): LatLng | null => {
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
      }
      return null;
    })
    .catch(() => null);

  cache.set(key, request);
  return request;
}
