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

export interface MedicationRecordFormData {
  prescription_date: string;
  prescribed_by: string;
  hospital_name: string;
  dosage_amount: number;
  dosage_unit: string;
  frequency_per_day: number;
  duration_days: number;
  total_amount: number;
  instructions: string;
  pharmacy_name: string;
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

export interface QRCodeData {
  prescription_date?: string;
  hospital_name?: string;
  prescribed_by?: string;
  pharmacy_name?: string;
  medications?: Array<{
    name: string;
    dosage_amount: number;
    dosage_unit: string;
    frequency_per_day: number;
    duration_days: number;
    total_amount?: number;
    instructions?: string;
  }>;
}

// QRコードから検出された薬剤データの型
export interface QrMedicationData {
  name: string;
  quantity: string;
  unit: string;
  dosage: string;
  days: string;
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
