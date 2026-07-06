import Link from "next/link";
import type { ComponentProps } from "react";
import {
  BUTTON_VARIANT_CLASS,
  BUTTON_SIZE_CLASS,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/ui/Button";

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const base =
    variant === "ghost"
      ? "font-medium transition-colors inline-block"
      : "rounded-md font-medium transition-colors inline-block";

  return (
    <Link
      className={`${base} ${BUTTON_VARIANT_CLASS[variant]} ${
        variant === "ghost" ? "" : BUTTON_SIZE_CLASS[size]
      } ${className}`}
      {...props}
    />
  );
}
