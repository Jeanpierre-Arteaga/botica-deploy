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
          <label className="block mb-2 text-sm font-medium text-[#4A5260]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full h-11 px-4 rounded-[10px] border ${
            error
              ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]"
              : "border-[#E5E7EB] focus:ring-2 focus:ring-[#F26430]/20 focus:border-[#F26430]"
          } transition-all outline-none ${
            props.disabled ? "bg-[#F9FAFB] cursor-not-allowed" : "bg-white"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[#DC2626]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-[#9CA3AF]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
