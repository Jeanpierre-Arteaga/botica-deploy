// ============================================================
// PasswordInput — campo de contraseña con botón mostrar/ocultar (ojo)
// ============================================================
// Reutilizable en el login (admin/staff) y en el modal de perfil. Mantiene el
// estilo del input que recibe por `inputClassName` y solo añade el botón-ojo a
// la derecha. Accesible: el botón tiene aria-label y aria-pressed.
// ============================================================

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Clase del <input> (estilos de la pantalla que lo usa). */
  inputClassName?: string;
}

export function PasswordInput({ inputClassName = '', ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? 'text' : 'password'}
        className={`${inputClassName} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={show}
        title={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-0 top-0 flex h-full items-center rounded-r-xl px-3 text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:text-brand focus-visible:ring-2 focus-visible:ring-brand"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}
