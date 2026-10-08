"use client";

import { useEffect } from "react";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-navy">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy focus:border-petrol focus:outline-none focus:ring-1 focus:ring-petrol";
export const labelCls = "mb-1 block text-xs font-semibold text-gray-600";
export const primaryBtn =
  "rounded-lg bg-petrol px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50";
export const secondaryBtn =
  "rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-navy hover:bg-gray-100";
export const dangerBtn =
  "rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50";
