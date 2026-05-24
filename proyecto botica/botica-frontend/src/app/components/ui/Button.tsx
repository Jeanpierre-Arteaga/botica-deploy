import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      iconLeft: IconLeft,
      iconRight: IconRight,
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary:
        "bg-[#F26430] text-white hover:bg-[#D94E1F] active:scale-[0.98] shadow-sm hover:shadow-md",
      secondary:
        "border-2 border-[#1E4D8C] text-[#1E4D8C] hover:bg-[#EFF4FB] active:scale-[0.98]",
      ghost: "text-[#4A5260] hover:bg-[#F9FAFB] active:scale-[0.98]",
      danger:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:scale-[0.98] shadow-sm hover:shadow-md",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-sm rounded-[10px]",
      md: "h-10 px-4 text-sm rounded-[10px]",
      lg: "h-12 px-6 text-base rounded-[10px]",
    };

    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
          fullWidth ? "w-full" : ""
        } ${className}`}
        {...props}
      >
        {loading ? (
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizes[size]}`} />
        ) : (
          <>
            {IconLeft && <IconLeft className={iconSizes[size]} />}
            {children}
            {IconRight && <IconRight className={iconSizes[size]} />}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
