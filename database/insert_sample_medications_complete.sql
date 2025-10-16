-- Step 2: サンプルデータを挿入（完全版）
-- fix_medications_schema.sql を実行した後に、このファイルを実行してください

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

-- サンプル6: リリカカプセル75mg（神経障害性疼痛治療薬）
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
    'リリカカプセル75mg',
    'プレガバリン',
    'ヴィアトリス製薬',
    '75mg',
    'カプセル剤',
    '経口',
    '111900701',
    73.00
) ON CONFLICT DO NOTHING;

-- ============================================
-- 確認1: 挿入されたデータを表示
-- ============================================
SELECT 
    drug_name,
    generic_name,
    manufacturer,
    strength,
    dosage_form,
    yj_code,
    price
FROM medications
ORDER BY drug_name;

-- ============================================
-- 確認2: 検索テスト（部分一致）
-- ============================================
-- 「ロキ」で検索
SELECT 
    drug_name,
    generic_name,
    price,
    manufacturer
FROM medications
WHERE drug_name ILIKE '%ロキ%' OR generic_name ILIKE '%ロキ%'
ORDER BY drug_name;

-- ============================================
-- 確認3: YJコードで検索
-- ============================================
SELECT 
    drug_name,
    yj_code,
    price
FROM medications
WHERE yj_code = '114200201';

-- ============================================
-- 確認4: 件数確認
-- ============================================
SELECT COUNT(*) as total_medications FROM medications;
