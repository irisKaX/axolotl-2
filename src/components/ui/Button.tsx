import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ButtonHTMLAttributes } from "react";
export const cn = (...values: Parameters<typeof clsx>) =>
  twMerge(clsx(...values));
const styles = cva(
  "axolotl-button inline-flex items-center justify-center gap-2",
  {
    variants: {
      variant: {
        primary: "axolotl-button-primary",
        secondary: "axolotl-button-secondary",
        ghost: "axolotl-button-ghost",
      },
      size: {
        default: "",
        small: "axolotl-button-small",
        icon: "axolotl-button-icon",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof styles> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(styles({ variant, size }), className)}
      {...props}
    />
  );
}
