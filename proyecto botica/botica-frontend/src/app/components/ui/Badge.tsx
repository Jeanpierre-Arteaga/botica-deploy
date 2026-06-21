import { HTMLAttributes } from "react";

type BadgeVariant = "pending" | "processing" | "ready" | "delivered" | "cancelled" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  const variantStyles = {
    pending: "bg-warning-soft text-[#B45309] border-[#FDE68A]",
    processing: "bg-info-soft text-[#1D4ED8] border-[#BFDBFE]",
    ready: "bg-success-soft text-[#15803D] border-[#A7F3D0]",
    delivered: "bg-success-soft text-[#15803D] border-[#A7F3D0]",
    cancelled: "bg-error-soft text-[#B91C1C] border-[#FECACA]",
    default: "bg-[#F1F5F9] text-muted border-line",
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
