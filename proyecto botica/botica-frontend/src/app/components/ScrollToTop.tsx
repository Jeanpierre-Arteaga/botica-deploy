// ============================================================
// ScrollToTop — sube el scroll al cambiar de ruta
// ------------------------------------------------------------
// React Router v7 (createBrowserRouter) NO restaura el scroll por sí
// solo: al navegar conserva la posición anterior, así que una página
// nueva aparecía "abajo". Este componente lo corrige.
//
// En esta app el que scrollea es la WINDOW (html/body/#root no tienen
// overflow propio), por eso usamos window.scrollTo + respaldos en
// documentElement/body.
//
// Reglas:
//  - Solo en navegación PUSH/REPLACE (clics en links). En POP (atrás/
//    adelante) NO tocamos nada para no romper la restauración del navegador.
//  - Si la URL trae #hash (ancla de la misma página) lo respetamos.
//  - useLayoutEffect: aplica ANTES de pintar (sin parpadeo). Un
//    requestAnimationFrame de refuerzo cubre reflows tardíos (imágenes,
//    contenido async) que reaparecen desplazados.
//
// Se monta una sola vez, dentro del Router (ver routes.tsx).
// ============================================================

import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router";

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType(); // "PUSH" | "REPLACE" | "POP"

  useLayoutEffect(() => {
    if (import.meta.env.DEV) {
      // Verificación: debe loguear en CADA cambio de ruta.
      console.log("[ScrollToTop]", navType, pathname, hash || "(sin hash)");
    }

    // Atrás/adelante: dejar que el navegador restaure la posición.
    if (navType === "POP") return;
    // Ancla #seccion: posicionar la sección destino (scroll suave). Un rAF
    // de refuerzo cubre el caso de contenido que monta tras la navegación.
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      const toEl = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      toEl();
      const rafHash = requestAnimationFrame(toEl);
      return () => cancelAnimationFrame(rafHash);
    }

    const toTop = () => {
      // Instantáneo (forma de 2 args, sin animación).
      window.scrollTo(0, 0);
      // Respaldos por si algún navegador no mueve la window con scrollTo.
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };

    toTop();
    const raf = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, navType]);

  return null;
}
