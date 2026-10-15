import { useId, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
export type CardSize = "S" | "M" | "L";
export function ToolCard({
  size,
  title,
  children,
  icon,
  footer,
}: {
  size: CardSize;
  title: string;
  children: ReactNode;
  icon?: IconName;
  footer?: ReactNode;
}) {
  const id = useId();
  return (
    <article
      className="axolotl-tool-card"
      data-axolotl-size={size}
      aria-labelledby={id}
    >
      <header className="axolotl-card-heading">
        <span className="axolotl-card-icon">
          {icon && <Icon name={icon} />}
        </span>
        <h3 id={id}>{title}</h3>
        <span className="axolotl-card-sample">Ukázka</span>
      </header>
      <div className="axolotl-card-content">{children}</div>
      {footer && <footer className="axolotl-card-footer">{footer}</footer>}
    </article>
  );
}
