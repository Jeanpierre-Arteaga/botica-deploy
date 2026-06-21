import { Link } from "react-router";
import { BookOpen, ArrowLeft } from "lucide-react";

export function LibroReclamaciones() {
  return (
    <div style={{ backgroundColor: "var(--c-bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium mb-8 transition-colors"
          style={{ color: "var(--c-brand)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "var(--c-brand-soft)" }}
          >
            <BookOpen className="w-7 h-7" style={{ color: "var(--c-brand)" }} />
          </div>
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-display)" }}
            >
              Libro de Reclamaciones
            </h1>
            <p className="text-sm" style={{ color: "var(--c-faint)" }}>
              Conforme a Ley N° 29571 — Código de Protección y Defensa del Consumidor
            </p>
          </div>
        </div>

        <div
          className="rounded-2xl p-8 md:p-10 border"
          style={{
            backgroundColor: "var(--c-surface)",
            borderColor: "var(--c-line)",
            boxShadow: "var(--elev-soft)",
          }}
        >
          <div className="prose max-w-none" style={{ color: "var(--c-text)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              ¿Qué es el Libro de Reclamaciones?
            </h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>
              El Libro de Reclamaciones es un documento de naturaleza física o virtual
              provisto por los proveedores en el cual los consumidores podrán registrar
              quejas o reclamos sobre los productos o servicios ofrecidos.
            </p>

            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Definiciones
            </h2>
            <ul className="space-y-3 mb-6 text-sm" style={{ color: "var(--c-muted)" }}>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: "var(--c-brand)" }}>Reclamo:</span>
                <span>
                  Disconformidad relacionada a los productos o servicios adquiridos,
                  cuando el consumidor considera que no se cumplió con lo ofrecido.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold" style={{ color: "var(--c-brand)" }}>Queja:</span>
                <span>
                  Disconformidad no relacionada al producto o servicio en sí, sino
                  a la atención al público o proceso de venta.
                </span>
              </li>
            </ul>

            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              ¿Cómo presentar un reclamo?
            </h2>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>
              Puede presentar su reclamo a través de los siguientes canales:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                {
                  title: "Presencial",
                  desc: "Visite cualquiera de nuestras sedes y solicite el Libro de Reclamaciones físico.",
                },
                {
                  title: "Virtual",
                  desc: "Envíe un correo a reclamaciones@boticascentral.com con sus datos y detalle del reclamo.",
                },
              ].map((channel) => (
                <div
                  key={channel.title}
                  className="p-5 rounded-xl border"
                  style={{
                    borderColor: "var(--c-line-2)",
                    backgroundColor: "var(--c-bg)",
                  }}
                >
                  <h3 className="font-semibold text-sm mb-2" style={{ color: "var(--c-text)" }}>
                    {channel.title}
                  </h3>
                  <p className="text-xs" style={{ color: "var(--c-muted)" }}>
                    {channel.desc}
                  </p>
                </div>
              ))}
            </div>

            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: "var(--font-display)" }}>
              Plazo de respuesta
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--c-muted)" }}>
              El proveedor dará respuesta al reclamo en un plazo máximo de treinta (30)
              días calendario, pudiendo extenderse por treinta (30) días calendario
              adicionales cuando la naturaleza del reclamo lo amerite. En caso de quejas,
              la respuesta será dentro de los mismos plazos establecidos.
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: "var(--c-faint)" }}>
          Boticas Central — RUC: 20XXXXXXXXX | Razón Social: Boticas Central S.A.C.
        </p>
      </div>
    </div>
  );
}
