-- インポート後の確認クエリ集

-- ==========================================
-- 1. 基本統計
-- ==========================================

-- 総件数
SELECT COUNT(*) as total_medications FROM medications;

-- YJコード付きの件数
SELECT COUNT(*) as with_yj_code FROM medications WHERE yj_code IS NOT NULL;

-- 薬価情報のある件数
SELECT COUNT(*) as with_price FROM medications WHERE price > 0;

-- メーカー別の件数TOP10
SELECT 
    manufacturer, 
    COUNT(*) as count 
FROM medications 
GROUP BY manufacturer 
ORDER BY count DESC 
LIMIT 10;

-- ==========================================
-- 2. 価格統計
-- ==========================================

-- 平均薬価
SELECT AVG(price) as avg_price FROM medications WHERE price > 0;

-- 最も高い薬TOP10
SELECT 
    drug_name, 
    manufacturer, 
    strength, 
    price 
FROM medications 
WHERE price > 0 
ORDER BY price DESC 
LIMIT 10;

-- 最も安い薬TOP10
SELECT 
    drug_name, 
    manufacturer, 
    strength, 
    price 
FROM medications 
WHERE price > 0 
ORDER BY price ASC 
LIMIT 10;

-- ==========================================
-- 3. 検索テスト
-- ==========================================

-- ロキソニン関連
SELECT drug_name, manufacturer, strength, price 
FROM medications 
WHERE drug_name ILIKE '%ロキソニン%'
ORDER BY drug_name;

-- カロナール関連
SELECT drug_name, manufacturer, strength, price 
FROM medications 
WHERE drug_name ILIKE '%カロナール%'
ORDER BY drug_name;

-- アモキシシリン（抗生物質）
SELECT drug_name, manufacturer, strength, price 
FROM medications 
WHERE drug_name ILIKE '%アモキシシリン%'
ORDER BY drug_name;

-- ガスター（胃薬）
SELECT drug_name, manufacturer, strength, price 
FROM medications 
WHERE drug_name ILIKE '%ガスター%'
ORDER BY drug_name;

-- ムコダイン（去痰薬）
SELECT drug_name, manufacturer, strength, price 
FROM medications 
WHERE drug_name ILIKE '%ムコダイン%'
ORDER BY drug_name;

-- ==========================================
-- 4. データ品質チェック
-- ==========================================

-- メーカー名が「不明」の件数
SELECT COUNT(*) as unknown_manufacturer 
FROM medications 
WHERE manufacturer = '不明' OR manufacturer = '';

-- 薬価が0または未設定の件数
SELECT COUNT(*) as no_price 
FROM medications 
WHERE price IS NULL OR price = 0;

-- YJコードが未設定の件数
SELECT COUNT(*) as no_yj_code 
FROM medications 
WHERE yj_code IS NULL OR yj_code = '';

-- ==========================================
-- 5. 新規追加データ確認
-- ==========================================

-- 最近追加された薬（TOP20）
SELECT 
    drug_name,
    manufacturer,
    strength,
    price,
    created_at
FROM medications
ORDER BY created_at DESC
LIMIT 20;

-- 今日追加されたデータの件数
SELECT COUNT(*) as added_today
FROM medications
WHERE DATE(created_at) = CURRENT_DATE;
