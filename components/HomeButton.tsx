"use client";
import Link from "next/link";
import React from "react";

type Props = {
  className?: string;
  label?: string;
};

export default function HomeButton({ className = "", label = "ホーム" }: Props) {
  return (
    <Link href="/" aria-label="ホームへ戻る" className={`inline-flex items-center px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-400 ${className}`}>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10.707 1.707a1 1 0 00-1.414 0L1 9v8a1 1 0 001 1h5a1 1 0 001-1v-4h2v4a1 1 0 001 1h5a1 1 0 001-1V9l-8.293-7.293z" />
      </svg>
      <span className="sr-only">{label}</span>
    </Link>
  );
}
