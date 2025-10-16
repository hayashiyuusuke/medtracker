-- Step 1: 不足している列を medications テーブルに追加
-- これにより schema.sql と同じ構造になります

-- generic_name 列を追加（既に存在する場合はスキップ）
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS generic_name TEXT;

-- dosage_form 列を追加
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS dosage_form TEXT NOT NULL DEFAULT '錠剤';

-- route_of_administration 列を追加
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS route_of_administration TEXT NOT NULL DEFAULT '経口';

-- yj_code 列を追加（YJコード用）
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS yj_code VARCHAR(12);

-- price 列を追加（薬価用）
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_medications_yj_code ON medications(yj_code);

-- pg_trgm拡張を有効化（日本語検索の高速化）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 薬剤名の検索インデックス（日本語対応）
CREATE INDEX IF NOT EXISTS idx_medications_drug_name_trgm 
ON medications USING gin(drug_name gin_trgm_ops);

-- 一般名の検索インデックス
CREATE INDEX IF NOT EXISTS idx_medications_generic_name_trgm 
ON medications USING gin(generic_name gin_trgm_ops);

-- ============================================
-- 確認: テーブル構造を表示
-- ============================================
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'medications'
ORDER BY ordinal_position;
