"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { format as formatDate } from 'date-fns';
import Toast from "@/components/Toast";

type DoseRow = {
  id: number;
  user_id: string;
  medication_record_id: number | null;
  taken_at: string | null;
  note: string | null;
  created_at: string;
  medication_records?: {
    dosage?: string | null;
    usage?: string | null;
    medication_id?: number | null;
  } | null;
};

export default function DoseHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DoseRow[]>([]);
  const [toast, setToast] = useState<{ message: string; type?: "info" | "success" | "error" } | null>(null);

  // pagination/search state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [medNames, setMedNames] = useState<Record<string, string>>({});

  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [total, pageSize]);

  // pageInput removed: pagination now uses the existing navigation buttons only

  const timeSlotBadge = (val?: string | null) => {
    const defaultBadge = { label: '-', bg: 'bg-gray-200', text: 'text-gray-700' };
    if (!val) return defaultBadge;
    const s = String(val);
    // first check for explicit keywords
    if (s.includes('就寝前')) return { label: '就寝前', bg: 'bg-indigo-600', text: 'text-white' };
    if (s.includes('朝')) return { label: '朝', bg: 'bg-yellow-100', text: 'text-yellow-800' };
    if (s.includes('昼')) return { label: '昼', bg: 'bg-sky-100', text: 'text-sky-800' };
    if (s.includes('晩') || s.includes('夜')) return { label: '晩', bg: 'bg-gray-800', text: 'text-white' };

    // fallback: try to parse as ISO datetime
    try {
      const d = new Date(s);
      if (isNaN(d.getTime())) return defaultBadge;
      const h = d.getHours(); // local hour
      if (h >= 21 && h <= 23) return { label: '就寝前', bg: 'bg-indigo-600', text: 'text-white' };
      if (h >= 5 && h <= 11) return { label: '朝', bg: 'bg-yellow-100', text: 'text-yellow-800' };
      if (h >= 12 && h <= 16) return { label: '昼', bg: 'bg-sky-100', text: 'text-sky-800' };
      return { label: '晩', bg: 'bg-gray-800', text: 'text-white' };
    } catch (e) {
      return defaultBadge;
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("dose_history")
        .select("id, user_id, medication_record_id, taken_at, note, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.trim() !== "") {
        // basic server-side filter on note column. Additional client filtering below.
        query = query.ilike("note", `%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) {
        setToast({ message: "読み込みに失敗しました: " + error.message, type: "error" });
        setRows([]);
        setTotal(null);
      } else {
        const rows = (data as DoseRow[]) || [];
        // fetch related medication_records in batch to avoid nested relation
        const ids = Array.from(new Set(rows.map((r) => r.medication_record_id).filter(Boolean)));
        let medMap: Record<string, any> = {};
        if (ids.length > 0) {
          const { data: meds } = await supabase.from('medication_records').select('id,dosage,usage,medication_id').in('id', ids as any[]);
          if (meds) medMap = meds.reduce((acc: Record<string, any>, m: any) => { acc[String(m.id)] = m; return acc; }, {});
        }
        const merged = rows.map((r) => ({ ...r, medication_records: medMap[String(r.medication_record_id)] || null }));

        // collect medication ids from medication_records and fetch medication names
        const medicationIds = Array.from(new Set(merged.map((r) => r.medication_records?.medication_id).filter(Boolean)));
        let nameMap: Record<string, string> = {};
        if (medicationIds.length > 0) {
          const { data: meds } = await supabase.from('medications').select('id,name').in('id', medicationIds as any[]);
          if (meds) nameMap = meds.reduce((acc: Record<string, string>, m: any) => { acc[String(m.id)] = m.name || ''; return acc; }, {});
        }

        setRows(merged);
        setMedNames(nameMap);
        setTotal(count ?? rows.length);
      }
      setLoading(false);
    };
    load();
  }, [page, pageSize, search]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("dose_history").delete().eq("id", id);
    if (error) setToast({ message: "削除に失敗しました: " + error.message, type: "error" });
    else {
      setToast({ message: "削除しました", type: "success" });
      // reload current page
      const newRows = rows.filter((r) => r.id !== id);
      setRows(newRows);
      // If rows now empty and page > 1, go back one page to avoid empty view
      if (newRows.length === 0 && page > 1) setPage(page - 1);
    }
  };

  if (loading) return <div className="p-8">読み込み中...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">服薬履歴</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="ノートで検索"
            className="border px-3 py-2 rounded w-64"
            aria-label="検索"
          />
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="border px-2 py-2 rounded"
            aria-label="ページサイズ"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">合計: {total ?? 0} 件 / {totalPages} ページ</div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 bg-white rounded shadow">該当する記録がありません。</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">日付</th>
                <th className="p-3">時間帯</th>
                <th className="p-3">薬品名</th>
                <th className="p-3">用量</th>
                <th className="p-3">ノート</th>
                <th className="p-3">アクション</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 align-top">{(() => { try { return formatDate(new Date(r.taken_at ?? r.created_at), 'yyyy-MM-dd'); } catch { return r.taken_at ?? r.created_at; } })()}</td>
                  <td className="p-3 align-top">
                    {(() => {
                      // Prefer the prescribed/use 'usage' string when determining time slot.
                      const usageVal = (r as any).medication_records?.usage;
                      const s = timeSlotBadge(usageVal ?? r.taken_at ?? r.created_at);
                      return (
                        <div className={`inline-block px-2 py-1 rounded text-sm ${s.bg} ${s.text}`}>{s.label}</div>
                      );
                    })()}
                  </td>
                  <td className="p-3 align-top">{medNames[String(r.medication_records?.medication_id)] ?? (r.medication_records?.medication_id ? String(r.medication_records.medication_id) : '-')}</td>
                  <td className="p-3 align-top">{r.medication_records?.dosage ?? "-"} / {r.medication_records?.usage ?? "-"}</td>
                  <td className="p-3 align-top">{r.note ?? "-"}</td>
                  <td className="p-3 align-top">
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(r.id)} className="px-3 py-1 bg-red-600 text-white rounded">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">最初へ</button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            前へ
          </button>
          <span className="text-sm">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            次へ
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">最後へ</button>
          {/* direct page input removed; use navigation buttons to change pages */}
        </div>

        <div className="text-sm text-gray-600">現在の件数: {rows.length} 件</div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
