'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { medicationRecordService } from '../../../lib/database';
import { supabase } from '../../../lib/supabaseClient';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SimpleQRReader from '../../../components/SimpleQRReader';
import MultipleMedicationsModal from '../../../components/MultipleMedicationsModal';
import { processQrCode, type MedicationData, debugQrData } from '../../../lib/unifiedQrParser';
import MedicationSearch from '../../../components/MedicationSearch';
import type { Medication, MedicationRecordFormData, QrMedicationData } from '../../../types/database';

function NewMedicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showQRReader, setShowQRReader] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMedicationsModal, setShowMedicationsModal] = useState(false);
  const [detectedMedications, setDetectedMedications] = useState<QrMedicationData[]>([]);
  
  // デバッグ用: showQRReaderの変更を監視
  useEffect(() => {
    console.log('showQRReader の状態が変更されました:', showQRReader);
  }, [showQRReader]);
  
  // フォームデータ
  const [formData, setFormData] = useState<MedicationRecordFormData>({
    prescription_date: new Date().toISOString().split('T')[0],
    prescribed_by: '',
    hospital_name: '',
    pharmacy_name: '',
    dosage_amount: 1,
    dosage_unit: '錠',
    frequency_per_day: 1,
    duration_days: 1,
    total_amount: 1,
    instructions: '',
  });

  // QRコード読み取り成功時の処理
  const handleQRResult = (qrDataString: string) => {
    console.log('=== 統一QRコード処理開始 ===');
    console.log('生データ:', qrDataString);
    console.log('データ長:', qrDataString.length);/* 短すぎたり長すぎたりする場合のチェックをするため、文字数を取得する。 */

    if (!qrDataString || qrDataString.trim() === '') { /* trim = 文字列の前後の空白を削除 */
      console.log('❌ 空のQRコードデータ');
      setError('QRコードが読み取れませんでした。もう一度お試しください。');
      setShowQRReader(false);
      return;/* 後続処理を中断するために必要 */
    }

    // データを正規化
    const normalizedData = qrDataString.trim();
    console.log('正規化後のデータ:', normalizedData.substring(0, 100) + '...');/* コンソールが埋まって見づらくなるため、100文字までを表示 */

    // デバッグ情報を出力
    debugQrData(normalizedData);/* QRコードの詳細情報を開発者ツールに出力（別ファイルの関数） */
    
    try {
      // 🎯 新しい統一パーサーを使用
      const medicationData = processQrCode(normalizedData);
      
      if (medicationData && medicationData.medications.length > 0) {
        console.log('🎯 統一パーサーで解析成功:', medicationData);
        
        // 複数薬剤が検出された場合
        if (medicationData.medications.length > 1) {
          console.log(`🔍 ${medicationData.medications.length}種類の薬剤を検出`);
          console.log('薬剤選択モーダルを表示します');
          
          // MedicationData形式をMultipleMedicationsModalで使用する形式に変換
          const modalMedications = medicationData.medications.map((med, index) => ({
            name: med.name,
            quantity: med.quantity || '1',
            unit: med.unit || '錠',
            dosage: med.dosage,
            days: med.days?.toString() || '1'
          }));
          
          setDetectedMedications(modalMedications);
          setShowMedicationsModal(true);
          setShowQRReader(false);
          return;
        }

        // 単一薬剤の場合、直接フォームに設定
        const medication = medicationData.medications[0];
        const newFormData = {
          prescription_date: medicationData.prescribedDate,
          prescribed_by: '', // 統一パーサーには処方医情報がないため空文字
          hospital_name: medicationData.hospitalName,
          pharmacy_name: '', // 統一パーサーには薬局情報がないため空文字
          medication_name: medication.name,
          dosage_amount: parseFloat(medication.quantity || '1'),
          dosage_unit: medication.unit || '錠',
          frequency_per_day: parseFloat(medication.dosage.match(/\d+/)?.[0] || '1'),
          duration_days: medication.days || 1,
          total_amount: (parseFloat(medication.quantity || '1')) * 
                       (parseFloat(medication.dosage.match(/\d+/)?.[0] || '1')) * 
                       (medication.days || 1),
          instructions: `${medication.name} - ${medication.dosage} (${medicationData.sourceFormat}形式から自動入力)`,
        };

        console.log('📝 フォームデータに変換:', newFormData);

        // フォームに反映
        setFormData((prev: MedicationRecordFormData) => ({
          ...prev,
          ...newFormData
        }));

        // 成功メッセージ
        setError('');
        console.log('✅ お薬手帳データを正常に読み取りました');
        
        // QRリーダーを閉じる
        setShowQRReader(false);
        return;
        
      } else {
        console.log('❌ 統一パーサーで解析失敗または薬剤データなし');
        setError('QRコードデータの解析に失敗しました。対応していない形式の可能性があります。');
      }
      
      setShowQRReader(false);

    } catch (error) {
      console.error('❌ 統一QR解析エラー:', error);
      setError('QRコードの解析中にエラーが発生しました。');
      setShowQRReader(false);
    }
  };

  // 複数薬剤から選択された薬剤をフォームに設定
  const handleSelectMedication = (medication: QrMedicationData) => {
    console.log('選択された薬剤:', medication);
    
    const newFormData = {
      prescription_date: new Date().toISOString().split('T')[0], /* new Date()で現在の日付を取得し、ISO形式の文字列に変換してから、T以前と以降の二つのオブジェクトに分けて、[0]で一つ目のオブジェクトを取得 */
      prescribed_by: '',
      hospital_name: '',
      pharmacy_name: '',
      medication_name: medication.name,
      dosage_amount: parseFloat(medication.quantity) || 1,
      dosage_unit: medication.unit || '錠',
      frequency_per_day: parseFloat(medication.dosage.match(/\d+/)?.[0] || '1'),
      duration_days: parseFloat(medication.days) || 1,
      total_amount: (parseFloat(medication.quantity) || 1) * 
                   (parseFloat(medication.dosage.match(/\d+/)?.[0] || '1')) * 
                   (parseFloat(medication.days) || 1),
      instructions: `${medication.name} - ${medication.dosage}`,
    };

    console.log('📝 選択された薬剤をフォームデータに変換:', newFormData);

    // フォームに反映
    setFormData((prev: MedicationRecordFormData) => ({
      ...prev,
      ...newFormData
    }));

    // 成功メッセージ
    setError('');
    console.log('✅ 選択された薬剤情報をフォームに設定しました');
  };

  // 処方記録の保存
  const handleSubmit = async () => {
    if (!user) {
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
      const recordData = {
        ...formData,
        medication_id: selectedMedication.id
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
              onClick={() => setShowQRReader(true)}
              className="w-full bg-[#96b786] text-black px-6 py-3 rounded-md hover:bg-[#66904f] font-medium active:scale-95"
            >
              QRコードをスキャン
            </button>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-red-800 font-medium mb-2">❌ エラー</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 薬剤検索 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl text-gray-900 mb-4">薬剤選択</h2>
            <MedicationSearch 
              onSelect={setSelectedMedication}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, prescription_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用量
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={formData.dosage_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage_amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.1"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={formData.dosage_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage_unit: e.target.value }))}
                    placeholder="錠"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1日の服用回数
                </label>
                <input
                  type="number"
                  value={formData.frequency_per_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency_per_day: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  処方日数
                </label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  総数
                </label>
                <input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_amount: parseInt(e.target.value) || 0 }))}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                服用方法・備考
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="服用方法や備考を入力"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedMedication}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '処方記録を保存'}
            </button>
          </div>

          {/* QRコードリーダー */}
          {showQRReader && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999999,
              backgroundColor: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '500px',
                width: '90%'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '18px' }}>QRコードスキャン</h3>
                  <button
                    onClick={() => {
                      console.log('QRリーダーを閉じます');
                      setShowQRReader(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '20px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <SimpleQRReader
                  onResult={handleQRResult}
                  onError={(error) => {
                    console.error('QRスキャンエラー:', error);
                    setError(error.message);
                  }}
                />
              </div>
            </div>
          )}

          {/* 複数薬剤選択モーダル */}
          <MultipleMedicationsModal
            medications={detectedMedications}
            isOpen={showMedicationsModal}
            onClose={() => setShowMedicationsModal(false)}
            onSelectMedication={handleSelectMedication}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default NewMedicationPage;
