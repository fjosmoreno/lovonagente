"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  variant?: "full" | "icon";
}

/**
 * Official Lovon logo component.
 * Uses /lovon-logo.jpg (the official brand logo with L icon + LOVON text + tagline).
 */
export function Logo({ className, size = 40, showText = false, variant = "icon" }: LogoProps) {
  if (variant === "full" || showText) {
    return (
      <img
        src="/lovon-logo.jpg"
        alt="Lovon"
        width={size * 2}
        height={size}
        className={cn("object-contain", className)}
        style={{ height: size }}
      />
    );
  }
  return (
    <img
      src="/lovon-logo.jpg"
      alt="Lovon"
      width={size}
      height={size}
      className={cn("object-contain rounded-lg", className)}
      style={{ width: size, height: size }}
    />
  );
}
