'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { medicationRecordService } from '../../../lib/database';
import { supabase } from '../../../lib/supabaseClient';
import ProtectedRoute from '../../../components/ProtectedRoute';
import SimpleQRReader from '../../../components/SimpleQRReader';
import { SimpleJahisParser, type MedicationInfo } from '../../../lib/simpleJahisParser';
import MedicationSearch from '../../../components/MedicationSearch';
import type { Medication, MedicationRecordFormData } from '../../../types/database';

function NewMedicationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showQRReader, setShowQRReader] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    console.log('=== QRコード読み取り成功 ===');
    console.log('生データ:', qrDataString);
    console.log('データ長:', qrDataString.length);
    
    if (!qrDataString || qrDataString.trim() === '') {
      console.log('❌ 空のQRコードデータ');
      setError('QRコードが読み取れませんでした。もう一度お試しください。');
      setShowQRReader(false);
      return;
    }

    // データを正規化
    const normalizedData = qrDataString.trim();
    console.log('正規化後のデータ:', normalizedData);
    console.log('正規化後の最初の10文字:', normalizedData.substring(0, 10));
    
    // SimpleJahisParserを使用してデータを解析
    console.log('=== データ解析開始 ===');
    
    try {
      // SimpleJahisParserで解析
      const medicationInfo = SimpleJahisParser.parseQRData(normalizedData);
      
      if (medicationInfo) {
        console.log('🎯 解析成功:', medicationInfo);
        
        // フォームデータに変換・設定
        const newFormData = {
          prescription_date: medicationInfo.prescriptionDate,
          prescribed_by: '', // SimpleJahisParserには処方医情報がないため空文字
          hospital_name: medicationInfo.hospitalName,
          pharmacy_name: '', // SimpleJahisParserには薬局情報がないため空文字
          medication_name: medicationInfo.medicationName,
          dosage_amount: parseFloat(medicationInfo.dosage.match(/\d+/)?.[0] || '1'),
          dosage_unit: medicationInfo.dosage.replace(/\d+/g, '').trim() || '錠',
          frequency_per_day: parseFloat(medicationInfo.frequency.match(/\d+/)?.[0] || '1'),
          duration_days: parseFloat(medicationInfo.duration.match(/\d+/)?.[0] || '1'),
          total_amount: parseFloat(medicationInfo.dosage.match(/\d+/)?.[0] || '1') * 
                       parseFloat(medicationInfo.frequency.match(/\d+/)?.[0] || '1') * 
                       parseFloat(medicationInfo.duration.match(/\d+/)?.[0] || '1'),
          instructions: `${medicationInfo.medicationName} - QRデータから自動入力`,
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
        console.log('解析失敗または未知の形式として認識');
        setError('QRコードデータの解析に失敗しました。正しいお薬手帳のQRコードをスキャンしてください。');
      }
      
      setShowQRReader(false);
      return;

    } catch (error) {
      console.error('QR解析エラー:', error);
      setError('QRコードの解析中にエラーが発生しました。');
      setShowQRReader(false);
    }
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
            <h1 className="text-3xl font-bold text-gray-900">新しい処方記録</h1>
            <Link
              href="/medications"
              className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-medium"
            >
              戻る
            </Link>
          </div>

          {/* QRスキャンボタン */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QRコードから入力</h2>
            <button
              onClick={() => setShowQRReader(true)}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              📱 お薬手帳のQRコードをスキャン
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">薬剤選択</h2>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">処方詳細</h2>
            
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
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default NewMedicationPage;
