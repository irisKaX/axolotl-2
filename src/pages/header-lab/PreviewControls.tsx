import { useId, useState } from "react";
import { HeaderControls, type HeaderVariant } from "../../app/HeaderControls";
import type { DisclosureProps } from "../../app/useDisclosure";
export type { HeaderVariant } from "../../app/HeaderControls";

export function PreviewControls({ variant, inline = false, disclosure }: { variant: HeaderVariant; inline?: boolean; disclosure?: DisclosureProps }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const prefix = `axolotl-lab-${useId().replace(/:/g, "")}`;
  return <HeaderControls variant={variant} layout={inline ? "inline" : "stacked"} openId={disclosure ? disclosure.openId : openId} setOpenId={disclosure?.setOpenId ?? setOpenId} idPrefix={prefix} />;
}
