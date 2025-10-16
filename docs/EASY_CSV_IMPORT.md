# 🎯 最も簡単な方法: Supabase Table Editorでのインポート

## 📋 概要

このガイドでは、**最も簡単な方法**でSupabaseに`yakka_for_supabase.csv`をインポートする手順を説明します。

所要時間: **約5分**

---

## ステップ1️⃣: Supabaseダッシュボードを開く

1. ブラウザで https://supabase.com を開く
2. **「Sign in」** をクリック
3. あなたのmedtrackerプロジェクトを選択

---

## ステップ2️⃣: Table Editorに移動

1. 左側のメニューから **「Table Editor」** をクリック
2. テーブル一覧から **「medications」** をクリック

```
📁 Table Editor
   ├── 📊 medications      ← これをクリック
   ├── 📊 medication_records
   ├── 📊 dose_records
   └── 📊 user_profiles
```

---

## ステップ3️⃣: CSVインポート機能を開く

画面右上を見てください：

```
[🔍 Search]  [⚙️ Filters]  [+ Insert ▼]  [⋯]  ← この3点メニューをクリック
```

3点メニュー **「⋯」** をクリックすると、メニューが表示されます：

```
✓ Import data via spreadsheet  ← これを選択
  Export data to CSV
  Clone table
  ...
```

**「Import data via spreadsheet」** をクリック

---

## ステップ4️⃣: CSVファイルをアップロード

ダイアログが開きます：

```
┌─────────────────────────────────────┐
│ Import data via spreadsheet         │
├─────────────────────────────────────┤
│                                     │
│  [📎 Choose file]                   │
│                                     │
│  or drag and drop here              │
│                                     │
└─────────────────────────────────────┘
```

1. **「Choose file」** をクリック
2. ファイル選択ダイアログで `yakka_for_supabase.csv` を選択
   - 場所: `/Users/hayashiyuusuke/medtracker/medtracker/yakka_for_supabase.csv`
3. **「開く」** をクリック

---

## ステップ5️⃣: カラムマッピングを確認

ファイルをアップロードすると、カラムマッピング画面が表示されます：

```
CSV Column              → Database Column
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
drug_name              → drug_name ✓
manufacturer           → manufacturer ✓
strength               → strength ✓
dosage_form            → dosage_form ✓
route_of_administration → route_of_administration ✓
generic_name           → generic_name ✓
yj_code                → [Skip] または [新規カラム作成]
price                  → [Skip] または [新規カラム作成]
```

### ⚠️ 注意

- `yj_code`と`price`は現在のmedicationsテーブルにないカラムです
- 2つの選択肢があります：
  
  **選択肢A（推奨）**: これらをスキップ
  - `yj_code` → **「Skip this column」** を選択
  - `price` → **「Skip this column」** を選択
  
  **選択肢B**: 新しいカラムを作成
  - 後で追加する場合は「Create new column」を選択

---

## ステップ6️⃣: インポートを実行

1. すべてのマッピングを確認
2. 画面下部の **「Import」** ボタンをクリック
3. 進行状況バーが表示されます：

```
Importing data... ████████████░░░░ 75%
```

4. 完了すると成功メッセージが表示されます：

```
✅ Successfully imported 7,405 rows
```

---

## ステップ7️⃣: データを確認

インポートが完了したら、データが正しく入っているか確認しましょう：

### 方法A: Table Editorで確認

Table Editorの画面で：
- スクロールして複数の行を確認
- 薬剤名が正しく表示されているか確認
- 製造元、強度、剤形などが入っているか確認

### 方法B: SQLで確認

左メニューの **「SQL Editor」** をクリックし、以下のクエリを実行：

```sql
-- 総件数を確認
SELECT COUNT(*) as total_count FROM medications;

-- 最初の10件を確認
SELECT drug_name, manufacturer, strength, dosage_form 
FROM medications 
LIMIT 10;

-- 製造元別の集計
SELECT manufacturer, COUNT(*) as count 
FROM medications 
GROUP BY manufacturer 
ORDER BY count DESC 
LIMIT 10;
```

期待される結果：
```
total_count
-----------
7405
```

---

## ✅ 成功！

これで7,405件の薬剤データがmedicationsテーブルに登録されました！

---

## 🚨 もし問題が発生したら

### エラー: "File too large"

CSVファイルが大きすぎる場合、バッチファイルを使用してください：

1. 左メニュー → **「SQL Editor」**
2. **「New query」** をクリック
3. 以下のファイルを順番に開いて実行：
   - `yakka_batch_1.sql`
   - `yakka_batch_2.sql`
   - `yakka_batch_3.sql`
   - ... (全8ファイル)

### エラー: "Column does not exist"

medicationsテーブルに必要なカラムがない可能性があります。

以下のSQLを実行してカラムを追加：

```sql
-- SQL Editorで実行
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS yj_code TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC;
```

その後、再度インポートを試してください。

### エラー: "Duplicate key"

既にデータが存在する場合、重複エラーが発生します。

**対処法1**: 既存データを削除

```sql
-- ⚠️ 注意: すべてのデータが削除されます
DELETE FROM medications;
```

**対処法2**: 重複を無視してインポート

Table Editorではなく、SQL Editorを使用して、
`ON CONFLICT DO NOTHING` を指定してください。

---

## 📞 サポート

問題が解決しない場合：
1. エラーメッセージをコピー
2. Supabaseのドキュメントを確認: https://supabase.com/docs
3. コミュニティに質問: https://github.com/supabase/supabase/discussions
