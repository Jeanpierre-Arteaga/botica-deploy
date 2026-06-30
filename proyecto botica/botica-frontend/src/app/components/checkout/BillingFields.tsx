// ============================================================
// BillingFields — Datos fiscales para "Factura" (RUC + Razón social)
// ============================================================
// Componente COMPARTIDO entre el checkout del cliente (pasarela de pago) y el
// POS "Nueva venta" del staff, para no duplicar la lógica/validación. Validación
// en vivo (sin servicios externos): el error aparece al salir del campo y se
// actualiza mientras se corrige. RUC: 11 dígitos + prefijo válido (10/15/16/17/
// 20) + dígito verificador (módulo 11). Razón social: texto libre requerido.
// Orden: primero RUC, luego Razón social.
// ============================================================

import { useState } from 'react';
import { Building2, CheckCircle2 } from 'lucide-react';
import { rucError, billingNameError, sanitizeRuc } from '../../lib/billing';

interface BillingFieldsProps {
  ruc: string;
  setRuc: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  /** id único por contexto, para no chocar si hay dos instancias en la página. */
  idPrefix?: string;
}

export function BillingFields({ ruc, setRuc, name, setName, idPrefix = 'billing' }: BillingFieldsProps) {
  const [rucTouched, setRucTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const rucErr = rucError(ruc);
  const nameErr = billingNameError(name);
  const rucOk = rucErr === null;

  const showRucErr = rucTouched && rucErr;
  const showNameErr = nameTouched && nameErr;

  const rucId = `${idPrefix}-ruc`;
  const nameId = `${idPrefix}-name`;

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4 animate-fade-in-up">
      <h4 className="font-semibold text-text mb-1 flex items-center gap-2">
        <Building2 size={16} className="text-secondary-brand" />
        Datos de facturación
      </h4>
      <p className="text-xs text-muted mb-4">
        Necesarios para emitir la factura a nombre de la empresa.
      </p>

      <div className="space-y-4">
        {/* 1 · RUC */}
        <div>
          <label htmlFor={rucId} className="block text-sm font-medium text-text mb-1">
            RUC <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              id={rucId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={ruc}
              onChange={(e) => setRuc(sanitizeRuc(e.target.value))}
              onBlur={() => setRucTouched(true)}
              maxLength={11}
              placeholder="20512345678"
              aria-invalid={!!showRucErr}
              aria-describedby={`${rucId}-help ${rucId}-error`}
              className={`w-full h-11 px-3 pr-10 border rounded-md tabular-nums tracking-wide focus:outline-none focus:ring-2 ${
                showRucErr
                  ? 'border-error focus:ring-error/40'
                  : 'border-line focus:ring-brand'
              }`}
            />
            {rucOk && ruc.length === 11 && (
              <CheckCircle2
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-success"
                aria-hidden="true"
              />
            )}
          </div>
          {showRucErr ? (
            <p id={`${rucId}-error`} className="mt-1 text-xs text-error" role="alert">
              {rucErr}
            </p>
          ) : (
            <p id={`${rucId}-help`} className="mt-1 text-xs text-muted">
              Ingresa el RUC de 11 dígitos de la empresa.
            </p>
          )}
        </div>

        {/* 2 · Razón social */}
        <div>
          <label htmlFor={nameId} className="block text-sm font-medium text-text mb-1">
            Razón social <span className="text-error">*</span>
          </label>
          <input
            id={nameId}
            type="text"
            autoComplete="organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            maxLength={200}
            placeholder="Mi Empresa S.A.C."
            aria-invalid={!!showNameErr}
            aria-describedby={`${nameId}-help ${nameId}-error`}
            className={`w-full h-11 px-3 border rounded-md focus:outline-none focus:ring-2 ${
              showNameErr
                ? 'border-error focus:ring-error/40'
                : 'border-line focus:ring-brand'
            }`}
          />
          {showNameErr ? (
            <p id={`${nameId}-error`} className="mt-1 text-xs text-error" role="alert">
              {nameErr}
            </p>
          ) : (
            <p id={`${nameId}-help`} className="mt-1 text-xs text-muted">
              Nombre legal de la empresa, tal como figura en SUNAT.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
