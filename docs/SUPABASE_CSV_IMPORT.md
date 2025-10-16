# Supabase へのCSVインポート手順

## 📊 ファイル情報
- ファイル名: `yakka_for_supabase.csv`
- 行数: 7,406行（ヘッダー含む）
- データ: 薬価基準データ

## 🎯 方法1: Table Editor経由（推奨・簡単）

### 手順

1. **Supabaseダッシュボードにログイン**
   - https://supabase.com
   - プロジェクト「medtracker」を選択

2. **Table Editorを開く**
   - 左メニュー → **「Table Editor」**
   - `medications` テーブルを選択

3. **CSVインポート機能を使用**
   - 右上の **「Insert」** ボタン横の **「⋯」**（3点メニュー）をクリック
   - **「Import data via spreadsheet」** を選択
   
4. **ファイルをアップロード**
   - **「Choose file」** をクリック
   - `yakka_for_supabase.csv` を選択
   
5. **カラムマッピングを確認**
   ```
   CSV列              → データベース列
   ─────────────────────────────────
   drug_name         → drug_name
   manufacturer      → manufacturer
   strength          → strength
   dosage_form       → dosage_form
   route_of_administration → route_of_administration
   generic_name      → generic_name
   ```

6. **インポート実行**
   - **「Import」** をクリック
   - 完了を待つ（数分かかる場合があります）

### ⚠️ 注意点

- **既存データの扱い**: インポート前に既存のサンプルデータを削除するか確認
- **重複チェック**: `yj_code` カラムがあれば重複防止に使用可能
- **データ検証**: インポート後にデータが正しく入っているか確認

---

## 🎯 方法2: SQL Editor経由（推奨・確実）

Table Editorでうまくいかない場合や、より細かい制御が必要な場合はこちら。

### 手順

1. **Supabaseダッシュボードにログイン**
   - https://supabase.com
   - プロジェクト「medtracker」を選択

2. **SQL Editorを開く**
   - 左メニュー → **「SQL Editor」**
   - **「New query」** をクリック

3. **一時テーブルを作成**
   ```sql
   -- 一時テーブル作成
   CREATE TEMP TABLE temp_medications (
       drug_name TEXT,
       manufacturer TEXT,
       strength TEXT,
       yj_code TEXT,
       price NUMERIC,
       dosage_form TEXT,
       route_of_administration TEXT,
       generic_name TEXT
   );
   ```

4. **CSVデータをコピー&ペースト**
   
   ⚠️ **重要**: CSVファイルの**2行目以降**（ヘッダー行を除く）をコピー
   
   ```sql
   -- CSVデータを挿入
   COPY temp_medications (drug_name, manufacturer, strength, yj_code, price, dosage_form, route_of_administration, generic_name)
   FROM STDIN WITH (FORMAT csv);
   -- ここにCSVの内容をペースト
   -- Ctrl+Shift+Enter または \. で終了
   ```

5. **本番テーブルに挿入**
   ```sql
   -- 重複を避けて挿入
   INSERT INTO medications (drug_name, manufacturer, strength, dosage_form, route_of_administration, generic_name)
   SELECT 
       drug_name,
       manufacturer,
       strength,
       dosage_form,
       route_of_administration,
       NULLIF(generic_name, '')  -- 空文字列をNULLに変換
   FROM temp_medications
   ON CONFLICT (drug_name, manufacturer, strength) DO NOTHING;  -- 重複を無視
   
   -- 挿入件数を確認
   SELECT COUNT(*) as inserted_count FROM medications;
   ```

6. **データ確認**
   ```sql
   -- 最初の10件を確認
   SELECT * FROM medications LIMIT 10;
   
   -- 総件数を確認
   SELECT COUNT(*) FROM medications;
   ```

---

## 🎯 方法3: ターミナルから直接（開発者向け）

### 前提条件
- Supabase CLIがインストールされている
- プロジェクトに接続設定済み

### 手順

```bash
# Supabase CLIでログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref your-project-ref

# psqlを使用してCSVインポート
supabase db reset

# または直接psqlで
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres" \
  -c "\COPY medications (drug_name, manufacturer, strength, dosage_form, route_of_administration, generic_name) FROM '/Users/hayashiyuusuke/medtracker/medtracker/yakka_for_supabase.csv' WITH (FORMAT csv, HEADER true);"
```

---

## 🎯 方法4: Node.jsスクリプト経由（プログラマティック）

すでに作成済みのスクリプトを使用：

```bash
# TypeScriptスクリプトを実行
cd /Users/hayashiyuusuke/medtracker/medtracker
npx ts-node scripts/import-yakka-data.ts
```

または、バッチSQLファイルを使用：

```bash
# Supabase SQL Editorで実行
# yakka_batch_1.sql から yakka_batch_8.sql を順番に実行
```

---

## ✅ インポート後の確認

### 1. データ件数の確認
```sql
SELECT COUNT(*) as total_medications FROM medications;
-- 期待値: 約7,400件
```

### 2. サンプルデータの確認
```sql
SELECT * FROM medications ORDER BY created_at DESC LIMIT 10;
```

### 3. 製造元別の集計
```sql
SELECT manufacturer, COUNT(*) as count 
FROM medications 
GROUP BY manufacturer 
ORDER BY count DESC 
LIMIT 10;
```

### 4. 剤形別の集計
```sql
SELECT dosage_form, COUNT(*) as count 
FROM medications 
GROUP BY dosage_form 
ORDER BY count DESC;
```

---

## ⚠️ トラブルシューティング

### エラー: "CSV format error"
- CSVファイルのエンコーディングを確認（UTF-8推奨）
- カンマ区切りが正しいか確認
- 改行コードを確認（LF推奨）

### エラー: "Column does not exist"
- データベースのスキーマを確認
- カラム名が一致しているか確認
- マイグレーションが実行されているか確認

### エラー: "Timeout"
- データ量が多すぎる場合、バッチに分割
- `yakka_batch_1.sql` ~ `yakka_batch_8.sql` を使用

### インポート数が期待値と異なる
```sql
-- 重複チェック
SELECT drug_name, manufacturer, strength, COUNT(*) 
FROM medications 
GROUP BY drug_name, manufacturer, strength 
HAVING COUNT(*) > 1;
```

---

## 📚 参考資料

- [Supabase Table Editor Documentation](https://supabase.com/docs/guides/database/tables)
- [PostgreSQL COPY Documentation](https://www.postgresql.org/docs/current/sql-copy.html)
- [CSV Import Best Practices](https://supabase.com/docs/guides/database/import-data)
