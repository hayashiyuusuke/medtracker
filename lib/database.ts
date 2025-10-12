import { supabase } from './supabaseClient';
import type { 
  Medication, 
  MedicationRecord, 
  MedicationRecordFormData, 
  DoseRecord, 
  UserProfile 
} from '../types/database';

// MedicationService　この関数は、「薬品名で検索して返す」
export const medicationService = {
  async search(query: string): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')/* medicationsというテーブルの */
      .select('*')/* 全部を対象とする */
      .or(`drug_name.ilike.%${query}%,generic_name.ilike.%${query}%`)/* 商品名または一般名で部分一致検索(ilike)。％はワイルドカードといい、前後に任意の文字列が入ることを示す。 */
      .order('drug_name')/* drug_nameカラムであいうえお順に並び替え */
      .limit(20);/* 最大20件まで */

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
      .eq('id', id)/* idカラムが引数の id と等しいレコードを取得 */
      .single();/* 結果を1件だけ取得し、配列ではなく単一オブジェクトで返す */

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

// 「新しい処方記録をデータベースに登録する」関数
export const medicationRecordService = {
  async createMedicationRecord(userId: string, formData: MedicationRecordFormData & { medication_id: string }): Promise<MedicationRecord | null> { /* formData = フォームで入力されたデータ(MedicationRecordFormData) かつ 薬品ID(medication_id  という変数と定義した) */
    const recordData = {
      user_id: userId,/* MedicationRecordFormDataにuserIdは含まれていないからこの1文は必要 （ここで特定のユーザーに紐付けが完了しているので.eq('user_id', userId)は不要）*/
      ...formData/* フォームで入力されたデータ(MedicationRecordFormData)をスプレッド構文で展開 */
    };/* つまり userId + formData = recordData */

    const { data, error } = await supabase
      .from('medication_records')
      .insert(recordData)
      .select(`*, medication:medications(*)`)/* ＊ = medication_records テーブルの全カラム,medications(*) = medications テーブルの全カラム　medication:とプロパティ名をつけることでテーブル名がそのままプロパティ名になる & 役割としてはmedication_records の medication_id と medications の id を自動で紐づける*/
      .single();/* .single()とすることで配列ではなくひとつのオブジェクトとして返す */

    if (error) {
      console.error('Error creating medication record:', error);
      throw error;
    }

    return data;/* || []が要らない理由は、単一オブジェクトを戻り値として返すため。また、Promise で null を返すことも想定している（60行目） */
  },

  async getUserMedicationRecords(userId: string): Promise<MedicationRecord[]> { /* 特定のユーザーの全ての処方記録を取得するための関数 */
    const { data, error } = await supabase
      .from('medication_records')
      .select(`
        *,
        medication:medications(*)
      `)
      .eq('user_id', userId)/* そのユーザーの処方記録だけを絞り込み、他のユーザーのデータは取得しない */
      .order('prescription_date', { ascending: false });/* 数字、日付、文字列の識別は supabase が自動でしてくれる。ascending: false は降順を意味する */

    if (error) {
      console.error('Error fetching medication records:', error);
      throw error;
    }

    return data || [];
  },

  async getById(id: string): Promise<MedicationRecord | null> { /* IDを指定して1件だけ処方記録を取得する関数 */
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

  async updateMedicationRecord(id: string, updates: Partial<MedicationRecordFormData>): Promise<MedicationRecord | null> { /* 既存の処方記録を更新する関数 */
    const { data, error } = await supabase /* Partial<T> とはTypeScriptの組み込み型。「全てのプロパティを任意にする」という意味。 一部のプロパティのみを更新したい場合に使われる */
      .from('medication_records')
      .update(updates)/* updates オブジェクトに含まれるフィールドだけを更新 */
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

  async deleteMedicationRecord(id: string): Promise<boolean> { /* 既存の処方記録を削除する関数 */
    const { error } = await supabase
      .from('medication_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting medication record:', error);
      throw error;
    }

    return true;/* promise が boolean のため、戻り値は常に true か false になる */
  }
};

export const doseRecordService = { /* 「服用記録」を管理する役割 */
  async createDoseRecord(userId: string, medicationRecordId: string, scheduledTime: string): Promise<DoseRecord | null> { /* 服用記録を作成する関数 */
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
      `) /* 2段階JOIN */
      .single();

    if (error) {
      console.error('Error creating dose record:', error);
      throw error;
    }

    return data;
  },

  async markDoseTaken(id: string, actualTime?: string, notes?: string): Promise<DoseRecord | null> { /* 服用記録を「服用済み」としてマークする関数 */
    const { data, error } = await supabase /* ?　は任意の値を表すために使われる */
      .from('dose_records')
      .update({
        taken: true,
        actual_time: actualTime || new Date().toISOString(), 
        /* || (OR演算子) の動作: 左側が truthy → 左側を使う。左側が falsy (undefined, null) → 右側を使う。 
         * new Date()は現在の日時を表すJavaScript の組み込みオブジェクト。
         * .toISOString()はDate オブジェクトを ISO 8601形式の文字列に変換するメソッド。ISO 8601形式とは国際標準規格の日時表現形式
         */
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

  async getUserDoseRecords(userId: string, date?: string): Promise<DoseRecord[]> { /* 服用記録を取得する関数 */
    let query = supabase
      .from('dose_records')
      .select(`
        *,
        medication_record:medication_records(
          *,
          medication:medications(*)
        )
      `)
      .eq('user_id', userId); /* user_idはデータベースの変数名。userIdはJavaScript/TypeScriptの変数名。user_idで統一できないのは、JavaScript/TypeScriptの変数名はキャメルケースで書くのが一般的だから */

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
