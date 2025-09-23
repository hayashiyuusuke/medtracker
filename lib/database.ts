import { supabase } from './supabaseClient';
import type { 
  Medication, 
  MedicationRecord, 
  MedicationRecordFormData, 
  DoseRecord, 
  UserProfile 
} from '../types/database';

// Medication Service
export const medicationService = {
  async search(query: string): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .or(`drug_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
      .order('drug_name')
      .limit(20);

    if (error) {
      console.error('Error searching medications:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<Medication | null> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching medication:', error);
      throw error;
    }

    return data;
  },

  async getAll(): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .order('drug_name');

    if (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }

    return data || [];
  }
};

// Medication Record Service
export const medicationRecordService = {
  async createMedicationRecord(userId: string, formData: MedicationRecordFormData & { medication_id: string }): Promise<MedicationRecord | null> {
    const recordData = {
      user_id: userId,
      medication_id: formData.medication_id,
      prescription_date: formData.prescription_date,
      prescribed_by: formData.prescribed_by,
      hospital_name: formData.hospital_name,
      dosage_amount: formData.dosage_amount,
      dosage_unit: formData.dosage_unit,
      frequency_per_day: formData.frequency_per_day,
      duration_days: formData.duration_days,
      total_amount: formData.total_amount,
      instructions: formData.instructions,
      pharmacy_name: formData.pharmacy_name
    };

    const { data, error } = await supabase
      .from('medication_records')
      .insert(recordData)
      .select(`
        *,
        medication:medications(*)
      `)
      .single();

    if (error) {
      console.error('Error creating medication record:', error);
      throw error;
    }

    return data;
  },

  async getUserMedicationRecords(userId: string): Promise<MedicationRecord[]> {
    const { data, error } = await supabase
      .from('medication_records')
      .select(`
        *,
        medication:medications(*)
      `)
      .eq('user_id', userId)
      .order('prescription_date', { ascending: false });

    if (error) {
      console.error('Error fetching medication records:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<MedicationRecord | null> {
    const { data, error } = await supabase
      .from('medication_records')
      .select(`
        *,
        medication:medications(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching medication record:', error);
      throw error;
    }

    return data;
  },

  async updateMedicationRecord(id: string, updates: Partial<MedicationRecordFormData>): Promise<MedicationRecord | null> {
    const { data, error } = await supabase
      .from('medication_records')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        medication:medications(*)
      `)
      .single();

    if (error) {
      console.error('Error updating medication record:', error);
      throw error;
    }

    return data;
  },

  async deleteMedicationRecord(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('medication_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting medication record:', error);
      throw error;
    }

    return true;
  }
};

// Dose Record Service
export const doseRecordService = {
  async createDoseRecord(userId: string, medicationRecordId: string, scheduledTime: string): Promise<DoseRecord | null> {
    const { data, error } = await supabase
      .from('dose_records')
      .insert({
        user_id: userId,
        medication_record_id: medicationRecordId,
        scheduled_time: scheduledTime,
        taken: false
      })
      .select(`
        *,
        medication_record:medication_records(
          *,
          medication:medications(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error creating dose record:', error);
      throw error;
    }

    return data;
  },

  async markDoseTaken(id: string, actualTime?: string, notes?: string): Promise<DoseRecord | null> {
    const { data, error } = await supabase
      .from('dose_records')
      .update({
        taken: true,
        actual_time: actualTime || new Date().toISOString(),
        notes: notes
      })
      .eq('id', id)
      .select(`
        *,
        medication_record:medication_records(
          *,
          medication:medications(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error marking dose as taken:', error);
      throw error;
    }

    return data;
  },

  async getUserDoseRecords(userId: string, date?: string): Promise<DoseRecord[]> {
    let query = supabase
      .from('dose_records')
      .select(`
        *,
        medication_record:medication_records(
          *,
          medication:medications(*)
        )
      `)
      .eq('user_id', userId);

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte('scheduled_time', startOfDay.toISOString())
        .lte('scheduled_time', endOfDay.toISOString());
    }

    const { data, error } = await query.order('scheduled_time');

    if (error) {
      console.error('Error fetching dose records:', error);
      throw error;
    }

    return data || [];
  },

  async getTodaysDoses(userId: string): Promise<DoseRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getUserDoseRecords(userId, today);
  }
};

// User Profile Service
export const userProfileService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  },

  async createOrUpdateUserProfile(userId: string, profileData: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }

    return data;
  }
};
