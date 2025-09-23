/**
 * QRコード解析結果をReactフォームに連携するためのブリッジ関数
 * 特に薬剤選択コンポーネントのデータベース連携と特殊コンポーネント対応を含む
 */

// 型定義
export interface MedicationObject {
  id: string;
  name: string;
  [key: string]: any; // その他の医薬品プロパティ
}

export interface QRParsedData {
  format?: string;
  prescribedDate?: string;
  patientInfo?: {
    name?: string;
    age?: string;
    gender?: string;
    [key: string]: any;
  };
  medications?: Array<{
    name?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
    [key: string]: any;
  }>;
  // unifiedQrParserからの型との互換性のため追加
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  [key: string]: any;
}

export interface FormSetValueFunction {
  (fieldName: string, value: any, options?: any): void;
}

export interface SearchMedicationFunction {
  (name: string): Promise<MedicationObject | null>;
}

/**
 * QRコード解析結果をフォームに反映する非同期関数
 * @param parsedData - QRコードから解析されたデータ
 * @param setValue - React Hook Formのsetvalue関数
 * @param searchMedicationByName - 医薬品マスター検索関数
 * @returns Promise<boolean> - 成功時true、エラー時false
 */
export async function populateFormWithQrData(
  parsedData: QRParsedData,
  setValue: FormSetValueFunction,
  searchMedicationByName: SearchMedicationFunction
): Promise<boolean> {
  try {
    console.log('🔄 フォームデータ連携開始:', parsedData);

    // Step 2: 単純なフィールドのマッピング
    await populateSimpleFields(parsedData, setValue);

    // Step 3-6: 薬剤情報の処理
    if (parsedData.medications && Array.isArray(parsedData.medications)) {
      await populateMedicationFields(parsedData.medications, setValue, searchMedicationByName);
    }

    console.log('✅ フォームデータ連携完了');
    return true;

  } catch (error) {
    console.error('❌ フォームデータ連携エラー:', error);
    return false;
  }
}

/**
 * 単純なテキストフィールドをフォームに設定
 */
async function populateSimpleFields(
  parsedData: QRParsedData,
  setValue: FormSetValueFunction
): Promise<void> {
  console.log('📝 単純フィールドの設定開始');

  // 処方日の設定
  if (parsedData.prescribedDate) {
    setValue('prescribedDate', parsedData.prescribedDate);
    console.log(`  📅 処方日設定: ${parsedData.prescribedDate}`);
  }

  // 患者情報の設定（両方の形式に対応）
  if (parsedData.patientInfo) {
    const { patientInfo } = parsedData;
    
    if (patientInfo.name) {
      setValue('patientName', patientInfo.name);
      console.log(`  👤 患者名設定: ${patientInfo.name}`);
    }
    
    if (patientInfo.age) {
      setValue('patientAge', patientInfo.age);
      console.log(`  🎂 年齢設定: ${patientInfo.age}`);
    }
    
    if (patientInfo.gender) {
      setValue('patientGender', patientInfo.gender);
      console.log(`  ⚥ 性別設定: ${patientInfo.gender}`);
    }
  } else {
    // フラットな構造の場合
    if (parsedData.patientName) {
      setValue('patientName', parsedData.patientName);
      console.log(`  👤 患者名設定: ${parsedData.patientName}`);
    }
    
    if (parsedData.patientAge) {
      setValue('patientAge', parsedData.patientAge);
      console.log(`  🎂 年齢設定: ${parsedData.patientAge}`);
    }
    
    if (parsedData.patientGender) {
      setValue('patientGender', parsedData.patientGender);
      console.log(`  ⚥ 性別設定: ${parsedData.patientGender}`);
    }
  }

  // その他のメタデータ
  if (parsedData.format) {
    setValue('qrFormat', parsedData.format);
    console.log(`  📊 QR形式: ${parsedData.format}`);
  }
}

/**
 * 薬剤情報をフォームに設定（医薬品マスター連携含む）
 */
async function populateMedicationFields(
  medications: Array<any>,
  setValue: FormSetValueFunction,
  searchMedicationByName: SearchMedicationFunction
): Promise<void> {
  console.log(`💊 薬剤情報の設定開始 (${medications.length}件)`);

  // 既存の薬剤配列をクリア
  setValue('medications', []);

  for (let index = 0; index < medications.length; index++) {
    const medication = medications[index];
    console.log(`  🔍 薬剤 ${index + 1} 処理中:`, medication);

    try {
      // Step 4: 医薬品のデータ照合（最重要）
      let medicationObject: MedicationObject | null = null;
      
      if (medication.name) {
        console.log(`    🔎 医薬品検索中: "${medication.name}"`);
        medicationObject = await searchMedicationByName(medication.name);
        
        if (medicationObject) {
          console.log(`    ✅ 医薬品発見:`, medicationObject);
        } else {
          console.warn(`    ⚠️ 医薬品が見つかりません: "${medication.name}"`);
          // 見つからない場合でも、部分的にデータを設定する
          medicationObject = {
            id: `unknown_${index}`,
            name: medication.name
          };
        }
      }

      // Step 5: 特殊コンポーネントへの値設定
      if (medicationObject) {
        setValue(`medications[${index}].selectedMedication`, medicationObject);
        console.log(`    💉 薬剤選択コンポーネント設定完了`);
      }

      // Step 6: 残りのフィールドのマッピング
      await setMedicationDetails(medication, index, setValue);

    } catch (error) {
      console.error(`    ❌ 薬剤 ${index + 1} 処理エラー:`, error);
      
      // エラーが発生しても、可能な限りデータを設定
      await setMedicationDetailsWithFallback(medication, index, setValue);
    }
  }

  console.log('💊 薬剤情報設定完了');
}

