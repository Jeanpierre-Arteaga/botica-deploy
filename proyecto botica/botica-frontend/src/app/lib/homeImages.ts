/**
 * Detección automática de imágenes del home (mismo patrón que el hero/banner).
 *
 * Coloca tus archivos en `src/assets/home/` y referéncialos por su NOMBRE BASE
 * (sin extensión):
 *
 *     homeImage("promo-wide")  // -> url de src/assets/home/promo-wide.webp
 *
 * Si el archivo aún no existe, devuelve `undefined` y el componente muestra un
 * fallback sobrio (sin hueco roto). El build queda limpio aunque falte la imagen.
 *
 * Formatos soportados: .webp, .jpg, .jpeg, .png
 *
 * NOTA: el patrón lista los nombres permitidos explícitamente (en vez de `*`)
 * para que el bundle SOLO incluya estas imágenes y no todo lo que haya en la
 * carpeta. Si añades un slot nuevo, agrega su nombre base aquí.
 */
const modules = import.meta.glob<string>(
  "../../assets/home/{banner-retiro,banner-genericos,promo-wide,promo-square,asesoria,hero-2,hero-3}.{webp,jpg,jpeg,png}",
  { eager: true, import: "default" },
);

const byName: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const file = path.split("/").pop() ?? "";
  const base = file.replace(/\.(webp|jpg|jpeg|png)$/i, "");
  byName[base] = url as string;
}

/** Devuelve la URL de la imagen `src/assets/home/<name>.<ext>` o undefined. */
export function homeImage(name: string): string | undefined {
  return byName[name];
}
