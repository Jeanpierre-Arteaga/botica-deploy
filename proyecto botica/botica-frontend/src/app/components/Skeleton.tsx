export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 2s infinite',
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col h-full"
      style={{
        backgroundColor: "var(--c-surface)",
        border: "1px solid var(--c-line)",
        boxShadow: "var(--elev-xs)",
      }}
    >
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3 mb-2" />
        <Skeleton className="h-6 w-24 mb-1" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-[1140px] mx-auto px-4 sm:px-5 py-6 md:py-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-64 mb-5" />

      <div className="grid lg:grid-cols-2 gap-7 lg:gap-12 mb-14">
        {/* Galería */}
        <div className="mx-auto w-full max-w-[470px]">
          <Skeleton className="w-full aspect-square rounded-[16px]" />
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-14 h-14 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Panel de compra + info */}
        <div className="max-w-xl">
          <div className="flex gap-2 mb-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-1.5" />
          <Skeleton className="h-4 w-5/6 mb-5" />
          <Skeleton className="h-8 w-44 mb-4" />
          <Skeleton className="h-12 w-full rounded-xl mb-5" />
          {/* Cantidad + CTA en una fila */}
          <div className="flex gap-3 mb-6">
            <Skeleton className="h-11 w-32 rounded-full" />
            <Skeleton className="h-11 flex-1 rounded-full" />
          </div>
          <div
            className="space-y-3 pt-5 border-t"
            style={{ borderColor: "var(--c-line)" }}
          >
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          {/* Acordeones (en la columna derecha) */}
          <div className="mt-6 space-y-2.5">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-8" />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="w-24 h-10" />
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <Skeleton className="h-6 w-32 mb-6" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-full mb-6" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
