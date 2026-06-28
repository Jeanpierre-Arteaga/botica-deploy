import type { ReactNode } from "react";

/**
 * Container — ancho estándar del storefront.
 *
 * Centraliza el max-width y el padding horizontal para que TODAS las secciones
 * (home y otras páginas) queden alineadas al MISMO borde izquierdo/derecho de
 * arriba a abajo. Es el ancho de la sección de Ofertas: `max-w-7xl + px-4`.
 *
 * No cambies el ancho aquí sin querer realinear todo el sitio. Para casos que
 * necesiten ajustes (p. ej. `relative` o padding vertical propio), pásalos por
 * `className` — se concatenan después del ancho base.
 */
interface ContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Container({ children, className = "", id }: ContainerProps) {
  return (
    <div id={id} className={`max-w-7xl mx-auto px-4 ${className}`}>
      {children}
    </div>
  );
}
