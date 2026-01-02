'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { medicationRecordService } from '../../../lib/database';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SimpleQRReader from '../../../components/SimpleQRReader';
import MultipleMedicationsModal from '../../../components/MultipleMedicationsModal';
import { processQrCode } from '../../../lib/unifiedQrParser';
import MedicationSearch from '../../../components/MedicationSearch';
import { inferNotificationTimes } from '../../../lib/timeUtils';
import type { Medication, MedicationRecordFormData, ParsedMedication } from '../../../types/database';

function NewMedicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showQRReader, setShowQRReader] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);/* TypeScriptの型付きState */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);
  const [detectedMedications, setDetectedMedications] = useState<ParsedMedication[]>([]);
  
  const [scannedBuffers, setScannedBuffers] = useState<string[]>([]);  // 新機能: 連続スキャン用バッファ　バッファ = 一時的にデータを保存しておく場所
  const [scanStatus, setScanStatus] = useState('');

  const [formData, setFormData] = useState<MedicationRecordFormData>({// フォームデータ　/* オブジェクト型のState管理 */
    prescription_date: new Date().toISOString().split('T')[0],/* 以下はこのフォームデータの初期値 */
    prescribed_by: '',
    hospital_name: '',
    pharmacy_name: '',
    dosage_amount: 0, // UIからは削除（内部計算用）
    dosage_unit: '錠',
    frequency_per_day: 0, // UIからは削除（内部計算用）
    duration_days: 1,
    total_amount: 0,
    instructions: '', // 用法・用量（テキスト）
  });

  const handleQRResult = (qrDataString: string) => {  // QRコード読み取り成功時の処理（バッファリング）
    if (!qrDataString || qrDataString.trim() === '') return;

    const lastData = scannedBuffers[scannedBuffers.length - 1];// 重複チェック（直前のデータと同じなら無視）
    if (lastData === qrDataString) return;//カメラはずっと動いており、同じQRコードを1秒間に何回も読み取ってしまうのを防ぐために、「同じデータが連続したら無視する」というルール

    setScannedBuffers(prev => [...prev, qrDataString]);//スプレッド構文
    setScanStatus(`読み取り成功！ (${scannedBuffers.length + 1}枚目)`);
    
    setTimeout(() => setScanStatus(''), 3000);// 3秒後にステータスを消す
  };

  // 読み取り終了・解析実行
  const handleFinishScanning = () => {
    if (scannedBuffers.length === 0) {
      setError('QRコードが読み取られていません');
      setShowQRReader(false);
      return;/* 後続処理を中断するために必要 */
    }

    console.log(`=== 統一QRコード処理開始 (${scannedBuffers.length}枚結合) ===`);
    const combinedData = scannedBuffers.join('\n');//多くの薬局システムが「行単位」でQRを作ってくれるため、この簡易実装でも動くことが多い。エラーが出たら改善が必要。 join = scannedBuffers の各要素を改行でつなげて一つの文字列にする
    try {
      const medicationData = processQrCode(combinedData);//unifiedQrParser.tsのメイン関数
      
      if (medicationData && medicationData.medications.length > 0) {
        console.log('🎯 解析成功:', medicationData);
        
        // 複数薬剤が検出された場合
        if (medicationData.medications.length > 1) {
          setDetectedMedications(medicationData.medications);
          setShowMedicationsModal(true);
          setShowQRReader(false);
          return;
        }

        // 単一薬剤の場合
        const medication = medicationData.medications[0];
        handleSelectMedication(medication);
        
      } else {
        setError('QRコードデータの解析に失敗しました。');
        setShowQRReader(false);
      }
    } catch (error) {
      console.error('解析エラー:', error);
      setError('解析中にエラーが発生しました。');
      setShowQRReader(false);
    }
  };

  // 薬剤選択後の処理
  const handleSelectMedication = (medication: ParsedMedication) => {
    // 用法から通知時間を自動推測
    const inferredTimes = inferNotificationTimes(medication.usage_text);

    const newFormData = {
      prescription_date: new Date().toISOString().split('T')[0], /* new Date()で現在の日付を取得し、ISO形式の文字列に変換してから、T以前と以降の二つのオブジェクトに分けて、[0]で一つ目のオブジェクトを取得 */
      prescribed_by: '',
      hospital_name: '',
      pharmacy_name: '',
      dosage_amount: 0, // デフォルト
      dosage_unit: medication.unit || '錠',
      frequency_per_day: 0, // デフォルト
      duration_days: parseInt(medication.days || '1') || 1,
      total_amount: parseInt(medication.quantity || '0') || 0,
      instructions: medication.usage_text, // usage_textが入っている
      notification_times: inferredTimes // 自動推測した時間をセット
    };

    setFormData(prev => ({ ...prev, ...newFormData }));
    setError('');
    setShowQRReader(false);
    // バッファをクリア
    setScannedBuffers([]);
  };

  // 処方記録の保存
  const handleSubmit = async () => {/* フォームに入力された処方記録をデータベースに保存する関数 */
    if (!user) {/* 二つの if文を使ったガード節 */
      setError('ユーザー情報が取得できませんでした');
      return;
    }

    if (!selectedMedication) {
      setError('薬剤を選択してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const inferredTimes = inferNotificationTimes(formData.instructions);
      const recordData = {
        ...formData,
        medication_id: selectedMedication.id, // formData + medication_id（選択された薬剤ID）= recordData
        notification_times: inferredTimes // 自動推測した時間をセット
      };

      const result = await medicationRecordService.createMedicationRecord(user.id, recordData);
      if (result) {
        router.push('/medications');
      } else {
        setError('処方記録の保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* ページヘッダー */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl text-gray-700">新しい処方記録</h1>
          </div>

          {/* QRスキャンボタン */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl text-gray-700 mb-4">QRコードから入力</h2>
            <button
              onClick={() => {
                setScannedBuffers([]);
                setScanStatus('');
                setShowQRReader(true);
              }}
              className="w-full bg-[#96b786] text-black px-6 py-3 rounded-md hover:scale-105 font-medium active:scale-95"
            >
              QRコードをスキャン（連続読み取り対応）
            </button>
          </div>

          {/* エラー表示 */}
          {error && (/* 条件付きレンダリング: */
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-medium mb-2">❌ エラー</h3>
              <p className="text-red-700">{error}</p>{/* このerrorがあればtrue👉表示 */}
            </div>
          )}

          {/* 薬剤検索 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl text-gray-900 mb-4">薬剤選択</h2>
            <MedicationSearch 
              onSelect={setSelectedMedication}/* MedicationSearchコンポーネントであり、選択するとsetSelectedMedicationが呼ばれる */
            />
            {selectedMedication && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-blue-800 font-medium">選択された薬剤: {selectedMedication.drug_name}</p>
              </div>
            )}
          </div>

          {/* 手動入力フォーム */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl text-gray-900 mb-4">処方詳細</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  処方日
                </label>
                <input
                  type="date"
                  value={formData.prescription_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, prescription_date: e.target.value }))}/* まず prev（現在のMedicationRecordFormData）をスプレッド構文で取得し、その中の prescription_date のみを e.target.value に更新 */
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  医療機関名
                </label>
                <input
                  type="text"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospital_name: e.target.value }))}
                  placeholder="病院名を入力"
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  処方医
                </label>
                <input
                  type="text"
                  value={formData.prescribed_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, prescribed_by: e.target.value }))}
                  placeholder="処方医名を入力"
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  薬局名
                </label>
                <input
                  type="text"
                  value={formData.pharmacy_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, pharmacy_name: e.target.value }))}
                  placeholder="薬局名を入力"
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  処方日数
                </label>
                <input
                  type="number"
                  value={formData.duration_days === 0 ? '' : formData.duration_days}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, duration_days: val === '' ? 0 : parseInt(val) }));
                  }}
                  min="1"
                  className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  総数
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.total_amount === 0 ? '' : formData.total_amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, total_amount: val === '' ? 0 : parseInt(val) }));
                    }}
                    min="1"
                    className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.dosage_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage_unit: e.target.value }))}
                    placeholder="錠"
                    className="text-gray-900 w-20 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用法・用量（指示事項）
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="例: 1日3回 毎食後"
                rows={4}
                className="text-gray-900 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedMedication}/* loading の時か selectedMedication がない時に disabled （disable はHTMLの属性）*/
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '処方記録を保存'}
            </button>
          </div>

          {/* QRコードリーダー (モーダル) */}
          {showQRReader && (/* 条件レンダリング */
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
               <div className="w-full max-w-md bg-white rounded-lg p-4 flex flex-col max-h-[90vh]">
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-lg font-bold text-gray-900">QRコード読み取り</h2>
                   <button 
                     onClick={() => setShowQRReader(false)} 
                     className="text-gray-500 hover:text-gray-700 text-2xl"
                   >
                     ×
                   </button>
                 </div>
                 
                 <div className="flex-1 overflow-hidden relative bg-black rounded-lg mb-4 min-h-[300px]">
                   <SimpleQRReader
                     onResult={handleQRResult}
                     autoStart={true}
                     autoStop={false} // 連続スキャン有効
                     className="w-full h-full"
                   />
                 </div>
                 
                 <div className="text-center mb-4">
                   <p className="font-bold text-lg text-gray-800">
                     {scannedBuffers.length}枚 読み取り済み
                   </p>
                   {scanStatus && (
                     <p className="text-green-600 font-medium animate-pulse">
                       {scanStatus}
                     </p>
                   )}
                   <p className="text-sm text-gray-500 mt-2">
                     複数のQRコードを連続して読み取れます。<br/>
                     全て読み終わったら下のボタンを押してください。
                   </p>
                 </div>

                 <button
                   onClick={handleFinishScanning}
                   className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md"
                 >
                   読み取りを終了して登録
                 </button>
               </div>
            </div>
          )}

          {/* 複数薬剤選択モーダル */}
          <MultipleMedicationsModal
            medications={detectedMedications}
            isOpen={showMedicationsModal}/* 73行目で状態変化 */
            onClose={() => setShowMedicationsModal(false)}
            onSelectMedication={handleSelectMedication}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default NewMedicationPage;
