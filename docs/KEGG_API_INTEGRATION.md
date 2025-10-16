# 外部API連携機能 - KEGG MEDICUS API

## 📚 概要

この機能は、[KEGG MEDICUS API](https://www.kegg.jp/kegg/rest/keggapi.html)を使用して、薬剤情報を自動的に取得・登録する機能です。

## 🎯 機能

### 1. 薬剤検索と自動登録

ユーザーが薬剤名を検索した際に、データベースに存在しない場合は「KEGG APIで検索して登録」ボタンが表示されます。

```typescript
// 使用例
import { searchAndRegisterMedication } from '@/lib/medicationApi';

const medicationId = await searchAndRegisterMedication('アスピリン');
```

### 2. 主な関数

#### `searchKeggDrugs(drugName: string)`
薬剤名でKEGG APIを検索し、KEGG IDのリストを返す

```typescript
const keggIds = await searchKeggDrugs('ロキソプロフェン');
// 返り値: ['D01865', 'D08311', ...]
```

#### `getKeggDrugInfo(keggId: string)`
KEGG IDから詳細な薬剤情報を取得

```typescript
const info = await getKeggDrugInfo('D01865');
// 返り値: { entry_id, name, names, formula, efficacy, ... }
```

#### `searchAndRegisterMedication(drugName, options?)`
薬剤名で検索し、見つかった場合は自動的にデータベースに登録

```typescript
const medicationId = await searchAndRegisterMedication('アムロジピン', {
  manufacturer: 'ファイザー',
  strength: '5mg',
  dosage_form: '錠剤',
  route_of_administration: '経口'
});
```

#### `batchRegisterMedications(drugNames: string[])`
複数の薬剤を一括登録

```typescript
const results = await batchRegisterMedications([
  'アスピリン',
  'ロキソプロフェン',
  'アムロジピン'
]);
// 返り値: { 'アスピリン': 'uuid1', 'ロキソプロフェン': 'uuid2', ... }
```

## 🛠️ セットアップ

### 1. データベースマイグレーション

```bash
# Supabaseでマイグレーションを実行
psql -U postgres -d medtracker -f database/add_kegg_id_column.sql
```

または、Supabaseダッシュボードの「SQL Editor」から実行:

```sql
ALTER TABLE medications ADD COLUMN IF NOT EXISTS kegg_drug_id TEXT;
CREATE INDEX IF NOT EXISTS idx_medications_kegg_drug_id ON medications(kegg_drug_id);
```

### 2. 使用方法

新しい処方記録ページ (`/app/medications/new/page.tsx`) で既に統合済みです。

ユーザーが薬剤を検索して見つからない場合:
1. 「KEGG APIで検索して登録」ボタンが表示される
2. クリックするとKEGG APIで検索
3. 見つかった場合、自動的にデータベースに登録
4. 登録された薬剤が選択状態になる

## ⚠️ 注意事項

### API利用制限

KEGG APIは以下の制限があります:

1. **非商用利用のみ** - 商用利用には別途ライセンスが必要
2. **レート制限** - 短時間に大量のリクエストを送信しないこと
3. **利用規約** - https://www.kegg.jp/kegg/legal.html を確認

### 代替API

商用利用や大規模利用の場合、以下のAPIを検討してください:

- **医薬品医療機器情報提供ホームページ (PMDA)**
- **e-Gov 医薬品情報提供サービス**
- **レセプト電算処理マスタ** (保険医療機関向け)

## 📝 データ構造

### KEGG APIレスポンス例

```
ENTRY       D00109                      Drug
NAME        Aspirin;
            アスピリン (JP17);
            Acetylsalicylic acid (INN)
FORMULA     C9H8O4
EXACT_MASS  180.0423
MOL_WEIGHT  180.1574
EFFICACY    解熱鎮痛消炎剤
```

### データベース保存形式

```typescript
{
  drug_name: 'アスピリン',
  generic_name: 'Aspirin',
  manufacturer: '不明', // KEGGには製造元情報がないため
  strength: '180.1574',
  dosage_form: '錠剤',
  route_of_administration: '経口',
  kegg_drug_id: 'D00109'
}
```

## 🚀 今後の拡張案

1. **複数候補の表示**: KEGG検索で複数の候補が見つかった場合、ユーザーに選ばせる
2. **手動入力フォーム**: KEGG APIで見つからない場合の手動登録UI
3. **キャッシュ機能**: 一度検索した薬剤はキャッシュして再検索を避ける
4. **画像取得**: KEGG APIから薬剤の化学構造式を取得
5. **相互作用チェック**: 複数薬剤の相互作用をKEGG DRUGデータベースで確認

## 📖 参考資料

- [KEGG REST API Documentation](https://www.kegg.jp/kegg/rest/keggapi.html)
- [KEGG DRUG Database](https://www.kegg.jp/kegg/drug/)
- [KEGG MEDICUS](https://www.kegg.jp/medicus/)
