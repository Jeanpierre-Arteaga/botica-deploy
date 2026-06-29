import * as SliderPrimitive from "@radix-ui/react-slider";

/**
 * PriceRangeSlider — control de RANGO de precio (dos manijas) coherente con la
 * marca: pista neutra, rango activo en naranja y manijas blancas con borde de
 * acento. Construido sobre el primitivo accesible de Radix (soporta teclado y
 * lectores de pantalla por defecto).
 *
 * El `max` es DINÁMICO: lo fija quien lo usa según el producto más caro de la
 * sección/categoría filtrada. Es un control controlado: `value` es [min, max]
 * y `onChange` se dispara mientras se arrastra.
 */
export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  ariaLabel = "Rango de precio",
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  ariaLabel?: string;
}) {
  return (
    <SliderPrimitive.Root
      className="relative flex w-full touch-none select-none items-center py-2"
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={0}
      value={value}
      onValueChange={(v) => onChange([v[0], v[1] ?? v[0]] as [number, number])}
      aria-label={ariaLabel}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-line">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-brand" />
      </SliderPrimitive.Track>
      {[0, 1].map((i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={i === 0 ? "Precio mínimo" : "Precio máximo"}
          className="block w-4 h-4 rounded-full bg-surface border-2 border-brand shadow-sm transition-colors hover:bg-brand-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
