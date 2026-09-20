import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// One gold primary action per screen. Stop is destructive and never gold. Every state carries a word.
export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-gold text-ink hover:brightness-95",
        secondary: "border border-line bg-panel text-ink hover:bg-raised",
        ghost: "text-body hover:bg-raised",
        destructive: "border border-failed text-failed hover:bg-raised",
      },
      size: { md: "min-h-11 px-4", sm: "min-h-9 px-3 text-sm" },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
