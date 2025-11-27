import React, { useState } from 'react';
import Link from 'next/link';// Next.jsのページ遷移用リンク。「編集」ボタンを押した時に編集ページへ飛ぶために使う。130行目参照
import type { MedicationRecord } from '../types/database';

interface MedicationRecordCardProps {/* 親コンポーネント（page.tsx）から受け取るプロパティ */
  record: MedicationRecord;
  onDelete?: (id: string) => void;
}

export default function MedicationRecordCard({ record, onDelete }: MedicationRecordCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {/* record.prescription_date（データベースから取得した日付文字列。例: "2025-11-27"）が、この formatDate 関数の dateString という引数に渡される。 */
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
      {/* ヘッダー部分（常に表示・クリック可能エリア） */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer bg-white active:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}// このエリアがクリックされたら、isopen の状態を反転させる
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {record.medication?.drug_name || '薬剤名不明'}
            </h3>
          </div>
          {!isOpen && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 sm:hidden">
               <span className="truncate">{record.instructions}</span>
            </div>
          )}
        </div>

        {/* 展開/折りたたみアイコン */}
        <div className="flex-shrink-0 ml-2 text-gray-400">
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 15-6-6-6 6"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          )}
        </div>
      </div>

      {/* 詳細ボディ部分（初期状態は非表示・展開時のみ表示） */}
      <div 
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'max-h-[500px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="p-3 bg-gray-50 space-y-2 text-sm text-gray-900">
          
          {/* 1行目: [処方日] | [総量] | [処方日数] */}
          <div className="flex flex-wrap items-center gap-x-3 text-gray-600">
            <div className="flex items-center">
              <span className="font-medium mr-1">処方日:</span>
              {formatDate(record.prescription_date)}
            </div>
            
            {(record.total_amount || record.dosage_amount > 0) && (
              <div className="flex items-center pl-3 border-l border-gray-300">
                {record.total_amount ? (
                  <>
                    <span className="font-medium mr-1">総量:</span>
                    <span>{record.total_amount}{record.dosage_unit}</span>
                  </>
                ) : (
                  <>
                    <span className="font-medium mr-1">1回:</span>
                    <span>{record.dosage_amount}{record.dosage_unit}</span>
                  </>
                )}
              </div>
            )}

            {record.duration_days > 0 && (
              <div className="flex items-center pl-3 border-l border-gray-300">
                <span className="font-medium mr-1">日数:</span>
                {record.duration_days}日分
              </div>
            )}
          </div>

          {/* 2行目: 処方医 */}
          {record.prescribed_by && (
            <div className="flex items-start">
              <span className="font-medium w-20 shrink-0 text-gray-500">処方医:</span>
              <span>{record.prescribed_by}</span>
            </div>
          )}

          {/* 3行目: 医療機関 */}
          {record.hospital_name && (
            <div className="flex items-start">
              <span className="font-medium w-20 shrink-0 text-gray-500">医療機関:</span>
              <span>{record.hospital_name}</span>
            </div>
          )}

          {/* 4行目: 調剤薬局 */}
          {record.pharmacy_name && (
            <div className="flex items-start">
              <span className="font-medium w-20 shrink-0 text-gray-500">調剤薬局:</span>
              <span>{record.pharmacy_name}</span>
            </div>
          )}

          {/* 5行目: 用法・用量の全文 */}
          {record.instructions && (
            <div className="pt-2 mt-2 border-t border-gray-200">
              <span className="font-medium block mb-1 text-gray-500">用法・用量:</span>
              <p className="whitespace-pre-wrap">{record.instructions}</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="mt-4 pt-2 flex justify-end space-x-2 border-t border-gray-200">
            <Link
              href={`/medications/${record.id}/edit`}
              className="px-3 py-1.5 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 text-xs font-medium"
            >
              編集
            </Link>
            {onDelete && (// 条件付きレンダリング
              <button
                onClick={(e) => {
                  e.stopPropagation();/* 通常アコーディオンUIにはクリックイベントがバブリングするのを防ぐために使用するが、現在は不要。 */
                  onDelete(record.id);
                }}
                className="px-3 py-1.5 text-red-600 border border-red-600 rounded hover:bg-red-50 text-xs font-medium"
              >
                削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
