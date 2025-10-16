# 医薬品データのインポート手順

## 📋 概要

このドキュメントでは、厚生労働省の薬価基準収載品目リストをSupabaseの`medications`テーブルにインポートする手順を説明します。

## 🔗 データソース

**厚生労働省 薬価基準収載品目リスト**
- URL: https://www.mhlw.go.jp/topics/2023/04/tp20230401-01.html
- ファイル形式: CSV
- 更新頻度: 年2回（4月・10月）

## 📊 必要なデータ項目

### 薬価基準CSVから取得する項目:

| CSV列名 | 説明 | Supabaseカラム | 型 |
|---------|------|----------------|-----|
| 医薬品コード | YJコード（12桁） | `yj_code` | text (primary key) |
| 品名 | 医薬品名（規格含む） | `drug_name` | text |
| 規格単位 | 剤形・規格 | `strength` | text |
| 薬価 | 薬価（円） | `price` | numeric |
| 製造会社名 | メーカー名 | `manufacturer` | text |

### 現在の`medications`テーブルスキーマ:

```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drug_name TEXT NOT NULL,              -- 医薬品名
  generic_name TEXT,                    -- 一般名
  manufacturer TEXT NOT NULL,           -- 製造会社
  strength TEXT NOT NULL,               -- 規格
  dosage_form TEXT NOT NULL,            -- 剤形
  route_of_administration TEXT NOT NULL, -- 投与経路
  yj_code TEXT UNIQUE,                  -- YJコード（追加推奨）
  price NUMERIC,                        -- 薬価（追加推奨）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 インポート手順

### Step 1: データのダウンロード

1. 厚生労働省のサイトにアクセス
2. 最新の「薬価基準収載品目リスト」CSVをダウンロード
3. Excelで開いて内容を確認

### Step 2: データの整形

必要な列だけを抽出し、以下の形式に整形します:

```csv
yj_code,drug_name,generic_name,manufacturer,strength,dosage_form,route_of_administration,price
1124001F1021,ロキソニン錠60mg,ロキソプロフェンナトリウム水和物,第一三共,60mg,錠剤,経口,17.4
2149110F1024,カロナール錠200,アセトアミノフェン,あゆみ製薬,200mg,錠剤,経口,6.9
```

**注意点**:
- `generic_name`（一般名）は薬価基準CSVには含まれないため、必要に応じて別途追加
- `dosage_form`（剤形）と`route_of_administration`（投与経路）は品名から推測
- ヘッダー行を必ず含める

### Step 3: Supabaseへのインポート

#### オプションA: Supabase Studioでインポート

1. Supabase Studioにログイン
2. Table Editor → `medications` テーブルを選択
3. "Import data from CSV" をクリック
4. 整形したCSVファイルをアップロード
5. カラムマッピングを確認
6. "Import" をクリック

#### オプションB: SQLで一括インポート

```sql
-- CSVファイルから一括インポート
COPY medications (yj_code, drug_name, generic_name, manufacturer, strength, dosage_form, route_of_administration, price)
FROM '/path/to/medications.csv'
DELIMITER ','
CSV HEADER;
```

#### オプションC: Supabase Client経由でインポート

```typescript
import { supabase } from './supabaseClient';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';

async function importMedications() {
  const csvContent = fs.readFileSync('medications.csv', 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  const { data, error } = await supabase
    .from('medications')
    .insert(records);

  if (error) {
    console.error('インポートエラー:', error);
  } else {
    console.log(`✅ ${data.length}件の医薬品をインポートしました`);
  }
}
```

### Step 4: データの確認

```sql
-- レコード数を確認
SELECT COUNT(*) FROM medications;

-- サンプルデータを確認
SELECT * FROM medications LIMIT 10;

-- YJコードでの検索テスト
SELECT * FROM medications WHERE yj_code = '1124001F1021';

-- 薬品名での検索テスト（部分一致）
SELECT * FROM medications WHERE drug_name ILIKE '%ロキソニン%' LIMIT 10;
```

## 🔍 検索機能の動作確認

### database.ts の search 関数

既存の`medicationService.search()`関数は以下のように動作します:

```typescript
async search(query: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .or(`drug_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
    .order('drug_name')
    .limit(20);
  
  return data || [];
}
```

**動作**:
- `drug_name`（医薬品名）または`generic_name`（一般名）で部分一致検索
- 大文字小文字を区別しない（ilike）
- あいうえお順でソート
- 最大20件まで返す

### テスト方法

```typescript
// MedicationSearchコンポーネントで試す
// 例: "ロキソニン" と入力 → ロキソニン錠60mg が表示される
```

## 📅 データ更新の運用

### 更新タイミング

- 厚生労働省の薬価改定時（年2回: 4月・10月）
- 新薬収載時

### 更新手順

1. 新しいCSVをダウンロード
2. 既存データとの差分を確認
3. 新規追加・更新・削除を適用

```sql
-- 既存データを削除してから再インポート（簡易的な方法）
TRUNCATE TABLE medications;

-- または、upsert（更新or挿入）を使用
INSERT INTO medications (yj_code, drug_name, ...)
VALUES (...)
ON CONFLICT (yj_code) 
DO UPDATE SET 
  drug_name = EXCLUDED.drug_name,
  manufacturer = EXCLUDED.manufacturer,
  ...
```

## 🎯 次のステップ

1. ✅ KEGG API関連コードを削除（完了）
2. ✅ `MedicationSearch`コンポーネントを簡素化（完了）
3. ⏳ 薬価基準データをダウンロード
4. ⏳ CSVを整形してインポート
5. ⏳ 検索機能の動作確認

## 💡 Tips

### データ量が多い場合

- バッチ処理でインポート（1000件ずつなど）
- インデックスを作成して検索を高速化

```sql
-- 検索用インデックス
CREATE INDEX idx_medications_drug_name ON medications USING gin(to_tsvector('japanese', drug_name));
CREATE INDEX idx_medications_yj_code ON medications (yj_code);
```

### エラーハンドリング

```typescript
try {
  const medications = await medicationService.search(query);
  if (medications.length === 0) {
    // 見つからない場合の処理
    setError('該当する医薬品が見つかりませんでした');
  }
} catch (error) {
  console.error('検索エラー:', error);
  setError('検索中にエラーが発生しました');
}
```

## 📚 参考資料

- [厚生労働省 薬価基準](https://www.mhlw.go.jp/topics/2023/04/tp20230401-01.html)
- [Supabase CSV Import](https://supabase.com/docs/guides/database/import-data)
- [PostgreSQL COPY](https://www.postgresql.org/docs/current/sql-copy.html)
