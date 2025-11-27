'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { medicationRecordService } from '../../lib/database';
import ProtectedRoute from '../../components/ProtectedRoute';
import MedicationRecordCard from '../../components/MedicationRecordCard';
import type { MedicationRecord } from '../../types/database';

export default function MedicationsPage() {/* コンポーネント宣言としての役割 */
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicationRecord[]>([]);/*.  useState を<MedicationRecord[]>という型で指定して、初期値は([])で空の配列とする。 */
  const [loading, setLoading] = useState(true);/* 初期値がtrueなのはページが開かれた瞬間からローディングを開始するから */
  const [error, setError] = useState('');

  useEffect(() => {/* useEffect とはコンポーネントが表示された時に実行。ここでは[user] = user が変わったら再実行 */
    const fetchRecords = async () => {
      if (!user) return;/* user がいない場合は何もしない。 user がログイン状態だと useEffect が実行される */

      try {
        setLoading(true); // 1. ローディング開始
        const data = await medicationRecordService.getUserMedicationRecords(user.id);/* 特定のユーザーの全ての処方記録を取得するための関数 */
        setRecords(data); // 2. データを State に保存
      } catch (err) { /* err(eとかerrorとか自分で命名)　はJavaScriptが自動で生成するエラーオブジェクト。 */
        console.error('処方記録の取得エラー:', err);/* 第１引数が'処方記録の取得エラー:'で第２引数がerr。errの中身はJavaScript/ライブラリが自動で生成する */
        setError('処方記録の取得に失敗しました'); // 3. エラーメッセージを設定
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();/* 定義した関数を即座に呼び出し */
  }, [user]);/* 依存配列 */

  const handleDelete = async (id: string) => {/* // 追加: 削除ボタンが押された時の処理を定義 */
    if (!confirm('本当に削除しますか？')) return;// confirmはブラウザ標準の「確認ダイアログ」を表示する命令
    
    try {
      await medicationRecordService.deleteMedicationRecord(id);// deleteMedicationRecord は database.ts に存在する関数
      setRecords(records.filter(r => r.id !== id));//.  records.filter(...): 今持っているデータ一覧（records）から、条件(...)に合うものだけを残して、新しい一覧を作る機能。 r => r.id !== id:「データのID（r.id）が、削除したID（id）と 等しくない（!==） ものだけ残す」
    } catch (err) {
      console.error('削除エラー:', err);
      alert('削除に失敗しました');
    }
  };

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
              <h1 className="text-3xl  text-gray-700">処方一覧</h1>
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
                  stroke="currentColor"/* SVGの線の色を、親要素のテキスト色と同じにするという指定 */
                >{/* svgとは Scalable Vector Graphics の略で、XMLベースのベクター画像フォーマットです。 */}
                  <path
                    strokeLinecap="round"/* 線の端を丸くして、優しい見た目に */
                    strokeLinejoin="round"/* 線の接続部分を丸くして、優しい見た目に */
                    strokeWidth={1}/* 線の太さを指定 */
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/* SVGの描画コマンドを定義。これはコピペで良さそう（理解不要） */
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
            <div className="space-y-4">{/* つまり、margin-top: 1rem（１６px）; */}
              {records.map((record) => (
                <MedicationRecordCard
                  key={record.id}
                  record={record}
                  onDelete={handleDelete}/* 子コンポーネント（MedicationRecordCard.tsx）では、これらを関数の引数として受け取っている。（MedicationRecordCardProps） */
                />
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </ProtectedRoute>
  );
}
