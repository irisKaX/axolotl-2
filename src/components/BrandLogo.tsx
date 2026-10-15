import type { CSSProperties } from "react";
import mark from "../assets/brand/o2-mark.svg";

export function BrandLogo({ onNavigate }: { onNavigate: () => void }) {
  return (
    <a
      className="axolotl-logo-slot"
      id="axolotl-logo-slot"
      data-axolotl-slot="logo"
      href="#dashboard"
      aria-label="O₂ Axolotl – dashboard"
      title="O₂ Axolotl"
      onClick={onNavigate}
      style={{
        "--axolotl-logo-image": `url("${mark}")`,
      } as CSSProperties}
    >
      <span className="axolotl-logo-art" aria-hidden="true" />
    </a>
  );
}
