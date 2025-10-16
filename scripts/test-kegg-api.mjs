/**
 * KEGG API連携機能のテスト
 * 
 * 実行方法:
 * node scripts/test-kegg-api.mjs
 */

import fetch from 'node-fetch';

// グローバルfetchを設定（Node.js 18未満の場合）
if (!global.fetch) {
  global.fetch = fetch;
}

const KEGG_API_BASE = 'https://rest.kegg.jp';

// テスト用の薬剤リスト（英語名またはKEGG ID）
const TEST_DRUGS = [
  'Aspirin',
  'Loxoprofen',
  'Amlodipine',
  'Omeprazole',
  'NonExistentDrug12345'  // 失敗ケース
];

console.log('🧪 KEGG API連携機能のテスト開始\n');

// 1. 薬剤検索のテスト
async function testSearchDrugs(drugName) {
  console.log(`\n📝 テスト: 薬剤検索 - "${drugName}"`);
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch(
      `${KEGG_API_BASE}/find/drug/${encodeURIComponent(drugName)}`
    );
    
    if (response.status === 404) {
      console.log('❌ 薬剤が見つかりませんでした');
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const entries = text.trim().split('\n');
    
    console.log(`✅ ${entries.length}件の候補が見つかりました:`);
    entries.slice(0, 3).forEach(entry => {
      const match = entry.match(/^dr:([A-Z]\d+)\s+(.+)$/);
      if (match) {
        console.log(`   - ${match[1]}: ${match[2]}`);
      }
    });
    
    if (entries.length > 3) {
      console.log(`   ... 他${entries.length - 3}件`);
    }
    
    // KEGG IDリストを返す
    return entries.map(entry => {
      const match = entry.match(/^dr:([A-Z]\d+)/);
      return match ? match[1] : null;
    }).filter(id => id !== null);
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return [];
  }
}

// 2. 薬剤詳細情報取得のテスト
async function testGetDrugInfo(keggId) {
  console.log(`\n📝 テスト: 薬剤詳細取得 - "${keggId}"`);
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch(`${KEGG_API_BASE}/get/drug:${keggId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    const lines = text.split('\n');
    
    // 主要フィールドを抽出
    const info = {};
    let currentField = '';
    
    for (const line of lines) {
      if (line.match(/^[A-Z]/)) {
        const match = line.match(/^([A-Z_]+)\s+(.+)$/);
        if (match) {
          currentField = match[1];
          const value = match[2].trim();
          
          if (['NAME', 'FORMULA', 'EXACT_MASS', 'MOL_WEIGHT'].includes(currentField)) {
            if (currentField === 'NAME') {
              info[currentField] = info[currentField] || [];
              info[currentField].push(value.replace(/;$/, ''));
            } else {
              info[currentField] = value;
            }
          }
        }
      } else if (line.trim() && currentField === 'NAME') {
        info.NAME.push(line.trim().replace(/;$/, ''));
      }
    }
    
    console.log('✅ 薬剤情報を取得しました:');
    console.log(`   Entry ID: ${keggId}`);
    if (info.NAME) {
      console.log(`   名称: ${info.NAME.slice(0, 3).join(', ')}`);
    }
    if (info.FORMULA) {
      console.log(`   化学式: ${info.FORMULA}`);
    }
    if (info.MOL_WEIGHT) {
      console.log(`   分子量: ${info.MOL_WEIGHT}`);
    }
    
    return info;
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return null;
  }
}

// メイン実行
async function main() {
  let totalTests = 0;
  let passedTests = 0;
  
  // 各薬剤で検索テスト
  for (const drug of TEST_DRUGS) {
    totalTests++;
    const keggIds = await testSearchDrugs(drug);
    
    if (keggIds.length > 0 || drug.includes('NonExistent')) {
      passedTests++;
      
      // 最初の候補の詳細情報を取得
      if (keggIds.length > 0) {
        totalTests++;
        const info = await testGetDrugInfo(keggIds[0]);
        if (info) {
          passedTests++;
        }
      }
    }
    
    // API制限を考慮して待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 結果サマリー
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 テスト完了');
  console.log('═'.repeat(50));
  console.log(`✅ 成功: ${passedTests}/${totalTests}`);
  console.log(`❌ 失敗: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n✨ すべてのテストが成功しました！');
    console.log('💡 次のステップ: Supabaseでデータベースマイグレーションを実行してください');
    console.log('   ファイル: database/add_kegg_id_column.sql');
  } else {
    console.log('\n⚠️ いくつかのテストが失敗しました');
  }
}

// 実行
main().catch(console.error);
