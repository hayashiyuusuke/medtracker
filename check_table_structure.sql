-- medicationsテーブルの列構造を確認
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'medications'
ORDER BY ordinal_position;
