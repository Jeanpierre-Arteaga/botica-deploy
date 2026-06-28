// ============================================================
// StoreMap — mapa interactivo por sede (Leaflet + CARTO)
// ------------------------------------------------------------
// Mapa propio, sin API key y con color real:
//  - Tiles OpenStreetMap estándar: colores vivos y realistas
//    (calles marcadas, parques verdes, agua azul) tipo Google Maps.
//  - Pin de marca discreto (SVG).
//  - Zoom con botones +/- , doble clic y pellizco; el scroll de
//    la rueda NO secuestra la página (sin overlay "Ctrl + scroll").
//  - Sin tarjeta de lugar ni recuadros encima.
// Centro: usa latitude/longitude de la sede si existen; si no,
// geocodifica el texto de búsqueda en el cliente (respaldo).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './StoreMap.css';
import { mapsSearchUrl } from '../lib/contact';
import { geocode, type LatLng } from '../lib/geocode';

interface StoreMapProps {
  /** Texto de búsqueda (dirección o maps_query) para el respaldo de geocodificación. */
  query: string;
  /** Nombre de la sede, para accesibilidad. */
  title: string;
  /** Coordenadas desde backend (prioritarias). */
  lat?: number | null;
  lng?: number | null;
  /**
   * Proporción opcional. Si se omite, el alto lo controla la clase
   * (p. ej. `h-[170px] md:h-[210px]`), que es lo recomendado para
   * un mapa "web-real" sin que se deforme.
   */
  aspectRatio?: string;
  className?: string;
}

/** Pin de marca minimalista como icono Leaflet.
 *  El color de marca se toma del token --c-brand vía `style` (los CSS vars no
 *  resuelven en el atributo `fill` de un SVG, pero sí en `style="fill:…"`). */
function brandPin(): L.DivIcon {
  return L.divIcon({
    className: 'store-pin',
    iconSize: [30, 38],
    iconAnchor: [15, 37],
    html: `
      <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 13.4 21.74 13.97 22.21a1.6 1.6 0 0 0 2.06 0C16.6 36.74 30 25.5 30 15 30 6.716 23.284 0 15 0Z" style="fill:var(--c-brand)"/>
        <circle cx="15" cy="15" r="5.4" fill="#fff"/>
      </svg>`,
  });
}

export function StoreMap({
  query,
  title,
  lat,
  lng,
  aspectRatio,
  className,
}: StoreMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [center, setCenter] = useState<LatLng | null>(null);
  const [failed, setFailed] = useState(false);

  // 1) Resolver coordenadas: backend → geocodificación de respaldo.
  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setCenter(null);

    const hasCoords =
      typeof lat === 'number' && typeof lng === 'number' &&
      !Number.isNaN(lat) && !Number.isNaN(lng);

    if (hasCoords) {
      setCenter({ lat: lat as number, lng: lng as number });
      return;
    }

    if (!query) {
      setFailed(true);
      return;
    }

    geocode(query).then((coords) => {
      if (cancelled) return;
      if (coords) setCenter(coords);
      else setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, query]);

  // 2) Montar el mapa cuando hay centro.
  useEffect(() => {
    if (!center || !containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 16,
      scrollWheelZoom: false, // no secuestra el scroll de la página
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.marker([center.lat, center.lng], { icon: brandPin(), title })
      .addTo(map);

    // Asegura el tamaño correcto tras el layout inicial.
    setTimeout(() => map.invalidateSize(), 0);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, title]);

  // Respaldo si no se pudo ubicar: enlace limpio a Google Maps.
  if (failed) {
    return (
      <div
        className={`store-map flex items-center justify-center ${className ?? ''}`}
        style={{ ...(aspectRatio ? { aspectRatio } : null), backgroundColor: 'var(--c-line-2)' }}
      >
        <a
          href={mapsSearchUrl(query)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold"
          style={{ color: 'var(--c-brand)' }}
        >
          Ver ubicación en Google Maps
        </a>
      </div>
    );
  }

  return (
    <div
      className={`store-map relative w-full overflow-hidden ${className ?? ''}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {!center && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: 'var(--c-line-2)' }}
        />
      )}
    </div>
  );
}
