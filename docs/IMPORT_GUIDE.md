# 📥 薬価基準データ インポートガイド

厚生労働省の薬価基準データをSupabaseにインポートする手順です。

---

## 🎯 概要

現在はサンプルデータ6件のみですが、このガイドに従って**数万件**の本番データをインポートできます。

---

## 📋 Step 1: データのダウンロード

### 1-1. 厚生労働省のサイトにアクセス

ブラウザで以下のURLを開いてください:

```
https://www.mhlw.go.jp/topics/2024/04/tp20240401-01.html
```

### 1-2. CSVファイルをダウンロード

ページ内の以下のようなリンクを探してください:

- 「薬価基準収載品目リスト」
- 「医薬品価格基準」
- 「薬価本体」

ファイル形式: **CSV** または **Excel形式**

### 1-3. ファイルを確認

ダウンロードしたファイルを開いて、以下の列があるか確認:

| 必須列 | 説明 | 例 |
|--------|------|-----|
| 医薬品コード（YJコード） | 12桁のコード | 114200201 |
| 品名 | 薬剤名 | ロキソニン錠60mg |
| 規格 | 規格・含量 | 60mg |
| メーカー/会社名 | 製造会社 | 第一三共 |
| 薬価 | 価格 | 15.90 |

**注意**: 列名は年度によって異なる場合があります。

---

## 📝 Step 2: データの整形

### Option A: Excel形式の場合

1. Excelで開く
2. 必要な列のみを選択（上記の5列）
3. 「名前を付けて保存」→ **CSV (UTF-8)** 形式で保存
4. ファイル名を `yakka_data.csv` にする

### Option B: CSV形式の場合

1. ファイル名を `yakka_data.csv` にリネーム
2. 文字コードが **UTF-8** であることを確認

---

## 🚀 Step 3: インポート実行

### 3-1. ファイルを配置

`yakka_data.csv` をプロジェクトルートに配置:

```
medtracker/
└── medtracker/
    ├── yakka_data.csv  ← ここに配置
    ├── package.json
    ├── scripts/
    │   └── import-yakka-data.ts
    └── ...
```

### 3-2. 環境変数を確認

`.env.local` ファイルに以下の変数があることを確認:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Service Role Key の取得方法**:
1. Supabaseダッシュボード → Settings → API
2. 「Service role」の「secret」をコピー
3. `.env.local` に追加

### 3-3. インポートスクリプトを実行

ターミナルで以下のコマンドを実行:

```bash
npm run import-medications
```

### 3-4. 実行結果の確認

以下のような出力が表示されます:

```
🏥 厚生労働省 薬価基準データ インポート開始
============================================================
📂 CSVファイルを読み込み中: /path/to/yakka_data.csv
📊 15234件のレコードを読み込みました
✅ 15234件の有効なレコードを抽出しました

📋 データサンプル（最初の3件）:

1. ロキソニン錠60mg
   YJコード: 114200201
   規格: 60mg
   メーカー: 第一三共
   薬価: ¥15.90

...

❓ このデータをインポートしますか？ (y/N)
> y

🚀 Supabaseにデータをインポート中...
📦 バッチサイズ: 100件

📤 バッチ 1/153 (1〜100件目)
✅ 100件を挿入しました
...

📊 インポート結果:
  ✅ 成功: 15234件
  ❌ 失敗: 0件
  📈 成功率: 100.00%

✅ インポート完了!
```

---

## 🔧 トラブルシューティング

### エラー1: `CSVファイルが見つかりません`

**原因**: ファイルが正しい場所にない

**解決策**:
- `yakka_data.csv` がプロジェクトルート（`medtracker/medtracker/`）にあるか確認
- ファイル名のスペルが正確か確認

### エラー2: `Supabase環境変数が設定されていません`

**原因**: 環境変数が不足

**解決策**:
1. `.env.local` ファイルを開く
2. `SUPABASE_SERVICE_ROLE_KEY` を追加
3. スクリプトを再実行

### エラー3: `列名が見つかりません`

**原因**: CSV の列名が想定と異なる

**解決策**:
1. `scripts/import-yakka-data.ts` を開く
2. 58-62行目の列名マッピングを実際のCSVに合わせて修正:

```typescript
yj_code: record['医薬品コード'] || record['YJコード'] || record['コード'],
drug_name: record['品名'] || record['医薬品名'] || record['薬品名'],
// ↑ 実際の列名に合わせて調整
```

### エラー4: `データが重複しています`

**原因**: 既にデータがインポート済み

**解決策**:
- 既存データを削除してから再インポート:

```sql
-- Supabase SQL Editor で実行
DELETE FROM medications WHERE yj_code IS NOT NULL;
```

---

## ✅ インポート後の確認

### Supabase Studio で確認:

```sql
-- 総件数
SELECT COUNT(*) FROM medications;

-- サンプル表示
SELECT drug_name, yj_code, price 
FROM medications 
LIMIT 10;

-- 薬価が入っているか確認
SELECT COUNT(*) 
FROM medications 
WHERE price IS NOT NULL AND price > 0;
```

### アプリで確認:

1. http://localhost:3001/medications/test-search を開く
2. 様々な薬剤名で検索してみる
3. 検索結果に薬価が表示されることを確認

---

## 📊 データ更新

薬価は年2回（4月・10月）改定されます。

### 更新手順:

1. 最新の薬価基準CSVをダウンロード
2. 既存データを削除:
   ```sql
   TRUNCATE TABLE medications;
   ```
3. 新しいデータをインポート:
   ```bash
   npm run import-medications
   ```

---

## 🎓 参考情報

- **厚生労働省 薬価基準**: https://www.mhlw.go.jp/topics/
- **YJコードとは**: 医薬品個別に付与される12桁のコード
- **薬価改定**: 年2回（4月・10月）実施

---

**質問や問題があれば、お気軽にお知らせください!** 🙌
