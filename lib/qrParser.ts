// 薬剤情報インターフェース
export interface MedicationInfo {
  patientName: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescriptionDate: string;
  hospitalName: string;
  rawData: string;
}

// JAHIS標準準拠パーサーをインポート
import { JahisQrParser } from './jahisStandardParser';

// 内部処理用の薬剤データ
interface Medication {
  name: string;
  quantity: string;
  unit: string;
  dosage: string;
  days: string;
}

// パース済みQRデータ
interface ParsedQrData {
  prescribedDate: string;
  hospitalCode: string;
  medications: Medication[];
  rawData: string;
}

export class SimpleJahisParser {
  /**
   * QRコードデータを解析してメディケーション情報を抽出
   * JAHIS標準準拠パーサーを優先的に使用
   */
  static parseQRData(qrData: string): MedicationInfo | null {
    try {
      console.log('🔍 統合QR解析開始:', qrData.substring(0, 100) + '...');
      console.log('データ長:', qrData.length);
      
      // まずJAHIS標準準拠パーサーを試行
      try {
        console.log('📋 JAHIS標準パーサーを試行...');
        const jahisResult = JahisQrParser.parseQrData(qrData);
        if (jahisResult && jahisResult.medicationName !== '薬剤名不明') {
          console.log('✅ JAHIS標準パーサーで解析成功');
          return jahisResult;
        } else {
          console.log('📋 JAHIS標準パーサーでは解析できませんでした');
        }
      } catch (jahisError) {
        console.log('⚠️ JAHIS標準パーサーでエラー:', jahisError);
      }

      // フォールバック: 既存のカスタムパーサー
      console.log('📋 カスタムパーサーにフォールバック');
      return this.parseWithCustomLogic(qrData);

    } catch (error) {
      console.error('❌ 統合QR解析エラー:', error);
      return null;
    }
  }

  /**
   * 既存のカスタム解析ロジック
   */
  private static parseWithCustomLogic(qrData: string): MedicationInfo | null {
    try {
      // カンマ区切り形式をチェック
      if (/^\d+,/.test(qrData) && qrData.split(',').length > 10) {
        console.log('カンマ区切り形式として検出、parseNonJahisQrDataで解析します');
        const parsedData = this.parseNonJahisQrData(qrData);
        
        if (parsedData && parsedData.medications.length > 0) {
          // 複数薬剤が検出された場合のログ
          if (parsedData.medications.length > 1) {
            console.log(`✅ ${parsedData.medications.length}種類の薬剤を検出しました:`);
            parsedData.medications.forEach((med, index) => {
              console.log(`  薬剤${index + 1}: ${med.name} - ${med.quantity}${med.unit} - ${med.dosage} - ${med.days}日分`);
            });
            console.log('フォームには最初の薬剤情報を入力します。');
          }
          
          // ParsedQrDataをMedicationInfoに変換（最初の薬剤を使用）
          const firstMed = parsedData.medications[0];
          return {
            patientName: '患者名不明',
            patientId: `QR-${Date.now()}`,
            medicationName: firstMed.name,
            dosage: `${firstMed.quantity}${firstMed.unit}`,
            frequency: firstMed.dosage || '用法不明',
            duration: firstMed.days ? `${firstMed.days}日分` : '期間不明',
            prescriptionDate: parsedData.prescribedDate,
            hospitalName: parsedData.hospitalCode || '病院名不明',
            rawData: qrData
          };
        }
      }
      
      // JAHISヘッダーの確認
      if (!qrData.startsWith('JAHIS')) {
        // 一般的なテキストQRコードの場合のフォールバック
        return this.parseTextQRCode(qrData);
      }

      // JAHISフォーマットの基本的な解析
      return this.parseJahisFormat(qrData);

    } catch (error) {
      console.error('カスタムQR解析エラー:', error);
      return null;
    }
  }

