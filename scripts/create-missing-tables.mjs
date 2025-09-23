#!/usr/bin/env node

/**
 * 不足しているテーブルを直接作成するスクリプト
 * 管理者権限でSupabaseに接続し、SQLを実行
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ 環境変数が不足しています');
  console.log('必要な環境変数:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// サービスロールキーで接続（管理者権限）
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const createMissingTables = async () => {
  console.log('🔧 不足しているテーブルを作成中...\n');

  // dose_records テーブルの作成
  const doseRecordsSQL = `
    CREATE TABLE IF NOT EXISTS dose_records (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      medication_record_id UUID REFERENCES medication_records(id) ON DELETE CASCADE,
      scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
      actual_time TIMESTAMP WITH TIME ZONE,
      taken BOOLEAN DEFAULT FALSE,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // user_profiles テーブルの作成
  const userProfilesSQL = `
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      date_of_birth DATE,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      medical_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // インデックスとRLSの設定
  const indexesAndRLSSQL = `
    -- インデックスの作成
    CREATE INDEX IF NOT EXISTS idx_dose_records_user_id ON dose_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_dose_records_scheduled_time ON dose_records(scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

    -- Row Level Security (RLS) ポリシーの有効化
    ALTER TABLE dose_records ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

    -- dose_records のポリシー
    DROP POLICY IF EXISTS "Users can view own dose records" ON dose_records;
    CREATE POLICY "Users can view own dose records" ON dose_records
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own dose records" ON dose_records;
    CREATE POLICY "Users can insert own dose records" ON dose_records
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update own dose records" ON dose_records;
    CREATE POLICY "Users can update own dose records" ON dose_records
        FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own dose records" ON dose_records;
    CREATE POLICY "Users can delete own dose records" ON dose_records
        FOR DELETE USING (auth.uid() = user_id);

    -- user_profiles のポリシー
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    CREATE POLICY "Users can insert own profile" ON user_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE USING (auth.uid() = user_id);
  `;

  try {
    console.log('📊 dose_records テーブルを作成中...');
    const { error: doseError } = await supabase.rpc('exec_sql', { sql: doseRecordsSQL });
    if (doseError) {
      console.log('⚠️  RPC関数が利用できません。直接クエリを実行します...');
      // 代替方法: 直接クエリ実行を試行
      const { error: directError } = await supabase
        .from('dose_records')
        .select('count')
        .limit(1);
      
      if (directError && directError.message.includes('does not exist')) {
        console.log('❌ dose_recordsテーブルが存在しません。手動作成が必要です。');
      } else {
        console.log('✅ dose_recordsテーブルは既に存在するか作成済みです');
      }
    } else {
      console.log('✅ dose_records テーブル作成完了');
    }

    console.log('👤 user_profiles テーブルを作成中...');
    const { error: profileError } = await supabase.rpc('exec_sql', { sql: userProfilesSQL });
    if (profileError) {
      console.log('⚠️  RPC関数が利用できません');
      const { error: directError2 } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (directError2 && directError2.message.includes('does not exist')) {
        console.log('❌ user_profilesテーブルが存在しません。手動作成が必要です。');
      } else {
        console.log('✅ user_profilesテーブルは既に存在するか作成済みです');
      }
    } else {
      console.log('✅ user_profiles テーブル作成完了');
    }

    console.log('\n🔍 テーブル作成後の確認...');
    await checkTablesAgain();

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    console.log('\n📋 手動での作成が必要です:');
    console.log('1. Supabase Dashboard にアクセス');
    console.log('2. SQL Editor を開く');
    console.log('3. database/missing-tables.sql の内容を実行');
  }
};

const checkTablesAgain = async () => {
  const tables = ['dose_records', 'user_profiles'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: 正常にアクセス可能`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
};

createMissingTables();
