# 🚀 薬価基準データ 全件インポートガイド

## 📊 現在の状態

- ✅ 厚生労働省データダウンロード済み（7,405件）
- ✅ CSV整形完了
- ✅ SQL生成完了
- ⏳ Supabaseへのインポート待ち

---

## 🎯 推奨方法: CSV直接インポート

### メリット
- ✅ 最も簡単
- ✅ 一度の操作で完了
- ✅ 数分で完了
- ✅ エラー処理が自動

### 手順

1. **Supabase Table Editorにアクセス**
   ```
   https://supabase.com/dashboard/project/fgejtdkbdyfolkyljsje/editor
   ```

2. **左サイドバーから `medications` テーブルをクリック**

3. **右上の「Insert」ボタン → 「Import data from CSV」を選択**

4. **CSVファイルを選択**
   ```
   yakka_for_supabase.csv
   ```
   場所: `/Users/hayashiyuusuke/medtracker/medtracker/yakka_for_supabase.csv`

5. **列のマッピング確認**
   
   CSV列 → テーブル列が以下のように対応していることを確認:
   
   | CSV列 | テーブル列 |
   |-------|----------|
   | drug_name | drug_name |
   | manufacturer | manufacturer |
   | strength | strength |
   | yj_code | yj_code |
   | price | price |
   | dosage_form | dosage_form |
   | route_of_administration | route_of_administration |
   | generic_name | generic_name |

6. **「Import」ボタンをクリック**

7. **完了を待つ** ☕
   - 進行状況バーが表示されます
   - 通常3-5分で完了

8. **確認**
   ```sql
   SELECT COUNT(*) FROM medications;
   ```
   → 約7,400件以上になっていればOK!

---

## 🔧 代替方法: SQLバッチ実行

CSV インポートがうまくいかない場合:

### 分割SQLファイル

以下の8つのファイルが生成されています:

1. `yakka_batch_1.sql` - バッチ 1-10 (2,000件)
2. `yakka_batch_2.sql` - バッチ 11-20 (2,000件)
3. `yakka_batch_3.sql` - バッチ 21-30 (2,000件)
4. `yakka_batch_4.sql` - バッチ 31-40 (2,000件)
5. `yakka_batch_5.sql` - バッチ 41-50 (1,000件)
6. `yakka_batch_6.sql` - バッチ 51-60 (1,000件)
7. `yakka_batch_7.sql` - バッチ 61-70 (1,000件)
8. `yakka_batch_8.sql` - バッチ 71-76 (残り)

### 実行手順

各ファイルを順番にSupabase SQL Editorで実行:

```bash
# 1. ファイルの内容をクリップボードにコピー
cat yakka_batch_1.sql | pbcopy

# 2. Supabase SQL Editorにペースト → 実行

# 3. 次のバッチへ
cat yakka_batch_2.sql | pbcopy
# ... 繰り返し
```

**注意**: 各バッチの実行には30秒〜1分かかります

---

## ✅ インポート後の確認

### 1. 総件数確認

```sql
SELECT COUNT(*) as total FROM medications;
```

期待値: 7,400件以上

### 2. YJコード付きデータ確認

```sql
SELECT COUNT(*) as with_yj_code 
FROM medications 
WHERE yj_code IS NOT NULL;
```

期待値: 7,400件以上

### 3. 薬価情報確認

```sql
SELECT COUNT(*) as with_price 
FROM medications 
WHERE price > 0;
```

期待値: 7,000件以上

### 4. サンプル検索

```sql
SELECT drug_name, manufacturer, price 
FROM medications 
WHERE drug_name ILIKE '%ロキソニン%'
ORDER BY drug_name
LIMIT 10;
```

期待値: ロキソニン関連の薬剤が表示される

---

## 🧪 アプリでのテスト

インポート完了後、以下で検索テスト:

```
http://localhost:3001/medications/test-search
```

### テストケース

| 検索語 | 期待される結果 |
|--------|---------------|
| ロキソニン | ロキソニン錠60mg など |
| カロナール | カロナール錠 各種 |
| アモキシシリン | 抗生物質 |
| ムコダイン | 去痰薬 |
| ガスター | 胃薬 |

---

## 🐛 トラブルシューティング

### エラー1: "Import failed"

**原因**: CSV形式の問題

**解決策**: 
1. CSVをExcelで開く
2. 別名保存 → CSV UTF-8形式
3. 再度インポート

### エラー2: "Duplicate key"

**原因**: 既存データとYJコードが重複

**解決策**:
```sql
-- 既存の薬価データを削除
DELETE FROM medications 
WHERE yj_code IS NOT NULL 
  AND yj_code NOT IN ('114200201', '111600501', '222200201', '244900901', '232200801', '111900701');
```

その後、再インポート

### エラー3: タイムアウト

**原因**: データ量が多すぎる

**解決策**: SQLバッチ実行方法に切り替え

---

## 📈 パフォーマンス最適化（任意）

インポート後、以下を実行すると検索が高速化:

```sql
-- インデックスの再構築
REINDEX TABLE medications;

-- テーブル統計の更新
ANALYZE medications;
```

---

**準備ができたら、CSV直接インポートを試してみてください!** 🚀

完了したら「完了しました」と教えてください。
