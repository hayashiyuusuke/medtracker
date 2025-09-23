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
