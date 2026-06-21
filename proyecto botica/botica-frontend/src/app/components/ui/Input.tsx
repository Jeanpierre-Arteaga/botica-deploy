import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-11 px-4 rounded-xl border text-text placeholder:text-faint ${
            error
              ? "border-error focus:ring-2 focus:ring-[#DC2626]/20 focus:border-error"
              : "border-line focus:ring-2 focus:ring-[#F15A29]/25 focus:border-brand"
          } transition-all outline-none ${
            props.disabled ? "bg-[#F1F5F9] cursor-not-allowed" : "bg-surface"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-faint">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
