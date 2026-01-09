import { useState } from "react";

export type ToastType = "success" | "error";

let setToastGlobal: (toast: ToastState) => void;

type ToastState = {
  message: string | null;
  type: ToastType;
};

export function useToastProvider() {
  const [toast, setToast] = useState<ToastState>({
    message: null,
    type: "success",
  });

  setToastGlobal = setToast;

  return {
    toast,
    clearToast: () =>
      setToast({ message: null, type: "success" }),
  };
}

export function useToast() {
  return {
    showToast(message: string, type: ToastType = "success") {
      if (!setToastGlobal) return;

      setToastGlobal({ message, type });

      setTimeout(() => {
        setToastGlobal({ message: null, type: "success" });
      }, 2500);
    },
  };
}
