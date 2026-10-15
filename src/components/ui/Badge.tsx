import type { ReactNode } from "react";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  return (
    <span className={`axolotl-badge axolotl-badge-${tone}`}>{children}</span>
  );
}
