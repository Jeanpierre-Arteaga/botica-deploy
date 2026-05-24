import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/Button";
import { Link } from "react-router";

const banners = [
  {
    id: 1,
    title: "Ofertas de la semana",
    subtitle: "Hasta 30% de descuento en medicamentos seleccionados",
    bgColor: "#FFF4EE",
    cta: "Ver ofertas",
    link: "/catalogo?tipo=ofertas"
  },
  {
    id: 2,
    title: "Cuida tu salud",
    subtitle: "Vitaminas y suplementos al mejor precio",
    bgColor: "#EFF4FB",
    cta: "Ver vitaminas",
    link: "/catalogo?categoria=vitaminas"
  },
  {
    id: 3,
    title: "Delivery gratis",
    subtitle: "En compras mayores a S/ 50",
    bgColor: "#FFF4EE",
    cta: "Comprar ahora",
    link: "/catalogo"
  }
];

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }
    }, 6000);
  };

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    startAutoPlay();
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
    startAutoPlay();
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    startAutoPlay();
  };

  return (
    <div
      className="relative w-full h-[280px] md:h-[420px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="relative h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundColor: banner.bgColor }}
          >
            <div className="relative h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-center">
              <div className="text-center max-w-3xl">
                <h2 className="text-[28px] md:text-[48px] font-bold leading-[1.1] mb-4 text-[#1A1F2E]">
                  {banner.title}
                </h2>
                <p className="text-base md:text-[18px] text-[#4A5260] mb-8 leading-[1.5]">
                  {banner.subtitle}
                </p>
                <Link to={banner.link}>
                  <Button variant="primary" size="lg">
                    {banner.cta}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-10"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-[#1A1F2E]" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-2 md:p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-10"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#1A1F2E]" />
      </button>

      {/* Pill Indicators */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-[#F26430] w-8'
                : 'bg-white/60 hover:bg-white/80 w-2'
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
