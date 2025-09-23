#!/usr/bin/env node

/**
 * Supabase データベース接続テストスクリプト
 * 環境変数とデータベース接続を確認し、必要に応じてテーブルの存在をチェック
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 環境変数を読み込み
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Supabase接続テストを開始...');
console.log('📍 URL:', supabaseUrl ? 'あり' : 'なし');
console.log('🔑 Key:', supabaseAnonKey ? 'あり' : 'なし');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n📡 データベース接続をテスト中...');
    
    // 基本的な接続テスト
    const { data, error } = await supabase
      .from('medications')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('ℹ️  medicationsテーブルが存在しないか、アクセスできません:', error.message);
      
      // テーブル一覧を取得してみる
      console.log('\n📋 利用可能なテーブルを確認中...');
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables'); // カスタム関数が必要
      
      if (tablesError) {
        console.log('⚠️  テーブル一覧を取得できませんでした');
      }
    } else {
      console.log('✅ medicationsテーブルへのアクセス成功');
      console.log('📊 データ:', data);
    }
    
    // 認証のテスト
    console.log('\n🔐 認証状態を確認中...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  現在ログインしていません');
    } else {
      console.log('✅ ユーザー認証済み:', user?.email || 'ユーザー情報なし');
    }
    
  } catch (err) {
    console.error('❌ 接続エラー:', err);
  }
}

testConnection();
