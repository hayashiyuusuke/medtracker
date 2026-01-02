export interface Medication { // 薬剤情報の型定義
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

export interface MedicationRecord {// 処方記録の型定義
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
  notification_times?: string[]; // 通知時間のリスト (例: ["08:00", "12:00"])
  created_at?: string;
  updated_at?: string;
  medication?: Medication;
}

export interface MedicationRecordFormData {// 処方記録の入力フォームのデータ型定義（まだ保存されていないから id や user_id がない。MedicationRecordを入力フォームのデータ型に使うとidがなくてエラーになってしまうため、この型が必要。）
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
  notification_times?: string[];
}

export interface DoseRecord {//服用チェックデータの型定義
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
export interface ParsedMedication {// MedicationRecord に変換される前の「中間データ」
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
