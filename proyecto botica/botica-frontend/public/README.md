# Assets públicos del Hero

- `hero.mp4` — **PENDIENTE**: coloca aquí tu video real de fondo del hero.
  - Recomendado: H.264/MP4, ~1920x1080, 8–15s en loop, muteado, < 5 MB.
  - El componente lo referencia como `/hero.mp4` (ver `src/app/components/HeroBanner.tsx`, marcado con `// TODO`).
- `hero-poster.jpg` — imagen de respaldo (poster). Se muestra:
  - mientras el video carga,
  - si el video no existe todavía,
  - y SIEMPRE si el usuario activó "reducir movimiento" (`prefers-reduced-motion`).
  - Puedes reemplazarla por una toma fija que combine con tu video.
