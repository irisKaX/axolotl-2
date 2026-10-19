import {
  cloneElement,
  useId,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type HTMLAttributes,
  type Ref,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  FloatingFocusManager,
  FloatingPortal,
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { X } from "lucide-react";
import { Button } from "../Button";
import { Alert } from "./Feedback";
import { useDesignSystem } from "./Provider";
type DialogProps = {
  trigger: ReactElement;
  title: string;
  description: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: "medium" | "large";
  role?: "dialog" | "alertdialog";
  initialFocus?: React.RefObject<HTMLElement | null>;
  busy?: boolean;
};
export function Dialog({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
  size = "medium",
  role = "dialog",
  initialFocus,
  busy = false,
}: DialogProps) {
  const env = useDesignSystem(),
    content = useRef<HTMLDivElement>(null),
    [localOpen, setLocalOpen] = useState(false);
  return (
    <DialogPrimitive.Root
      open={open ?? localOpen}
      onOpenChange={(v) => {
        if (busy) return;
        if (
          !v &&
          content.current?.querySelector(
            '[data-ds-select-trigger][data-state="open"], [data-ds-popover-trigger][aria-expanded="true"]',
          )
        )
          return;
        setLocalOpen(v);
        onOpenChange?.(v);
      }}
    >
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal container={env.portal ?? undefined}>
        <DialogPrimitive.Overlay className="ds-dialog-overlay" />
        <DialogPrimitive.Content
          ref={content}
          data-ds-modal
          className="axo-ds-scope ds-dialog"
          data-theme={env.theme}
          data-motion={env.reducedMotion ? "reduced" : "full"}
          data-size={size}
          role={role}
          onOpenAutoFocus={(e) => {
            if (initialFocus?.current) {
              e.preventDefault();
              initialFocus.current.focus();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (busy || role === "alertdialog") e.preventDefault();
          }}
        >
          <header>
            <div>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                {description}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                variant="icon"
                size="small"
                icon={<X />}
                aria-label="Zavřít dialog"
                disabled={busy}
              />
            </DialogPrimitive.Close>
          </header>
          <div className="ds-dialog-body">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
export function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmLabel = "Potvrdit",
  onConfirm,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const cancel = useRef<HTMLButtonElement>(null);
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      setError("Akci se nepodařilo dokončit. Zkus ji znovu.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      trigger={trigger}
      title={title}
      description={description}
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        setError("");
      }}
      role="alertdialog"
      initialFocus={cancel}
      busy={busy}
    >
      {error && (
        <Alert tone="error" title="Akce se nezdařila">
          {error}
        </Alert>
      )}
      <div className="ds-actions">
        <Button ref={cancel} disabled={busy} onClick={() => setOpen(false)}>
          Zrušit
        </Button>
        <Button variant="destructive" loading={busy} onClick={confirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
export function Popover({
  trigger,
  title,
  children,
}: {
  trigger: ReactElement;
  title: string;
  children: ReactNode;
}) {
  const env = useDesignSystem(),
    id = useId();
  const [open, setOpen] = useState(false);
  const floating = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([
    useClick(floating.context),
    useDismiss(floating.context, { bubbles: false }),
    useRole(floating.context, { role: "dialog" }),
  ]);
  const parentDialog = floating.elements.domReference?.closest(
    "[data-ds-modal]",
  ) as HTMLElement | null;
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        !floating.elements.floating?.contains(event.target as Node)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    };
    window.addEventListener("keydown", escape, true);
    return () => window.removeEventListener("keydown", escape, true);
  }, [open, floating.elements.floating]);
  const element = trigger as ReactElement<
    HTMLAttributes<HTMLElement> & {
      ref?: Ref<HTMLElement>;
      "data-ds-popover-trigger"?: string;
    }
  >;
  return (
    <>
      {cloneElement(element, {
        ...getReferenceProps(element.props),
        ref: floating.refs.setReference,
        "data-ds-popover-trigger": "",
      })}
      {open && (
        <FloatingPortal root={parentDialog ?? env.portal}>
          <FloatingFocusManager
            context={floating.context}
            modal={false}
            returnFocus
          >
            <div
              {...getFloatingProps()}
              ref={floating.refs.setFloating}
              style={floating.floatingStyles}
              className="axo-ds-scope ds-popover"
              data-theme={env.theme}
              data-motion={env.reducedMotion ? "reduced" : "full"}
              aria-labelledby={id}
            >
              <header>
                <h3 id={id}>{title}</h3>
                <Button
                  variant="icon"
                  size="small"
                  icon={<X />}
                  aria-label="Zavřít popover"
                  onClick={() => setOpen(false)}
                />
              </header>
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
export function Tooltip({
  children,
  text,
}: {
  children: ReactElement;
  text: string;
}) {
  const env = useDesignSystem();
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal container={env.portal ?? undefined}>
          <TooltipPrimitive.Content
            className="axo-ds-scope ds-tooltip"
            data-theme={env.theme}
            data-motion={env.reducedMotion ? "reduced" : "full"}
            sideOffset={8}
            collisionPadding={12}
          >
            {text}
            <TooltipPrimitive.Arrow className="ds-tooltip-arrow" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
