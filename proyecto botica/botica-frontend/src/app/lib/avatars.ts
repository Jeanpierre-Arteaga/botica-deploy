// ============================================================
// Avatares predefinidos del cliente
// ============================================================
// Conjunto de avatares "a prueba de fallos": son SVGs estáticos servidos
// desde `public/avatars/`, NO dependen de S3. Cuando el cliente elige uno,
// guardamos su RUTA en `photo_url` (ej. "/avatars/av-3.svg"). Esa ruta se usa
// tal cual como `src` del <img> del avatar en el navbar/menú.
// ============================================================

export const PRESET_AVATARS: string[] = [
  '/avatars/av-1.svg',
  '/avatars/av-2.svg',
  '/avatars/av-3.svg',
  '/avatars/av-4.svg',
  '/avatars/av-5.svg',
  '/avatars/av-6.svg',
  '/avatars/av-7.svg',
  '/avatars/av-8.svg',
];

/** True si `url` es uno de nuestros avatares predefinidos (ruta local). */
export function isPresetAvatar(url?: string | null): boolean {
  return !!url && url.startsWith('/avatars/');
}
