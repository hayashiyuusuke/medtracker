// app/page.tsx
"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { format as formatDate } from 'date-fns';

function RecentWidget() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // fetch dose_history rows without nested relation to avoid schema cache errors
      const { data } = await supabase
        .from('dose_history')
        .select('id, taken_at, note, created_at, medication_record_id')
        .order('created_at', { ascending: false })
        .limit(3);
      if (!mounted || !data) {
        setRows([]);
        setLoading(false);
        return;
      }

      // collect medication_record_ids and batch fetch medication_records
      const ids = Array.from(new Set(data.map((d: any) => d.medication_record_id).filter(Boolean)));
      let medMap: Record<string, any> = {};
      if (ids.length > 0) {
        const { data: meds } = await supabase.from('medication_records').select('id,dosage,usage,medications').in('id', ids);
        if (meds) {
          medMap = meds.reduce((acc: Record<string, any>, m: any) => {
            acc[String(m.id)] = m;
            return acc;
          }, {});
        }
      }

      const merged = data.map((d: any) => ({ ...d, medication_records: medMap[String(d.medication_record_id)] || null }));
      setRows(merged);
      setLoading(false);
    };
    load();
    return () => { mounted = false };
  }, []);

  if (loading) return <div>読み込み中...</div>;
  if (rows.length === 0) return <div>直近の服薬記録はありません。</div>;

  return (
    <div className="mt-6 grid gap-2">
      {rows.map(r => (
        <div key={r.id} className="p-3 bg-white rounded shadow text-left">
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700">{(() => { try { return formatDate(new Date(r.taken_at ?? r.created_at), 'yyyy-MM-dd'); } catch { return r.taken_at ?? r.created_at; } })()}</div>
            {(() => {
              // time slot badge: accept explicit strings or ISO datetimes
              const usageVal = r.medication_records?.usage;
              const val = usageVal ?? r.taken_at ?? r.created_at;
              const s = String(val || '');
              if (s.includes('就寝前')) return <div className="inline-block px-2 py-1 rounded text-sm bg-indigo-600 text-white">就寝前</div>;
              if (s.includes('朝')) return <div className="inline-block px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">朝</div>;
              if (s.includes('昼')) return <div className="inline-block px-2 py-1 rounded text-sm bg-sky-100 text-sky-800">昼</div>;
              if (s.includes('晩') || s.includes('夜')) return <div className="inline-block px-2 py-1 rounded text-sm bg-gray-800 text-white">晩</div>;
              try {
                const d = new Date(s);
                if (!isNaN(d.getTime())) {
                  const h = d.getHours();
                  if (h >= 21 && h <= 23) return <div className="inline-block px-2 py-1 rounded text-sm bg-indigo-600 text-white">就寝前</div>;
                  if (h >= 5 && h <= 11) return <div className="inline-block px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">朝</div>;
                  if (h >= 12 && h <= 16) return <div className="inline-block px-2 py-1 rounded text-sm bg-sky-100 text-sky-800">昼</div>;
                  return <div className="inline-block px-2 py-1 rounded text-sm bg-gray-800 text-white">晩</div>;
                }
              } catch (e) {}
              return <div className="inline-block px-2 py-1 bg-gray-200 rounded text-sm">-</div>;
            })()}
          </div>
          <div className="font-medium">{r.medication_records?.dosage ?? '-'} / {r.medication_records?.usage ?? '-'}</div>
          <div className="text-xs text-gray-500">{r.note ?? '-'}</div>
        </div>
      ))}
      <Link href="/dose_history" className="text-sm text-blue-600">すべて見る →</Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">MedTrackerへようこそ</h1>
        {/* ボタンはヘッダーに移動しました */}

        {/* 直近の記録 セクションはホームから削除され、再利用がある場合は RecentWidget を別所で使ってください */}
      </div>
    </main>
  );
}