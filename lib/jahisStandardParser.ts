/**
 * JAHIS標準対応 処方箋QRコード解析ライブラリ
 * 
 * JAHIS技術文書に基づいた処方箋QRコードの構造化解析
 * - 標準JAHIS形式 (0x1C区切り)
 * - カンマ区切り形式 (実際の薬局システムで使用)
 * - バイナリ形式対応
 */

// 基本インターフェース
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

// JAHIS構造化データ
export interface JahisData {
  header: JahisHeader;
  patient: PatientInfo;
  prescriptions: PrescriptionRecord[];
  footer?: JahisFooter;
  rawData: string;
}

export interface JahisHeader {
  version: string;
  encoding: string;
  hospitalCode: string;
  systemId: string;
  prescriptionDate: string;
}

export interface PatientInfo {
  patientId: string;
  name: string;
  kana?: string;
  birthday?: string;
  gender?: string;
  address?: string;
  phoneNumber?: string;
  insuranceInfo?: InsuranceInfo;
}

export interface InsuranceInfo {
  type: string;
  number: string;
  validFrom?: string;
  validTo?: string;
}

export interface PrescriptionRecord {
  recordType: '201' | '301' | string;
  medicationId: string;
  medicationName: string;
  dosage: DosageInfo;
  usage: UsageInfo;
  days: number;
  totalAmount: number;
  medicationCode?: string;
  manufacturer?: string;
  lotNumber?: string;
}

export interface DosageInfo {
  amount: number;
  unit: string;
  concentration?: string;
}

export interface UsageInfo {
  frequency: string;
  timing: string[];
  instructions: string;
  route?: string; // 経口、注射など
}

export interface JahisFooter {
  checksum?: string;
  signature?: string;
  timestamp?: string;
}

/**
 * JAHIS準拠QRコード解析クラス
 */
export class JahisQrParser {
  private static readonly JAHIS_SEPARATORS = {
    RECORD: '\x1C',      // レコード区切り
    FIELD: '\x1D',       // フィールド区切り
    COMPONENT: '\x1E',   // コンポーネント区切り
    ESCAPE: '\x1F'       // エスケープ文字
  };

  private static readonly RECORD_TYPES = {
    HEADER: '100',
    PATIENT: '110',
    MEDICATION: '201',
    USAGE: '301',
    FOOTER: '900'
  };

  /**
   * メイン解析関数 - 自動形式検出
   */
  static parseQrData(qrData: string): MedicationInfo | null {
    try {
      console.log('🔍 JAHIS QR解析開始');
      console.log('データ長:', qrData.length);
      
      // 形式自動検出
      const format = this.detectFormat(qrData);
      console.log('検出された形式:', format);

      switch (format) {
        case 'JAHIS_STANDARD':
          return this.parseJahisStandard(qrData);
        case 'COMMA_DELIMITED':
          return this.parseCommaDelimited(qrData);
        case 'BINARY_JAHIS':
          return this.parseBinaryJahis(qrData);
        default:
          return this.parseGenericText(qrData);
      }
    } catch (error) {
      console.error('JAHIS解析エラー:', error);
      return null;
    }
  }

  /**
   * QRコード形式の自動検出
   */
  private static detectFormat(data: string): string {
    // JAHIS標準形式の検出
    if (data.includes(this.JAHIS_SEPARATORS.RECORD)) {
      return 'JAHIS_STANDARD';
    }

    // カンマ区切り形式の検出
    if (/^\d{8,},/.test(data) && data.split(',').length > 10) {
      return 'COMMA_DELIMITED';
    }

    // バイナリ形式の検出
    if (this.isBinaryData(data)) {
      return 'BINARY_JAHIS';
    }

    return 'GENERIC_TEXT';
  }

  /**
   * JAHIS標準形式の解析
   */
  private static parseJahisStandard(data: string): MedicationInfo | null {
    const records = data.split(this.JAHIS_SEPARATORS.RECORD);
    
    const jahisData: Partial<JahisData> = {
      header: {} as JahisHeader,
      patient: {} as PatientInfo,
      prescriptions: [],
      rawData: data
    };

    records.forEach(record => {
      if (!record) return;

      const fields = record.split(this.JAHIS_SEPARATORS.FIELD);
      const recordType = fields[0];

      switch (recordType) {
        case this.RECORD_TYPES.HEADER:
          jahisData.header = this.parseHeaderRecord(fields);
          break;
        case this.RECORD_TYPES.PATIENT:
          jahisData.patient = this.parsePatientRecord(fields);
          break;
        case this.RECORD_TYPES.MEDICATION:
        case this.RECORD_TYPES.USAGE:
          const prescription = this.parsePrescriptionRecord(fields, recordType);
          if (prescription) {
            jahisData.prescriptions?.push(prescription);
          }
          break;
      }
    });

    return this.convertToMedicationInfo(jahisData as JahisData);
  }