  /**
   * JAHIS形式のQRコードを解析
   */
  private static parseJahisFormat(data: string): MedicationInfo | null {
    const sections = data.split('\x1C');
    let patientName = 'Unknown Patient';
    let patientId = 'Unknown ID';
    let medicationName = 'Unknown Medication';
    let dosage = '未定';
    let frequency = '1日3回';
    let duration = '7日間';
    let prescriptionDate = new Date().toISOString().split('T')[0];
    let hospitalName = 'Unknown Hospital';

    // セクション別解析
    sections.forEach((section, index) => {
      if (section.includes('患者') || section.includes('Patient')) {
        patientName = this.extractPatientName(section);
      }
      if (section.includes('薬品') || section.includes('Drug')) {
        medicationName = this.extractMedicationName(section);
      }
      if (section.includes('用量') || section.includes('Dose')) {
        dosage = this.extractDosage(section);
      }
    });

    return {
      patientName,
      patientId,
      medicationName,
      dosage,
      frequency,
      duration,
      prescriptionDate,
      hospitalName,
      rawData: data
    };
  }

  /**
   * 一般的なテキストQRコードを解析
   */
  private static parseTextQRCode(data: string): MedicationInfo {
    const sections = data.split(/[\n\r,;]/);
    let patientName = 'Unknown Patient';
    let patientId = 'Unknown ID';
    let medicationName = 'Unknown Medication';
    let dosage = '未定';
    let frequency = '1日3回';
    let duration = '7日間';
    let prescriptionDate = new Date().toISOString().split('T')[0];
    let hospitalName = 'Unknown Hospital';

    // セクション別解析
    sections.forEach((section, index) => {
      if (section.includes('患者') || section.includes('Patient')) {
        patientName = this.extractPatientName(section);
      }
      if (section.includes('薬品') || section.includes('Drug')) {
        medicationName = this.extractMedicationName(section);
      }
      if (section.includes('用量') || section.includes('Dose')) {
        dosage = this.extractDosage(section);
      }
    });

    return {
      patientName,
      patientId,
      medicationName,
      dosage,
      frequency,
      duration,
      prescriptionDate,
      hospitalName,
      rawData: data
    };
  }

  private static extractPatientName(section: string): string {
    return section.replace(/患者|Patient|:/, '').trim() || 'Unknown Patient';
  }

  private static extractMedicationName(section: string): string {
    return section.replace(/薬品|Drug|:/, '').trim() || 'Unknown Medication';
  }

  private static extractDosage(section: string): string {
    return section.replace(/用量|Dose|:/, '').trim() || '未定';
  }

  /**
   * QRコードデータをデバッグ出力（統合版）
   */
  static debugQRData(data: string): void {
    console.log('=== 統合QR Data Debug ===');
    console.log('Length:', data.length);
    console.log('First 100 chars:', data.substring(0, 100));
    
    // JAHIS標準パーサーのデバッグ
    JahisQrParser.debugQrData(data);
    
    // 従来のデバッグ情報
    console.log('Hex dump (first 50 bytes):', 
      data.substring(0, 50).split('').map(c => 
        c.charCodeAt(0).toString(16).padStart(2, '0')
      ).join(' ')
    );
    
    // セパレータの検出
    const separators = ['\x1C', '\x1D', '\x1E', '\x1F'];
    separators.forEach(sep => {
      const count = (data.match(new RegExp(sep, 'g')) || []).length;
      if (count > 0) {
        console.log(`Separator ${sep.charCodeAt(0).toString(16)}: ${count} occurrences`);
      }
    });
  }

