'use client';

import { useState } from 'react';
import MedicationSearch from '../../../components/MedicationSearch';
import { Medication } from '../../../types/database';

/**
 * 薬剤検索テストページ
 * MedicationSearchコンポーネントの動作確認用
 */
export default function TestSearchPage() {
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

  const handleSelect = (medication: Medication) => {
    setSelectedMedication(medication);
    console.log('選択された薬剤:', medication);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 薬剤検索テスト
          </h1>
          <p className="text-gray-600">
            データベースから薬剤を検索してみましょう
          </p>
        </div>

        {/* 検索コンポーネント */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            薬剤を検索
          </h2>
          <MedicationSearch onSelect={handleSelect} />
        </div>

        {/* 選択結果の表示 */}
        {selectedMedication && (
          <div className="bg-blue-50 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">
              ✅ 選択された薬剤
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-medium text-gray-700">薬剤名:</div>
                <div className="col-span-2 text-gray-900">{selectedMedication.drug_name}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-medium text-gray-700">一般名:</div>
                <div className="col-span-2 text-gray-900">
                  {selectedMedication.generic_name || '（なし）'}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-medium text-gray-700">製造会社:</div>
                <div className="col-span-2 text-gray-900">{selectedMedication.manufacturer}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-medium text-gray-700">規格:</div>
                <div className="col-span-2 text-gray-900">{selectedMedication.strength}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-medium text-gray-700">剤形:</div>
                <div className="col-span-2 text-gray-900">{selectedMedication.dosage_form}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 font-medium text-gray-700">投与経路:</div>
                <div className="col-span-2 text-gray-900">
                  {selectedMedication.route_of_administration}
                </div>
              </div>
              
              {selectedMedication.yj_code && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 font-medium text-gray-700">YJコード:</div>
                  <div className="col-span-2 text-gray-900 font-mono">
                    {selectedMedication.yj_code}
                  </div>
                </div>
              )}
              
              {selectedMedication.price && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 font-medium text-gray-700">薬価:</div>
                  <div className="col-span-2 text-gray-900">
                    ¥{selectedMedication.price.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* JSON表示 */}
            <details className="mt-6">
              <summary className="cursor-pointer text-blue-700 font-medium">
                📋 JSONデータを表示
              </summary>
              <pre className="mt-3 p-4 bg-gray-900 text-green-400 rounded text-xs overflow-auto">
                {JSON.stringify(selectedMedication, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* テストケース */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            📝 テストケース
          </h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>以下のキーワードで検索してみてください:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-gray-100 px-2 py-1 rounded">ロキソニン</code> - 解熱鎮痛剤</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">カロナール</code> - アセトアミノフェン</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">ムコ</code> - 部分一致検索</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">アレグラ</code> - 抗アレルギー薬</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">ガスター</code> - 胃薬</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">リリカ</code> - 神経障害性疼痛治療薬</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
