import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// デバッグ: アプリ起動時に使用するSupabaseのURLが読み込まれているか確認します。
// セキュリティのため anon key は出力しません。
console.log('SUPABASE_URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
// 追加（デバッグ用）：URL のみ表示
