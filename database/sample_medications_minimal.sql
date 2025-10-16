-- 修正版: 最小限の列でサンプルデータを挿入
-- エラーを避けるため、確実に存在する列のみを使用

-- パターン1: 基本的な列のみ（id, drug_name, manufacturer, strengthなど）
INSERT INTO medications (
    drug_name, 
    manufacturer, 
    strength,
    yj_code, 
    price
) VALUES 
    ('ロキソニン錠60mg', '第一三共', '60mg', '114200201', 15.90),
    ('カロナール錠200', 'あゆみ製薬', '200mg', '111600501', 5.90),
    ('ムコダイン錠250mg', '杏林製薬', '250mg', '222200201', 9.80),
    ('アレグラ錠60mg', 'サノフィ', '60mg', '244900901', 55.90),
    ('ガスター錠20mg', 'LTLファーマ', '20mg', '232200801', 32.70)
ON CONFLICT DO NOTHING;

-- 挿入結果を確認
SELECT 
    id,
    drug_name,
    manufacturer,
    strength,
    yj_code,
    price,
    created_at
FROM medications
ORDER BY drug_name;

-- 検索テスト
SELECT 
    drug_name,
    manufacturer,
    strength,
    price
FROM medications
WHERE drug_name ILIKE '%ロキ%'
ORDER BY drug_name;
