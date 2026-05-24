import {
  Pill, Baby, Apple, Heart, Sparkles, Home, ShieldCheck,
  Wind, Thermometer, Droplet, Soup, HeartPulse, Activity,
  Package,
  type LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Pill, Baby, Apple, Heart, Sparkles, Home, ShieldCheck,
  Wind, Thermometer, Droplet, Soup, HeartPulse, Activity, Package,
};

interface CategoryIconProps {
  name?: string | null;
  className?: string;
  size?: number;
}

/**
 * Renderiza el icono de Lucide correspondiente al nombre.
 * Fallback seguro a Package si el nombre no existe.
 */
export function CategoryIcon({ name, className, size = 20 }: CategoryIconProps) {
  const Icon = (name && iconMap[name]) || Package;
  return <Icon className={className} size={size} />;
}
