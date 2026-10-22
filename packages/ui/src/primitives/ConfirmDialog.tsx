"use client";

import { useEffect, useId, useRef, type ReactNode, type SyntheticEvent } from "react";
import { Button } from "./Button";
import { classNames } from "./classNames";

export type ConfirmDialogTone = "primary" | "danger";

export type ConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  tone?: ConfirmDialogTone;
  busy?: boolean;
  error?: ReactNode;
  className?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  busyLabel = "Memproses…",
  tone = "primary",
  busy = false,
  error,
  className,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const id = useId().replaceAll(":", "");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && !dialog.contains(active) ? active : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      requestAnimationFrame(() => {
        const opener = openerRef.current;
        if (opener && opener.isConnected && !opener.hasAttribute("disabled")) opener.focus();
        openerRef.current = null;
      });
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const activeDialog = dialog as HTMLDialogElement;

    function handleTabKey(event: KeyboardEvent) {
      if (!activeDialog.open || event.key !== "Tab") return;

      const focusable = Array.from(
        activeDialog.querySelectorAll<HTMLElement>(
          'a[href]:not([tabindex="-1"]),area[href]:not([tabindex="-1"]),button:not(:disabled):not([tabindex="-1"]),input:not(:disabled):not([type="hidden"]):not([tabindex="-1"]),select:not(:disabled):not([tabindex="-1"]),textarea:not(:disabled):not([tabindex="-1"]),[tabindex]:not([tabindex="-1"]),[contenteditable="true"]',
        ),
      ).filter((element) =>
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== "hidden" &&
        !element.closest('[aria-hidden="true"], [inert]'),
      );

      if (focusable.length === 0) {
        event.preventDefault();
        activeDialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outsideDialog = !activeDialog.contains(active) || active === activeDialog;

      if (event.shiftKey && (outsideDialog || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (outsideDialog || active === last)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTabKey, true);
    return () => document.removeEventListener("keydown", handleTabKey, true);
  }, [open]);

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    if (busy) {
      event.preventDefault();
      return;
    }
    onOpenChange(false);
  }

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={busy}
      className={classNames("eol-dialog", className)}
      onCancel={handleCancel}
    >
      <h2 id={`${id}-title`} className="eol-dialog__title">{title}</h2>
      <div id={`${id}-description`} className="eol-dialog__description">{description}</div>
      {error ? <p className="eol-dialog__error" role="alert">{error}</p> : null}
      <div className="eol-dialog__actions">
        <Button variant="secondary" disabled={busy} onClick={() => onOpenChange(false)}>
          {cancelLabel}
        </Button>
        <Button variant={tone === "danger" ? "danger" : "primary"} disabled={busy} onClick={onConfirm}>
          {busy ? busyLabel : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
