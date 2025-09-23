#!/usr/bin/env node

/**
 * 全テーブルの存在確認スクリプト
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tables = [
  'medications',
  'medication_records', 
  'dose_records',
  'user_profiles'
];

async function checkAllTables() {
  console.log('📋 全テーブルの存在確認...\n');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 存在 (レコード数: ${data[0]?.count || 0})`);
      }
    } catch (err) {
      console.log(`❌ ${table}: エラー - ${err.message}`);
    }
  }
}

checkAllTables();
