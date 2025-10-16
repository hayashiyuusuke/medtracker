-- 薬価基準データ用の列を追加
-- medications テーブルに YJコードと薬価を追加

-- YJコード（医薬品コード）を追加
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS yj_code VARCHAR(12);

-- 薬価を追加
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- YJコードにインデックスを作成（検索高速化）
CREATE INDEX IF NOT EXISTS idx_medications_yj_code ON medications(yj_code);

-- 薬剤名の全文検索インデックスを作成（日本語対応）
CREATE INDEX IF NOT EXISTS idx_medications_drug_name_trgm ON medications USING gin(drug_name gin_trgm_ops);

-- 一般名の全文検索インデックスを作成
CREATE INDEX IF NOT EXISTS idx_medications_generic_name_trgm ON medications USING gin(generic_name gin_trgm_ops);

-- pg_trgm 拡張機能を有効化（既に有効な場合はスキップされる）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 確認用クエリ
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'medications'
ORDER BY ordinal_position;
