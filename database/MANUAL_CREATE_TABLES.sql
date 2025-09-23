-- Supabase Dashboard の SQL Editor で実行してください

-- 1. dose_records テーブルの作成
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

-- 2. user_profiles テーブルの作成
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

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_dose_records_user_id ON dose_records(user_id);
CREATE INDEX IF NOT EXISTS idx_dose_records_scheduled_time ON dose_records(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 4. Row Level Security (RLS) ポリシーの有効化
ALTER TABLE dose_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. dose_records のポリシー
CREATE POLICY "Users can view own dose records" ON dose_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dose records" ON dose_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dose records" ON dose_records
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dose records" ON dose_records
    FOR DELETE USING (auth.uid() = user_id);

-- 6. user_profiles のポリシー
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);
