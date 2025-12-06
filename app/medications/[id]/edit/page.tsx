'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../contexts/AuthContext';
import { medicationRecordService } from '../../../../lib/database';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import type { MedicationRecord, MedicationRecordFormData } from '../../../../types/database';

export default function EditMedicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<MedicationRecordFormData>({
    prescription_date: '',
    prescribed_by: '',
    hospital_name: '',
    pharmacy_name: '',
    dosage_amount: 0,
    dosage_unit: '錠',
    frequency_per_day: 0,
    duration_days: 1,
    total_amount: 0,
    instructions: '',
  });

  useEffect(() => {
    const fetchRecord = async () => {
      if (!user || !id) return;

      try {
        setLoading(true);
        const data = await medicationRecordService.getById(id);
        if (!data) {
          setError('記録が見つかりません');
          return;
        }
        if (data.user_id !== user.id) {
          setError('アクセス権限がありません');
          return;
        }

        // フォームデータを設定
        setFormData({
          prescription_date: data.prescription_date,
          prescribed_by: data.prescribed_by || '',
          hospital_name: data.hospital_name || '',
          pharmacy_name: data.pharmacy_name || '',
          dosage_amount: data.dosage_amount || 0,
          dosage_unit: data.dosage_unit || '錠',
          frequency_per_day: data.frequency_per_day || 0,
          duration_days: data.duration_days || 1,
          total_amount: data.total_amount || 0,
          instructions: data.instructions || '',
        });
      } catch (err) {
        console.error('処方記録の取得エラー:', err);
        setError('処方記録の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      await medicationRecordService.updateMedicationRecord(id, formData);
      router.push('/medications');
    } catch (err) {
      console.error('更新エラー:', err);
      setError('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'dosage_amount' || name === 'frequency_per_day' || name === 'duration_days' || name === 'total_amount'
        ? parseFloat(value) || 0
        : value
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen py-8 bg-[#cee6c1]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-red-700 mb-4">{error}</p>
              <Link
                href="/medications"
                className="inline-flex items-center px-6 py-3 bg-[#96b786] text-black rounded-md hover:bg-[#66904f] shadow-lg"
              >
                一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8 bg-[#cee6c1]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl text-gray-700">処方記録編集</h1>
            <Link
              href="/medications"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              キャンセル
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    処方日 *
                  </label>
                  <input
                    type="date"
                    name="prescription_date"
                    value={formData.prescription_date}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    処方医
                  </label>
                  <input
                    type="text"
                    name="prescribed_by"
                    value={formData.prescribed_by}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    医療機関
                  </label>
                  <input
                    type="text"
                    name="hospital_name"
                    value={formData.hospital_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    調剤薬局
                  </label>
                  <input
                    type="text"
                    name="pharmacy_name"
                    value={formData.pharmacy_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    1回量
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="dosage_amount"
                      value={formData.dosage_amount}
                      onChange={handleChange}
                      step="0.1"
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <select
                      name="dosage_unit"
                      value={formData.dosage_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, dosage_unit: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="錠">錠</option>
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    総量
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleChange}
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <span className="px-3 py-2 text-gray-500">{formData.dosage_unit}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    日数
                  </label>
                  <input
                    type="number"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用法・用量
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="例: 1日3回 毎食後 1錠"
                />
              </div>

              {error && (
                <div className="text-red-700 text-sm">{error}</div>
              )}

              <div className="flex justify-end gap-4">
                <Link
                  href="/medications"
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}