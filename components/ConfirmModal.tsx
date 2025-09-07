"use client";
import React from "react";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({ open, title = "確認", message = "実行してもよろしいですか？", onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow-lg w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-700 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 border rounded">キャンセル</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">実行</button>
        </div>
      </div>
    </div>
  );
}
