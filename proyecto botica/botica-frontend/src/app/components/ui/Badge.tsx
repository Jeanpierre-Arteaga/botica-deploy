import { HTMLAttributes } from "react";

type BadgeVariant = "pending" | "processing" | "ready" | "delivered" | "cancelled" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  const variantStyles = {
    pending: "bg-[#FEF3C7] text-[#F59E0B] border-[#FDE68A]",
    processing: "bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]",
    ready: "bg-[#D1FAE5] text-[#16A34A] border-[#A7F3D0]",
    delivered: "bg-[#D1FAE5] text-[#16A34A] border-[#A7F3D0]",
    cancelled: "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]",
    default: "bg-[#F9FAFB] text-[#4A5260] border-[#E5E7EB]",
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
