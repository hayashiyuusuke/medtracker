"use client";
import React, { useEffect } from "react";

type Props = { message: string; type?: "info" | "success" | "error"; onClose?: () => void };

export default function Toast({ message, type = "info", onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow text-white ${type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-red-600' : 'bg-sky-600'}`}>
      {message}
    </div>
  );
}
