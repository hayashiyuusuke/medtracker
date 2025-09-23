/**
 * フォームデータブリッジの使用例
 * QRコード読み取り後のフォーム連携の実装サンプル
 */

import React from 'react';
import { populateFormWithQrData, MedicationObject, FormBridgeHelpers } from '../lib/formDataBridge';
import parseQrCode from '../lib/unifiedQrParser';

// フォームデータの型定義
interface PrescriptionFormData {
  prescribedDate: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  medications: Array<{
    selectedMedication: MedicationObject;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
}

// シンプルなフォーム状態管理（React Hook Formの代替）
interface FormState {
  [key: string]: any;
}

export function PrescriptionFormWithQrIntegration() {
  const [formData, setFormData] = React.useState<FormState>({});
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [qrStatus, setQrStatus] = React.useState<string>('');
  const [isValid, setIsValid] = React.useState(false);

  // setValue関数の実装
  const setValue = React.useCallback((fieldName: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      // ネストされたフィールド名の処理（例: medications[0].selectedMedication）
      const keys = fieldName.split(/[\[\].]/).filter(k => k);
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
        }
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  // フォームバリデーション
  React.useEffect(() => {
    const hasPatientName = formData.patientName?.trim();
    const hasPrescribedDate = formData.prescribedDate?.trim();
    const hasMedications = formData.medications?.length > 0 && 
                          formData.medications[0]?.selectedMedication?.name;
    
    setIsValid(Boolean(hasPatientName && hasPrescribedDate && hasMedications));
  }, [formData]);

  /**
   * 医薬品マスター検索の実装例
   * 実際のプロジェクトでは、APIやデータベースから検索
   */
  const searchMedicationByName = async (name: string): Promise<MedicationObject | null> => {
    try {
      // ここで実際のAPI呼び出しを行う
      const response = await fetch(`/api/medications/search?name=${encodeURIComponent(name)}`);
      if (response.ok) {
        const result = await response.json();
        return result.medication || null;
      }
      return null;
    } catch (error) {
      console.error('医薬品検索エラー:', error);
      return null;
    }
  };

  /**
   * QRコード読み取り成功時のハンドラー
   */
  const handleQrCodeScanned = async (qrData: string) => {
    setIsProcessing(true);
    setQrStatus('QRコードを解析中...');

    try {
      // Step 1: QRコードを解析
      console.log('📱 QRコード読み取り成功:', qrData);
      const parsedData = await parseQrCode(qrData);
      
      if (!parsedData.success) {
        throw new Error(parsedData.error || 'QRコードの解析に失敗しました');
      }

      setQrStatus('フォームに反映中...');

      // Step 2: バリデーション
      const validationErrors = FormBridgeHelpers.validateRequiredFields(parsedData.data);
      if (validationErrors.length > 0) {
        throw new Error(`データ検証エラー: ${validationErrors.join(', ')}`);
      }

      // Step 3: フォームデータ連携
      const success = await populateFormWithQrData(
        parsedData.data,
        setValue,
        searchMedicationByName
      );

      if (success) {
        setQrStatus('✅ QRコードの情報をフォームに反映しました');
      } else {
        throw new Error('フォームへの反映に失敗しました');
      }

    } catch (error) {
      console.error('QRコード処理エラー:', error);
      setQrStatus(`❌ エラー: ${error instanceof Error ? error.message : 'unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * フォーム送信ハンドラー
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('💾 処方記録保存中:', formData);
      
      // ここで実際の保存処理を実行
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('処方記録を保存しました');
      } else {
        throw new Error('保存に失敗しました');
      }
      
    } catch (error) {
      console.error('保存エラー:', error);
      alert(`保存エラー: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  };

  // フォーム入力ハンドラー
  const handleInputChange = (fieldName: string, value: string) => {
    setValue(fieldName, value);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">処方箋入力フォーム</h1>

      {/* QR読み取り状況表示 */}
      {qrStatus && (
        <div className={`p-4 mb-6 rounded-lg ${
          qrStatus.includes('❌') ? 'bg-red-100 text-red-700' : 
          qrStatus.includes('✅') ? 'bg-green-100 text-green-700' : 
          'bg-blue-100 text-blue-700'
        }`}>
          {qrStatus}
        </div>
      )}

      {/* QRコード読み取りボタン */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => {
            // QR読み取りコンポーネントを開く
            // 実際の実装では、SimpleQRReaderコンポーネントを使用
            console.log('QR読み取り開始');
          }}
          disabled={isProcessing}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isProcessing ? '処理中...' : 'QRコードを読み取る'}
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">処方日</label>
            <input
              type="date"
              value={formData.prescribedDate || ''}
              onChange={(e) => handleInputChange('prescribedDate', e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">患者名</label>
            <input
              type="text"
              value={formData.patientName || ''}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">年齢</label>
            <input
              type="text"
              value={formData.patientAge || ''}
              onChange={(e) => handleInputChange('patientAge', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* 薬剤情報 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">薬剤情報</h2>
          
          {/* 実際の実装では、薬剤配列をmap処理して動的に表示 */}
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">薬剤選択 *</label>
                  {/* 特殊な薬剤選択コンポーネント */}
                  <MedicationSelector
                    value={formData.medications?.[0]?.selectedMedication}
                    onChange={(medication) => setValue('medications[0].selectedMedication', medication)}
                    searchFunction={searchMedicationByName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">投与量</label>
                  <input
                    type="text"
                    value={formData.medications?.[0]?.dosage || ''}
                    onChange={(e) => setValue('medications[0].dosage', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="例: 5mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">服用頻度</label>
                  <input
                    type="text"
                    value={formData.medications?.[0]?.frequency || ''}
                    onChange={(e) => setValue('medications[0].frequency', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="例: 1日1回"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">服用期間</label>
                  <input
                    type="text"
                    value={formData.medications?.[0]?.duration || ''}
                    onChange={(e) => setValue('medications[0].duration', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="例: 7日間"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">服用方法・備考</label>
                <textarea
                  value={formData.medications?.[0]?.instructions || ''}
                  onChange={(e) => setValue('medications[0].instructions', e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="例: 食後に服用"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isValid || isProcessing}
            className={`px-6 py-2 rounded font-medium ${
              isValid && !isProcessing
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? '保存中...' : '処方記録を保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * 医薬品選択用の特殊コンポーネント（実装例）
 */
interface MedicationSelectorProps {
  value?: MedicationObject;
  onChange: (medication: MedicationObject) => void;
  searchFunction: (name: string) => Promise<MedicationObject | null>;
}

function MedicationSelector({ value, onChange, searchFunction }: MedicationSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState(value?.name || '');
  const [suggestions, setSuggestions] = React.useState<MedicationObject[]>([]);
  const [selectedMedication, setSelectedMedication] = React.useState<MedicationObject | null>(value || null);

  // 検索処理
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.length >= 2) {
      try {
        const result = await searchFunction(term);
        setSuggestions(result ? [result] : []);
      } catch (error) {
        console.error('検索エラー:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  // 薬剤選択処理
  const handleSelect = (medication: MedicationObject) => {
    setSelectedMedication(medication);
    setSearchTerm(medication.name);
    setSuggestions([]);
    onChange(medication);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="薬剤名を入力して検索..."
      />
      
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {suggestions.map((med) => (
            <button
              key={med.id}
              type="button"
              onClick={() => handleSelect(med)}
              className="w-full text-left p-2 hover:bg-gray-100"
            >
              {med.name}
            </button>
          ))}
        </div>
      )}
      
      {selectedMedication && (
        <div className="mt-2 text-sm text-green-600">
          ✓ 選択済み: {selectedMedication.name}
        </div>
      )}
    </div>
  );
}

export default PrescriptionFormWithQrIntegration;
