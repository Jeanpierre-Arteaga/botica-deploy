import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "ghost"
  | "danger"
  | "danger-outline";
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
        "bg-brand text-white hover:bg-brand-hover active:scale-[0.98] shadow-soft hover:shadow-[var(--shadow-brand)]",
      secondary:
        "border border-line text-ink-2 bg-surface hover:bg-[#F8FAFC] hover:border-[#CBD5E1] active:scale-[0.98]",
      success:
        "bg-success text-white hover:brightness-110 active:scale-[0.98] shadow-soft hover:shadow-md",
      info:
        "bg-info text-white hover:brightness-110 active:scale-[0.98] shadow-soft hover:shadow-md",
      ghost: "text-muted hover:bg-[#F1F5F9] hover:text-ink-2 active:scale-[0.98]",
      danger:
        "bg-error text-white hover:bg-[#B91C1C] active:scale-[0.98] shadow-soft hover:shadow-md",
      "danger-outline":
        "border border-error/50 text-error bg-surface hover:bg-error-soft hover:border-error active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-sm rounded-[10px]",
      md: "h-10 px-4 text-sm rounded-xl",
      lg: "h-12 px-6 text-base rounded-xl",
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
