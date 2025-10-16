/**
 * 厚生労働省 薬価基準データ インポートスクリプト
 * 
 * 使用方法:
 * 1. 厚生労働省のサイトから薬価基準CSVをダウンロード
 * 2. このファイルと同じディレクトリに yakka_data.csv として保存
 * 3. npm run import-medications を実行
 * 
 * データ形式（想定）:
 * YJコード,品名,規格,メーカー,薬価
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

// Supabaseクライアント設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 管理者権限が必要

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません');
  console.error('必要な環境変数:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface YakkaRecord {
  yj_code: string;
  drug_name: string;
  strength: string;
  manufacturer: string;
  price: number;
}

/**
 * CSVファイルを読み込んでパースする
 */
function parseYakkaCsv(filePath: string): YakkaRecord[] {
  console.log(`📂 CSVファイルを読み込み中: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // CSVをパース（ヘッダー行を想定）
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    encoding: 'utf-8',
    bom: true, // BOM対応
  });

  console.log(`📊 ${records.length}件のレコードを読み込みました`);

  // データを変換
  const medications: YakkaRecord[] = records.map((record: any) => {
    // 実際のCSVの列名に合わせて調整
    return {
      yj_code: record['薬価基準収載医薬品コード'] || '',
      drug_name: record['品名'] || '',
      strength: record['規格'] || '',
      manufacturer: record['メーカー名'] || '',
      price: parseFloat(record['薬価'] || '0'),
    };
  }).filter((med: YakkaRecord) => {
    // 必須フィールドがあるもののみ
    return med.yj_code && med.drug_name && med.manufacturer;
  });

  console.log(`✅ ${medications.length}件の有効なレコードを抽出しました`);
  
  return medications;
}

/**
 * Supabaseにデータを一括挿入
 */
async function importToSupabase(medications: YakkaRecord[], batchSize: number = 100) {
  console.log(`\n🚀 Supabaseにデータをインポート中...`);
  console.log(`📦 バッチサイズ: ${batchSize}件`);

  let successCount = 0;
  let errorCount = 0;

  // バッチ処理
  for (let i = 0; i < medications.length; i += batchSize) {
    const batch = medications.slice(i, i + batchSize);
    
    console.log(`\n📤 バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(medications.length / batchSize)} (${i + 1}〜${Math.min(i + batchSize, medications.length)}件目)`);

    // Supabaseに挿入（ON CONFLICT DO NOTHINGの代わりにupsert使用）
    const { data, error } = await supabase
      .from('medications')
      .insert(
        batch.map(med => ({
          drug_name: med.drug_name,
          manufacturer: med.manufacturer,
          strength: med.strength,
          yj_code: med.yj_code,
          price: med.price,
          dosage_form: '錠剤', // デフォルト値（実際のデータから判定する場合は改良が必要）
          route_of_administration: '経口', // デフォルト値
        }))
      );

    if (error) {
      console.error(`❌ エラー:`, error.message);
      errorCount += batch.length;
    } else {
      console.log(`✅ ${batch.length}件を挿入しました`);
      successCount += batch.length;
    }

    // レート制限対策（少し待機）
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n\n📊 インポート結果:`);
  console.log(`  ✅ 成功: ${successCount}件`);
  console.log(`  ❌ 失敗: ${errorCount}件`);
  console.log(`  📈 成功率: ${((successCount / medications.length) * 100).toFixed(2)}%`);
}

/**
 * メイン処理
 */
async function main() {
  console.log('🏥 厚生労働省 薬価基準データ インポート開始\n');
  console.log('='.repeat(60));

  const csvPath = path.join(process.cwd(), 'yakka_data.csv');

  // CSVファイルの存在確認
  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ エラー: CSVファイルが見つかりません`);
    console.error(`場所: ${csvPath}`);
    console.error(`\n📋 手順:`);
    console.error(`1. 厚生労働省のサイトから薬価基準CSVをダウンロード`);
    console.error(`   URL: https://www.mhlw.go.jp/topics/2024/04/tp20240401-01.html`);
    console.error(`2. ダウンロードしたファイルを yakka_data.csv にリネーム`);
    console.error(`3. プロジェクトルートに配置`);
    console.error(`4. このスクリプトを再実行`);
    process.exit(1);
  }

  try {
    // Step 1: CSVをパース
    let medications = parseYakkaCsv(csvPath);

    if (medications.length === 0) {
      console.error('❌ エラー: 有効なデータが見つかりませんでした');
      process.exit(1);
    }

    // テストモード: 最初の100件のみ（環境変数で制御）
    const testMode = process.env.TEST_MODE === 'true';
    if (testMode) {
      console.log('\n⚠️ テストモード: 最初の100件のみをインポートします');
      medications = medications.slice(0, 100);
    }

    // サンプル表示
    console.log('\n📋 データサンプル（最初の3件）:');
    medications.slice(0, 3).forEach((med, idx) => {
      console.log(`\n${idx + 1}. ${med.drug_name}`);
      console.log(`   YJコード: ${med.yj_code}`);
      console.log(`   規格: ${med.strength}`);
      console.log(`   メーカー: ${med.manufacturer}`);
      console.log(`   薬価: ¥${med.price.toFixed(2)}`);
    });

    // 確認プロンプト
    console.log('\n='.repeat(60));
    console.log('❓ このデータをインポートしますか？ (y/N)');
    
    // Node.jsの標準入力から確認を取る
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('> ', async (answer: string) => {
      readline.close();

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Step 2: Supabaseにインポート
        await importToSupabase(medications);
        console.log('\n✅ インポート完了!');
      } else {
        console.log('\n⚠️ インポートをキャンセルしました');
      }

      process.exit(0);
    });

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
