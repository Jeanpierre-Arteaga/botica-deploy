import { HTMLAttributes } from "react";

type BadgeVariant = "pending" | "processing" | "ready" | "delivered" | "cancelled" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  const variantStyles = {
    pending: "bg-warning-soft text-warning border-warning/30",
    processing: "bg-info-soft text-info border-info/30",
    ready: "bg-success-soft text-success border-success/30",
    delivered: "bg-success-soft text-success border-success/30",
    cancelled: "bg-error-soft text-error border-error/30",
    default: "bg-surface-2 text-muted border-line",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
