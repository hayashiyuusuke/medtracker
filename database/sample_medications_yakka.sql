-- 薬価基準データのサンプル挿入
-- 実際のデータでテストする前に、これらのサンプルで動作確認

-- サンプル1: ロキソニン錠60mg
INSERT INTO medications (
    drug_name,
    generic_name,
    manufacturer,
    strength,
    dosage_form,
    route_of_administration,
    yj_code,
    price
) VALUES (
    'ロキソニン錠60mg',
    'ロキソプロフェンナトリウム水和物',
    '第一三共',
    '60mg',
    '錠剤',
    '経口',
    '114200201',
    15.90
) ON CONFLICT DO NOTHING;

-- サンプル2: カロナール錠200
INSERT INTO medications (
    drug_name,
    generic_name,
    manufacturer,
    strength,
    dosage_form,
    route_of_administration,
    yj_code,
    price
) VALUES (
    'カロナール錠200',
    'アセトアミノフェン',
    'あゆみ製薬',
    '200mg',
    '錠剤',
    '経口',
    '111600501',
    5.90
) ON CONFLICT DO NOTHING;

-- サンプル3: ムコダイン錠250mg
INSERT INTO medications (
    drug_name,
    generic_name,
    manufacturer,
    strength,
    dosage_form,
    route_of_administration,
    yj_code,
    price
) VALUES (
    'ムコダイン錠250mg',
    'カルボシステイン',
    '杏林製薬',
    '250mg',
    '錠剤',
    '経口',
    '222200201',
    9.80
) ON CONFLICT DO NOTHING;

-- サンプル4: アレグラ錠60mg
INSERT INTO medications (
    drug_name,
    generic_name,
    manufacturer,
    strength,
    dosage_form,
    route_of_administration,
    yj_code,
    price
) VALUES (
    'アレグラ錠60mg',
    'フェキソフェナジン塩酸塩',
    'サノフィ',
    '60mg',
    '錠剤',
    '経口',
    '244900901',
    55.90
) ON CONFLICT DO NOTHING;

-- サンプル5: ガスター錠20mg
INSERT INTO medications (
    drug_name,
    generic_name,
    manufacturer,
    strength,
    dosage_form,
    route_of_administration,
    yj_code,
    price
) VALUES (
    'ガスター錠20mg',
    'ファモチジン',
    'LTLファーマ',
    '20mg',
    '錠剤',
    '経口',
    '232200801',
    32.70
) ON CONFLICT DO NOTHING;

-- 挿入したデータを確認
SELECT 
    drug_name,
    generic_name,
    manufacturer,
    strength,
    yj_code,
    price
FROM medications
ORDER BY drug_name;

-- 検索テスト（部分一致）
SELECT 
    drug_name,
    generic_name,
    price
FROM medications
WHERE drug_name ILIKE '%ロキ%' OR generic_name ILIKE '%ロキ%'
ORDER BY drug_name;