/**
 * 薬剤の詳細情報をフォームに設定
 */
async function setMedicationDetails(
  medication: any,
  index: number,
  setValue: FormSetValueFunction
): Promise<void> {
  // 投与量の設定
  if (medication.dosage) {
    setValue(`medications[${index}].dosage`, medication.dosage);
    console.log(`    💊 投与量: ${medication.dosage}`);
  }

  // 服用頻度の設定
  if (medication.frequency) {
    setValue(`medications[${index}].frequency`, medication.frequency);
    console.log(`    🕐 頻度: ${medication.frequency}`);
  }

  // 服用期間の設定
  if (medication.duration) {
    setValue(`medications[${index}].duration`, medication.duration);
    console.log(`    📅 期間: ${medication.duration}`);
  }

  // 服用方法・備考の設定
  if (medication.instructions) {
    setValue(`medications[${index}].instructions`, medication.instructions);
    console.log(`    📋 服用方法: ${medication.instructions}`);
  }

  // その他のフィールドがある場合の動的設定
  const standardFields = ['name', 'dosage', 'frequency', 'duration', 'instructions'];
  Object.keys(medication).forEach(key => {
    if (!standardFields.includes(key) && medication[key]) {
      setValue(`medications[${index}].${key}`, medication[key]);
      console.log(`    📝 ${key}: ${medication[key]}`);
    }
  });
}

/**
 * エラー時のフォールバック処理で薬剤詳細を設定
 */
async function setMedicationDetailsWithFallback(
  medication: any,
  index: number,
  setValue: FormSetValueFunction
): Promise<void> {
  try {
    // 最低限、名前だけでも設定
    if (medication.name) {
      setValue(`medications[${index}].medicationName`, medication.name);
      console.log(`    🔄 フォールバック - 薬剤名: ${medication.name}`);
    }

    // その他の利用可能なフィールドも設定
    await setMedicationDetails(medication, index, setValue);
    
  } catch (fallbackError) {
    console.error(`    ❌ フォールバック処理もエラー:`, fallbackError);
  }
}

/**
 * フォーム連携のヘルパー関数群
 */
export const FormBridgeHelpers = {
  /**
   * 薬剤名の正規化（検索精度向上のため）
   */
  normalizeMedicationName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // 複数スペースを1つに
      .replace(/[　\u3000]/g, ' ') // 全角スペースを半角に
      .toLowerCase();
  },

  /**
   * 日付フォーマットの標準化
   */
  standardizeDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD形式
    } catch {
      return dateString; // 変換できない場合は元の値を返す
    }
  },

  /**
   * バリデーション: 必須フィールドのチェック
   */
  validateRequiredFields(parsedData: QRParsedData): string[] {
    const errors: string[] = [];
    
    if (!parsedData.medications || parsedData.medications.length === 0) {
      errors.push('薬剤情報が見つかりません');
    }

    parsedData.medications?.forEach((med, index) => {
      if (!med.name) {
        errors.push(`薬剤${index + 1}: 薬剤名が必要です`);
      }
    });

    return errors;
  }
};

/**
 * 使用例とテスト用のサンプル実装
 */
export const SampleImplementation = {
  /**
   * 医薬品検索のモック実装（実際の実装に置き換えてください）
   */
  async mockSearchMedicationByName(name: string): Promise<MedicationObject | null> {
    // 実際の実装では、データベースやAPIから検索
    const mockDatabase: MedicationObject[] = [
      { id: '1', name: 'アムロジピン錠5mg' },
      { id: '2', name: 'リシノプリル錠10mg' },
      { id: '3', name: 'メトホルミン錠500mg' },
    ];

    const normalizedSearchName = FormBridgeHelpers.normalizeMedicationName(name);
    
    return mockDatabase.find(med => 
      FormBridgeHelpers.normalizeMedicationName(med.name).includes(normalizedSearchName)
    ) || null;
  },

  /**
   * React Hook Formのsetvalueのモック実装
   */
  mockSetValue: (fieldName: string, value: any) => {
    console.log(`📝 SetValue: ${fieldName} = `, value);
  }
};
