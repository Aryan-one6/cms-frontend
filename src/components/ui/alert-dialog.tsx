import React, { createContext, useContext } from "react";
import { createPortal } from "react-dom";

type AlertDialogContextType = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

const AlertDialogContext = createContext<AlertDialogContextType | null>(null);

type AlertDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) throw new Error("AlertDialog subcomponents must be used within AlertDialog");
  return ctx;
}

export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  const { open, onOpenChange } = useAlertDialog();
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange?.(false)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
        {children}
      </div>
    </div>,
    document.body
  );
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1 pb-2">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-slate-900">{children}</h2>;
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600">{children}</p>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex items-center justify-end gap-2">{children}</div>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode };

export function AlertDialogCancel({ children, ...props }: ButtonProps) {
  const { onOpenChange } = useAlertDialog();
  return (
    <button
      {...props}
      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
      onClick={(e) => {
        props.onClick?.(e);
        onOpenChange?.(false);
      }}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ children, ...props }: ButtonProps) {
  const { onOpenChange } = useAlertDialog();
  return (
    <button
      {...props}
      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800"
      onClick={(e) => {
        props.onClick?.(e);
        onOpenChange?.(false);
      }}
    >
      {children}
    </button>
  );
}
