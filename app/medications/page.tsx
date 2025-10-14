'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { medicationRecordService } from '../../lib/database';
import ProtectedRoute from '../../components/ProtectedRoute';
import type { MedicationRecord } from '../../types/database';

function MedicationsPage() {/* コンポーネント宣言としての役割 */
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);/* 初期値がtrueなのはページが開かれた瞬間からローディングを開始するから */
  const [error, setError] = useState('');

  useEffect(() => {/* useEffect とはコンポーネントが表示された時に実行。ここでは[user] = user が変わったら再実行 */
    const fetchRecords = async () => {
      if (!user) return;/* user がいない場合は何もしない。 user がログイン状態だと useEffect が実行される */

      try {
        setLoading(true); // 1. ローディング開始
        const data = await medicationRecordService.getUserMedicationRecords(user.id);/* 特定のユーザーの全ての処方記録を取得するための関数 */
        setRecords(data); // 2. データを State に保存
      } catch (err) {
        console.error('処方記録の取得エラー:', err);/* 第１引数が'処方記録の取得エラー:'で第２引数がerr。errの中身はJavaScript/ライブラリが自動で生成する */
        setError('処方記録の取得に失敗しました'); // 3. エラーメッセージを設定
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();/* 定義した関数を即座に呼び出し */
  }, [user]);/* 依存配列 */

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };/* ヘルパー関数: よく使う処理を関数にまとめて、コードを再利用可能で読みやすくするためのもの */

  return (
    <ProtectedRoute> 
      {loading ? (/* 三項演算子 👉 {条件 ? 真の場合 : 偽の場合} */
        /* loading が true の間は、くるくる回るローディングアニメーションを表示 */
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        /* loading が false になったら、メインコンテンツを表示 */
        <div className="min-h-screen py-8 bg-[#cee6c1]">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl  text-gray-700">処方記録</h1>
              <div className="flex gap-4">
            </div>
          </div>

          {error && (/* error が存在する（真）なら、エラーメッセージを表示する。errorが存在しなければ何もしない。 左側 && 右側 👉 左側が falsy → 左側を返す。左側が truthy → 右側を返す。*/
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {records.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">{/* rounded = 角丸,lg = large（大きめ）,p = padding */}
              <div className="text-gray-500 mb-4">{/* mb = margin-bottom */}
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"/* m = margin, x = 左右 */
                  fill="none"/* 塗りつぶしなし */
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >{/* svgとは Scalable Vector Graphics の略で、XMLベースのベクター画像フォーマットです。 */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                処方記録がありません
              </h3>
              <Link
                href="/medications/new"
                className="inline-flex items-center px-6 py-3 bg-[#96b786] text-black rounded-md hover:bg-[#66904f] shadow-lg active:scale-95"
              >
                処方記録を追加
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {record.medication?.drug_name || '薬剤名不明'}
                      </h3>
                      {record.medication?.generic_name && (
                        <p className="text-gray-600 text-sm mb-1">
                          一般名: {record.medication.generic_name}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm">
                        処方日: {formatDate(record.prescription_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-blue-600">
                        {record.dosage_amount}{record.dosage_unit}
                      </p>
                      <p className="text-sm text-gray-500">
                        1日{record.frequency_per_day}回 × {record.duration_days}日
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {record.prescribed_by && (
                      <div>
                        <span className="font-medium text-gray-700">処方医:</span>
                        <p className="text-gray-600">{record.prescribed_by}</p>
                      </div>
                    )}
                    {record.hospital_name && (
                      <div>
                        <span className="font-medium text-gray-700">医療機関:</span>
                        <p className="text-gray-600">{record.hospital_name}</p>
                      </div>
                    )}
                    {record.pharmacy_name && (
                      <div>
                        <span className="font-medium text-gray-700">調剤薬局:</span>
                        <p className="text-gray-600">{record.pharmacy_name}</p>
                      </div>
                    )}
                    {record.total_amount && (
                      <div>
                        <span className="font-medium text-gray-700">総量:</span>
                        <p className="text-gray-600">{record.total_amount}{record.dosage_unit}</p>
                      </div>
                    )}
                  </div>

                  {record.instructions && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <span className="font-medium text-gray-700">服用方法:</span>
                      <p className="text-gray-600 mt-1">{record.instructions}</p>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <Link
                      href={`/medications/${record.id}/edit`}
                      className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => {
                        // 削除機能は後で実装
                        console.log('削除:', record.id);
                      }}
                      className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </ProtectedRoute>
  );
}

export default MedicationsPage;
