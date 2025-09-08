"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import HomeButton from '@/components/HomeButton';
import Toast from "@/components/Toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { formatUsage, formatDosage } from '@/lib/medFormat';

type MedRecord = {
  id: string;
  dosage?: string | null;
  usage?: string | null;
  prescribed_at?: string | null;
  doctor?: string | null;
  hospital?: string | null;
  pharmacy?: string | null;
  medications?: { name?: string | null } | null;
};

export default function MedicationsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MedRecord[]>([]);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState(String(1));
  const perPage = 10;

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("medication_records")
        .select(
          `id,dosage,usage,prescribed_at,doctor,hospital,pharmacy,medications(name)`
        )
        .eq("user_id", user.id)
        .order("prescribed_at", { ascending: false });

      if (error) {
        console.error("Failed to load medication records:", error.message);
      } else {
        setRecords((data as MedRecord[]) || []);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const filtered = records.filter((r) => {
    const name = r.medications?.name || "";
    return (
      name.toLowerCase().includes(query.toLowerCase()) ||
      (r.usage || "").toLowerCase().includes(query.toLowerCase())
    );
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  // keep pageInput in sync when page changes
  React.useEffect(() => setPageInput(String(page)), [page]);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">処方一覧</h1>
            <div className="text-sm text-gray-500">合計 {records.length} 件</div>
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/medications/new" className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400">
              新しいお薬を登録
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="薬剤名・用法で検索"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
        </div>

  {loading ? (
          <div className="text-center py-12">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            登録された処方記録がありません。 &nbsp;
            <Link href="/medications/new" className="text-sky-600 underline">
              新規登録
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paged.map((r) => (
                <li key={r.id} className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <Link href={`/medications/${r.id}`} className="block">
                    <div className="flex items-start justify-between">
                          <div>
                            <div className="text-lg font-semibold text-sky-600">{r.medications?.name || "(名前なし)"}</div>
                            <div className="mt-2 text-sm text-gray-700">
                              <div><span className="font-semibold">用法</span>: {formatUsage(r.usage)}</div>
                              <div><span className="font-semibold">用量</span>: {formatDosage(r.dosage)}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 text-right">
                            <div>{r.prescribed_at ? (() => { try { return format(new Date(r.prescribed_at), 'yyyy-MM-dd'); } catch { return r.prescribed_at; } })() : "日付なし"}</div>
                            <div className="text-xs text-gray-400">処方日</div>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-gray-700">
                          <div><span className="font-semibold">医師</span>: {r.doctor || '-'}</div>
                          <div><span className="font-semibold">医療機関</span>: {r.hospital || '-'}</div>
                          <div><span className="font-semibold">薬局</span>: {r.pharmacy || '-'}</div>
                        </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">合計 {total} 件</div>
              <div className="flex gap-2 items-center">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 border rounded">最初へ</button>
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1 border rounded">前へ</button>
                <div className="px-3 py-1">{page} / {totalPages}</div>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded">次へ</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 border rounded">最後へ</button>
                <div className="flex items-center gap-2">
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </main>
  );
}