  /**
   * カンマ区切り形式のQRコードデータを解析
   * 例: "32971101830,1 301,1,1 日 1 回(朝食) 2 錠毎,1,調剤,5,1,,1 201,2,ベタメタゾンリン酸塩錠10mg「タナベ」,2,錠,4,4980022F2042,1 301,2,,(朝 タ)食後,30,日分,1,1,,1 201,3,エピナスチン塩酸塩点眼液0.05%「日点」,10,mL,4,1319762Q1117,1 301,3,,両眼に1日4回「朝」,1,調剤,,5,1,,1"
   */
  static parseNonJahisQrData(data: string): ParsedQrData | null {
    try {
      console.log('=== カンマ区切り形式QRコード解析開始 ===');
      console.log('データ長:', data.length);
      console.log('データ:', data.substring(0, 200) + '...');

      const parts = data.split(',');
      console.log('分割された要素数:', parts.length);

      // 結果オブジェクトの初期化
      const result: ParsedQrData = {
        prescribedDate: '',
        hospitalCode: '',
        medications: [],
        rawData: data
      };

      // 最初の要素（処方日の可能性）
      if (parts[0] && /^\d{8,}$/.test(parts[0])) {
        // 8桁以上の数字を日付として解釈（例: 20240912 -> 2024-09-12）
        const dateStr = parts[0];
        if (dateStr.length >= 8) {
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          result.prescribedDate = `${year}-${month}-${day}`;
        }
      }

      // 薬剤情報を格納する配列
      const medications: { [key: string]: Partial<Medication> } = {};
      
      let i = 1; // 最初の要素（日付）はスキップ
      
      while (i < parts.length) {
        const current = parts[i];
        
        // 201: 薬剤情報レコード
        if (current && current.trim() === '201') {
          const medicationIndex = parts[i + 1]; // 薬剤番号
          const medicationName = parts[i + 2];  // 薬剤名
          const quantity = parts[i + 3];        // 量
          const unit = parts[i + 4];           // 単位
          
          if (medicationIndex && medicationName) {
            if (!medications[medicationIndex]) {
              medications[medicationIndex] = {};
            }
            medications[medicationIndex].name = medicationName || '';
            medications[medicationIndex].quantity = quantity || '';
            medications[medicationIndex].unit = unit || '';
            
            console.log(`薬剤 ${medicationIndex}:`, {
              name: medicationName,
              quantity: quantity,
              unit: unit
            });
          }
          
          i += 6; // 201レコードの標準的な長さをスキップ
        }
        // 301: 用法・用量レコード
        else if (current && current.trim() === '301') {
          const medicationIndex = parts[i + 1]; // 薬剤番号
          const unknown1 = parts[i + 2];        // 不明フィールド
          const dosageInfo = parts[i + 3];      // 用法情報
          const daysInfo = parts[i + 4];        // 日数情報
          
          if (medicationIndex) {
            if (!medications[medicationIndex]) {
              medications[medicationIndex] = {};
            }
            medications[medicationIndex].dosage = dosageInfo || '';
            
            // 日数の抽出（"30" や "30日分" から数字を抽出）
            if (daysInfo) {
              const daysMatch = daysInfo.match(/(\d+)/);
              medications[medicationIndex].days = daysMatch ? daysMatch[1] : '';
            }
            
            console.log(`用法 ${medicationIndex}:`, {
              dosage: dosageInfo,
              days: medications[medicationIndex].days
            });
          }
          
          i += 8; // 301レコードの標準的な長さをスキップ
        }
        else {
          i++; // 不明なレコードはスキップ
        }
      }

      // 薬剤情報を配列に変換
      Object.keys(medications).forEach(key => {
        const med = medications[key];
        if (med.name) { // 薬剤名があるもののみ追加
          result.medications.push({
            name: med.name || '',
            quantity: med.quantity || '',
            unit: med.unit || '',
            dosage: med.dosage || '',
            days: med.days || ''
          });
        }
      });

      // 処理完了後、複数薬剤が見つかった場合の統計情報
      const medicationCount = result.medications.length;
      if (medicationCount > 1) {
        console.log(`🔍 合計${medicationCount}種類の薬剤が見つかりました`);
        
        // 各薬剤の詳細情報をログ出力
        result.medications.forEach((med, index) => {
          console.log(`  [${index + 1}] ${med.name}`);
          console.log(`      用量: ${med.quantity}${med.unit}`);
          console.log(`      用法: ${med.dosage}`);
          console.log(`      日数: ${med.days}日分`);
        });
      }

      console.log('解析結果:', result);
      console.log('検出された薬剤数:', result.medications.length);

      return result.medications.length > 0 ? result : null;

    } catch (error) {
      console.error('カンマ区切り形式の解析エラー:', error);
      return null;
    }
  }
}
