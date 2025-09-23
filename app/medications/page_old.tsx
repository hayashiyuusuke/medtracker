'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { medicationRecordService } from '../../lib/database';
import ProtectedRoute from '../../components/ProtectedRoute';
import type { MedicationRecordWithRelations } from '../../types/database';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

function MedicationsPage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<MedicationRecordWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMedications = async () => {
      if (!user) return;

      try {
        const records = await medicationRecordService.getUserMedicationRecords(user.id);
        setMedications(records);
      } catch (err) {
        console.error('Error fetching medications:', err);
        setError('処方記録の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [user]);

  const handleDelete = async (recordId: string) => {
    if (!confirm('この処方記録を削除しますか？')) return;

    try {
      const success = await medicationRecordService.deleteMedicationRecord(recordId);
      if (success) {
        setMedications(prev => prev.filter(med => med.id !== recordId));
      } else {
        setError('削除に失敗しました');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('削除中にエラーが発生しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">処方記録一覧</h1>
        <Link
          href="/medications/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          新しい処方記録
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {medications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            処方記録がありません
          </h3>
          <p className="text-gray-600 mb-4">
            最初の処方記録を登録してみましょう
          </p>
          <Link
            href="/medications/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            処方記録を登録する
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {medications.map((record) => (
            <div key={record.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {record.medication?.drug_name || '薬剤名不明'}
                  </h3>
                  {record.medication?.generic_name && (
                    <p className="text-sm text-gray-600">
                      一般名: {record.medication.generic_name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/medications/${record.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">処方日:</span>
                  <p className="text-gray-900">
                    {record.prescription_date ? 
                      format(new Date(record.prescription_date), 'yyyy年M月d日', { locale: ja }) : 
                      '不明'
                    }
                  </p>
                </div>

                {record.prescribed_by && (
                  <div>
                    <span className="font-medium text-gray-700">処方医:</span>
                    <p className="text-gray-900">{record.prescribed_by}</p>
                  </div>
                )}

                {record.hospital_name && (
                  <div>
                    <span className="font-medium text-gray-700">医療機関:</span>
                    <p className="text-gray-900">{record.hospital_name}</p>
                  </div>
                )}

                {record.dosage_amount && (
                  <div>
                    <span className="font-medium text-gray-700">用量:</span>
                    <p className="text-gray-900">
                      {record.dosage_amount}{record.dosage_unit}
                      {record.frequency_per_day && ` × ${record.frequency_per_day}回/日`}
                    </p>
                  </div>
                )}

                {record.duration_days && (
                  <div>
                    <span className="font-medium text-gray-700">日数:</span>
                    <p className="text-gray-900">{record.duration_days}日分</p>
                  </div>
                )}

                {record.pharmacy_name && (
                  <div>
                    <span className="font-medium text-gray-700">調剤薬局:</span>
                    <p className="text-gray-900">{record.pharmacy_name}</p>
                  </div>
                )}
              </div>

              {record.instructions && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="font-medium text-gray-700 block mb-1">服用方法・注意事項:</span>
                  <p className="text-gray-900 text-sm">{record.instructions}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <Link
                    href={`/medications/${record.id}`}
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-100"
                  >
                    詳細を見る
                  </Link>
                  <Link
                    href={`/dose_history?medication_record_id=${record.id}`}
                    className="bg-green-50 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-100"
                  >
                    服薬記録
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MedicationsPageWrapper() {
  return (
    <ProtectedRoute>
      <MedicationsPage />
    </ProtectedRoute>
  );
}

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

  // pageInput removed — simple page state remains

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
