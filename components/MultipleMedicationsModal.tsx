'use client';

import type { ParsedMedication } from '../types/database';

interface MultipleMedicationsModalProps {
  medications: ParsedMedication[];  // 共通型を使用
  isOpen: boolean;/* boolean: true なら画面に表示し、false なら隠す。 */
  onClose: () => void;/* 「×ボタン」や「キャンセル」が押されたら、この関数を実行して親に知らせる。 */
  onSelectMedication: (medication: ParsedMedication) => void;  // 共通型を使用
}

export default function MultipleMedicationsModal({
  medications,
  isOpen,
  onClose,
  onSelectMedication/* 分割代入：親から渡された props という大きな箱から、必要な4つの道具（medications など）を取り出して、変数として使えるようにしている。 */
}: MultipleMedicationsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            複数の薬剤が検出されました ({medications.length}種類)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          登録したい薬剤を選択してください：
        </p>

        <div className="space-y-3">
          {medications.map((med, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {/* ユーザーがクリックすれば下2行が呼び出される */
                onSelectMedication(med);
                onClose();
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800 flex-1">
                  {index + 1}. {med.name}
                </h3>
                <span className="text-sm text-blue-600 ml-2">選択</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">用量:</span>
                  <br />
                  {med.quantity}{med.unit}
                </div>
                <div>
                  <span className="font-medium">用法:</span>
                  <br />
                  {med.usage_text || '用法不明'}
                </div>
                <div>
                  <span className="font-medium">期間:</span>
                  <br />
                  {med.days ? `${med.days}日分` : '期間不明'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
