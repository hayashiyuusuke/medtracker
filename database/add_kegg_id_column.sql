-- medicationsテーブルにKEGG IDカラムを追加

ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS kegg_drug_id TEXT;

-- KEGG IDにインデックスを追加（検索高速化）
CREATE INDEX IF NOT EXISTS idx_medications_kegg_drug_id 
ON medications(kegg_drug_id);

-- KEGG IDにユニーク制約を追加（重複登録防止）
ALTER TABLE medications
ADD CONSTRAINT unique_kegg_drug_id UNIQUE (kegg_drug_id);

COMMENT ON COLUMN medications.kegg_drug_id IS 'KEGG MEDICUS APIのDrug ID (例: D00109)';
