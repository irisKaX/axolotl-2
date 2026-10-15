import * as Primitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "../Icon";
export function Dialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{trigger}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Overlay className="axolotl-dialog-overlay" />
        <Primitive.Content className="axolotl-dialog">
          <Primitive.Title>{title}</Primitive.Title>
          <Primitive.Description>{description}</Primitive.Description>
          {children}
          <Primitive.Close asChild>
            <Button
              variant="ghost"
              size="icon"
              className="axolotl-dialog-close"
              aria-label="Zavřít dialog"
            >
              <Icon name="close" />
            </Button>
          </Primitive.Close>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
