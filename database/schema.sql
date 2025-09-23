-- MedTracker データベーススキーマ
-- Supabase用のテーブル作成スクリプト

-- 1. 薬剤マスターテーブル
CREATE TABLE IF NOT EXISTS medications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    drug_name TEXT NOT NULL,
    generic_name TEXT,
    manufacturer TEXT NOT NULL,
    strength TEXT NOT NULL,
    dosage_form TEXT NOT NULL,
    route_of_administration TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 薬剤記録テーブル（ユーザーの処方記録）
CREATE TABLE IF NOT EXISTS medication_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    prescription_date DATE NOT NULL,
    prescribed_by TEXT,
    hospital_name TEXT,
    dosage_amount DECIMAL(10,2) NOT NULL,
    dosage_unit TEXT NOT NULL,
    frequency_per_day INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    total_amount DECIMAL(10,2),
    instructions TEXT,
    pharmacy_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 服用記録テーブル
CREATE TABLE IF NOT EXISTS dose_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_record_id UUID REFERENCES medication_records(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_time TIMESTAMP WITH TIME ZONE,
    taken BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    date_of_birth DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_medication_records_user_id ON medication_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_records_user_id ON dose_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_records_scheduled_time ON dose_records(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Row Level Security (RLS) ポリシーの有効化
ALTER TABLE medication_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dose_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- medication_records のポリシー
CREATE POLICY "Users can view own medication records" ON medication_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication records" ON medication_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication records" ON medication_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication records" ON medication_records
    FOR DELETE USING (auth.uid() = user_id);

-- dose_records のポリシー
CREATE POLICY "Users can view own dose records" ON dose_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dose records" ON dose_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dose records" ON dose_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dose records" ON dose_records
    FOR DELETE USING (auth.uid() = user_id);

-- user_profiles のポリシー
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- トリガー関数：updated_at の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_records_updated_at BEFORE UPDATE ON medication_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dose_records_updated_at BEFORE UPDATE ON dose_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータの挿入（テスト用）
INSERT INTO medications (drug_name, manufacturer, strength, dosage_form, route_of_administration) VALUES
('ロキソプロフェンナトリウム', '第一三共', '60mg', '錠剤', '経口'),
('アムロジピンベシル酸塩', 'ファイザー', '5mg', '錠剤', '経口'),
('オメプラゾール', 'アステラス製薬', '20mg', 'カプセル', '経口')
ON CONFLICT DO NOTHING;