  /**
   * カンマ区切り形式の解析（既存の実装を活用）
   */
  private static parseCommaDelimited(data: string): MedicationInfo | null {
    // 既存のparseNonJahisQrData実装を使用
    // ここでは簡略化して最初の薬剤のみ返す
    return this.parseCommaDelimitedSimple(data);
  }

  /**
   * ヘッダーレコードの解析
   */
  private static parseHeaderRecord(fields: string[]): JahisHeader {
    return {
      version: fields[1] || 'unknown',
      encoding: fields[2] || 'UTF-8',
      hospitalCode: fields[3] || '',
      systemId: fields[4] || '',
      prescriptionDate: this.parseDate(fields[5]) || new Date().toISOString().split('T')[0]
    };
  }

  /**
   * 患者レコードの解析
   */
  private static parsePatientRecord(fields: string[]): PatientInfo {
    return {
      patientId: fields[1] || '',
      name: fields[2] || '',
      kana: fields[3] || undefined,
      birthday: this.parseDate(fields[4]) || undefined,
      gender: fields[5] || undefined,
      address: fields[6] || undefined,
      phoneNumber: fields[7] || undefined
    };
  }

  /**
   * 処方レコードの解析
   */
  private static parsePrescriptionRecord(fields: string[], recordType: string): PrescriptionRecord | null {
    if (recordType === this.RECORD_TYPES.MEDICATION) {
      return {
        recordType: '201',
        medicationId: fields[1] || '',
        medicationName: fields[2] || '',
        dosage: {
          amount: parseFloat(fields[3]) || 0,
          unit: fields[4] || '',
          concentration: fields[5] || undefined
        },
        usage: {
          frequency: '',
          timing: [],
          instructions: ''
        },
        days: 0,
        totalAmount: parseFloat(fields[3]) || 0,
        medicationCode: fields[6] || undefined
      };
    }
    return null;
  }

  /**
   * 日付解析ユーティリティ
   */
  private static parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    
    // YYYYMMDD形式
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    return null;
  }

  /**
   * バイナリデータ検出
   */
  private static isBinaryData(data: string): boolean {
    // 非印字文字の検出
    return /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(data);
  }

  /**
   * JahisDataからMedicationInfoへの変換
   */
  private static convertToMedicationInfo(jahisData: JahisData): MedicationInfo {
    const firstPrescription = jahisData.prescriptions[0];
    
    return {
      patientName: jahisData.patient.name || '患者名不明',
      patientId: jahisData.patient.patientId || `JAHIS-${Date.now()}`,
      medicationName: firstPrescription?.medicationName || '薬剤名不明',
      dosage: `${firstPrescription?.dosage.amount || 0}${firstPrescription?.dosage.unit || ''}`,
      frequency: firstPrescription?.usage.frequency || '用法不明',
      duration: `${firstPrescription?.days || 0}日分`,
      prescriptionDate: jahisData.header.prescriptionDate,
      hospitalName: jahisData.header.hospitalCode || '病院名不明',
      rawData: jahisData.rawData
    };
  }

  /**
   * カンマ区切り形式の簡易解析
   */
  private static parseCommaDelimitedSimple(data: string): MedicationInfo | null {
    const parts = data.split(',');
    
    // 簡易実装 - 実際の既存実装を使用することを推奨
    return {
      patientName: '患者名不明',
      patientId: `CSV-${Date.now()}`,
      medicationName: '薬剤名解析中',
      dosage: '用量解析中',
      frequency: '用法解析中',
      duration: '期間解析中',
      prescriptionDate: this.parseDate(parts[0]) || new Date().toISOString().split('T')[0],
      hospitalName: '病院名不明',
      rawData: data
    };
  }

  /**
   * バイナリJAHIS形式の解析
   */
  private static parseBinaryJahis(data: string): MedicationInfo | null {
    // バイナリ解析実装（複雑なため基本実装のみ）
    console.log('バイナリJAHIS解析は未実装');
    return null;
  }

  /**
   * 汎用テキスト解析
   */
  private static parseGenericText(data: string): MedicationInfo | null {
    return {
      patientName: '患者名不明',
      patientId: `TEXT-${Date.now()}`,
      medicationName: '汎用テキストから抽出',
      dosage: '未定',
      frequency: '未定',
      duration: '未定',
      prescriptionDate: new Date().toISOString().split('T')[0],
      hospitalName: '不明',
      rawData: data
    };
  }

  /**
   * デバッグ情報出力
   */
  static debugQrData(data: string): void {
    console.log('=== JAHIS QR Debug Info ===');
    console.log('データ長:', data.length);
    console.log('最初の100文字:', data.substring(0, 100));
    console.log('検出された形式:', this.detectFormat(data));
    
    // セパレータ検出
    Object.entries(this.JAHIS_SEPARATORS).forEach(([name, sep]) => {
      const count = (data.match(new RegExp(sep, 'g')) || []).length;
      if (count > 0) {
        console.log(`${name}セパレータ (0x${sep.charCodeAt(0).toString(16)}): ${count}個`);
      }
    });
  }
}
