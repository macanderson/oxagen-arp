"use client";
import { Dialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { Button } from "./button";

// A confirmation names the affected scope (brand spec). Built on base-ui's Dialog, which handles
// focus, Escape, and the accessible title for us.
export function ConfirmDialog({
  trigger, title, body, confirmLabel, destructive = false, onConfirm,
}: { trigger: ReactNode; title: string; body: string; confirmLabel: string; destructive?: boolean; onConfirm: () => void | Promise<void> }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant={destructive ? "destructive" : "secondary"} />}>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line bg-panel p-6">
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-body">{body}</Dialog.Description>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close render={<Button variant="ghost" />}>Keep going</Dialog.Close>
            <Dialog.Close render={<Button variant={destructive ? "destructive" : "primary"} onClick={() => void onConfirm()} />}>{confirmLabel}</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
