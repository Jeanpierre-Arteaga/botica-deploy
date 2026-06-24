// ============================================================
// Helpers de contacto y mapas (puros, sin estado)
// ------------------------------------------------------------
// Construyen los hrefs de tel:/wa.me/mailto y las URLs de
// Google Maps a partir de los datos que vienen del backend.
// No hardcodean ningún dato de sede.
// ============================================================

import type { Location } from './types';

/** Código de país de Perú (sin el "+"). */
const PERU_DIAL_CODE = '51';

/** Deja solo dígitos: "(01) 998-113-090" → "01998113090". */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/**
 * Normaliza un teléfono al formato internacional sin "+".
 * Si son 9 dígitos (móvil peruano) antepone 51; si ya trae código país,
 * lo respeta. Devuelve '' si no hay dígitos.
 */
export function toInternational(phone: string | null | undefined): string {
  const d = digitsOnly(phone);
  if (!d) return '';
  return d.length === 9 ? `${PERU_DIAL_CODE}${d}` : d;
}

/** href para llamar: "tel:+51998113090". '' si no hay teléfono. */
export function telHref(phone: string | null | undefined): string {
  const intl = toInternational(phone);
  return intl ? `tel:+${intl}` : '';
}

/**
 * href de WhatsApp: "https://wa.me/51998113090".
 * Permite un mensaje inicial opcional.
 */
export function whatsappHref(
  phone: string | null | undefined,
  message?: string,
): string {
  const intl = toInternational(phone);
  if (!intl) return '';
  const base = `https://wa.me/${intl}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** href de correo: "mailto:...". '' si no hay email. */
export function mailtoHref(email: string | null | undefined): string {
  return email ? `mailto:${email}` : '';
}

/**
 * Texto a usar para buscar la sede en Google Maps.
 * Prioriza maps_query; si no, cae a la dirección.
 */
export function mapsQueryOf(location: Pick<Location, 'maps_query' | 'location_address'>): string {
  return (location.maps_query || location.location_address || '').trim();
}

/** URL para abrir Google Maps en una pestaña nueva (botón "Ver en Google Maps"). */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** URL del iframe embed de Google Maps (no requiere API key). */
export function mapsEmbedUrl(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}
