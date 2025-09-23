'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { doseRecordService } from '../../lib/database';
import ProtectedRoute from '../../components/ProtectedRoute';
import type { DoseRecord } from '../../types/database';

/**
 * 服用履歴ページ - ユーザーの薬剤服用記録を表示
 * 日付別フィルタリング機能と服用完了ボタンを提供
 */
const DoseHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<DoseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await doseRecordService.getUserDoseRecords(user.id, selectedDate);
        setRecords(data);
      } catch (err) {
        console.error('服用記録の取得エラー:', err);
        setError('服用記録の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [user, selectedDate]);

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '不明';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP');
    } catch {
      return '不明';
    }
  };

  const handleMarkDoseTaken = async (recordId: string) => {
    try {
      await doseRecordService.markDoseTaken(recordId);
      // 記録を更新
      setRecords(prev =>
        prev.map(r =>
          r.id === recordId
            ? { ...r, taken: true, actual_time: new Date().toISOString() }
            : r
        )
      );
    } catch (err) {
      console.error('服用記録の更新エラー:', err);
      setError('服用記録の更新に失敗しました');
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* ページヘッダー */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">服用履歴</h1>
            <Link
              href="/"
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-medium"
            >
              ホーム
            </Link>
          </div>

          {/* 日付選択 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4">
              <label htmlFor="date" className="font-medium text-gray-700">
                日付を選択:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 服用記録一覧 */}
          {records.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formatDate(selectedDate)}の服用記録はありません
              </h3>
              <p className="text-gray-600">
                この日の服用記録がまだ登録されていません
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className={`bg-white rounded-lg shadow p-6 ${
                    record.taken ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {record.medication_record?.medication?.drug_name || '薬剤名不明'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-1">
                        予定時刻: {formatTime(record.scheduled_time)}
                      </p>
                      {record.actual_time && (
                        <p className="text-gray-600 text-sm">
                          実際の服用時刻: {formatTime(record.actual_time)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          record.taken
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {record.taken ? '服用済み' : '未服用'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">用量:</span>
                      <p className="text-gray-600">
                        {record.medication_record?.dosage_amount || 0}
                        {record.medication_record?.dosage_unit || ''}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">処方医:</span>
                      <p className="text-gray-600">
                        {record.medication_record?.prescribed_by || '未記録'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">医療機関:</span>
                      <p className="text-gray-600">
                        {record.medication_record?.hospital_name || '未記録'}
                      </p>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <span className="font-medium text-gray-700">メモ:</span>
                      <p className="text-gray-600 mt-1">{record.notes}</p>
                    </div>
                  )}

                  {record.medication_record?.instructions && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <span className="font-medium text-blue-700">服用方法:</span>
                      <p className="text-blue-600 mt-1">{record.medication_record.instructions}</p>
                    </div>
                  )}

                  {!record.taken && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleMarkDoseTaken(record.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        服用完了
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DoseHistoryPage;
