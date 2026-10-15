import type { CSSProperties } from "react";
import logo from "../assets/brand/axolotl-logo.svg";
import symbol from "../assets/brand/axolotl-symbol.svg";

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
        "--axolotl-logo-image": `url("${logo}")`,
        "--axolotl-logo-symbol": `url("${symbol}")`,
      } as CSSProperties}
    >
      <span className="axolotl-logo-art" aria-hidden="true" />
    </a>
  );
}
