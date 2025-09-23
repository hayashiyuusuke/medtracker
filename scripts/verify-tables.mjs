#!/usr/bin/env node

/**
 * テーブル作成後の確認スクリプト
 * 手動でテーブルを作成した後、このスクリプトで確認してください
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyTables() {
  console.log('🔍 テーブル作成確認中...\n');
  
  const tables = [
    'medications',
    'medication_records', 
    'dose_records',
    'user_profiles'
  ];
  
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: 正常に作成済み (レコード数: ${data[0]?.count || 0})`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }
  
  if (allTablesExist) {
    console.log('\n🎉 すべてのテーブルが正常に作成されました！');
    console.log('📱 アプリケーションの /history ページが正常に動作するはずです。');
  } else {
    console.log('\n⚠️  一部のテーブルが不足しています。');
    console.log('📋 database/MANUAL_CREATE_TABLES.sql をSupabase Dashboardで実行してください。');
  }
}

verifyTables();
