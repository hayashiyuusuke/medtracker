export interface Medication {
  id: string;
  drug_name: string;
  generic_name?: string;
  manufacturer: string;
  strength: string;
  dosage_form: string;
  route_of_administration: string;
  yj_code?: string;  // YJコード（医薬品コード）
  price?: number;    // 薬価
  created_at?: string;
  updated_at?: string;
}

export interface MedicationRecord {
  id: string;
  user_id: string;
  medication_id: string;
  prescription_date: string;
  prescribed_by?: string;
  hospital_name?: string;
  dosage_amount: number;
  dosage_unit: string;
  frequency_per_day: number;
  duration_days: number;
  total_amount?: number;
  instructions?: string;
  pharmacy_name?: string;
  created_at?: string;
  updated_at?: string;
  medication?: Medication;
}

export interface MedicationRecordFormData {
  prescription_date: string;
  prescribed_by: string;
  hospital_name: string;
  pharmacy_name: string;
  dosage_amount: number;
  dosage_unit: string;
  frequency_per_day: number;
  duration_days: number;
  total_amount: number;
  instructions: string;
}

export interface DoseRecord {
  id: string;
  user_id: string;
  medication_record_id: string;
  scheduled_time: string;
  actual_time?: string;
  taken: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  medication_record?: MedicationRecord;
}

// QRコード解析結果の統一データ形式
export interface MedicationData {
  prescribedDate: string;                    // 処方日 (YYYY-MM-DD)
  hospitalName: string;                      // 医療機関名
  patientName: string;                       // 患者氏名
  medications: ParsedMedication[];           // 薬剤リスト
  rawData?: string;                         // 元データ（デバッグ用）
}

// QRコード解析結果の薬剤情報型（unifiedQrParser用）
export interface ParsedMedication {
  name: string;       // 薬剤名
  usage_text: string; // 用法・用量（表示用・正データ）
  estimated_count?: number | null; // 推定1日回数
  estimated_dose?: number | null;  // 推定1回量
  quantity?: string;  // 総数量
  unit?: string;      // 単位
  days?: string;      // 処方日数
}

// 解析エラー情報
export interface ParseError {
  code: string;
  message: string;
  details?: any;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  created_at?: string;
  updated_at?: string;
}
