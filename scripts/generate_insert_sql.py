#!/usr/bin/env python3
"""
薬価基準データをSupabase用のSQL INSERT文に変換するスクリプト
"""

import pandas as pd
import sys

def escape_sql_string(value):
    """SQL文字列をエスケープ"""
    if pd.isna(value) or value is None:
        return 'NULL'
    
    # 文字列の場合
    if isinstance(value, str):
        # シングルクォートをエスケープ
        escaped = value.replace("'", "''")
        return f"'{escaped}'"
    
    # 数値の場合
    return str(value)

def generate_insert_sql(csv_file, output_file, batch_size=100):
    """CSVからINSERT SQL文を生成"""
    print(f"📂 CSVファイルを読み込み中: {csv_file}")
    
    try:
        df = pd.read_csv(csv_file)
        
        print(f"📊 {len(df)}件のデータを読み込みました")
        
        # 必要な列を抽出
        required_columns = ['薬価基準収載医薬品コード', '品名', '規格', 'メーカー名', '薬価']
        
        # 欠損値チェック
        df_filtered = df[required_columns].dropna(subset=['薬価基準収載医薬品コード', '品名'])
        
        print(f"✅ {len(df_filtered)}件の有効なレコードを抽出")
        
        # SQL文を生成
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- 厚生労働省 薬価基準データ INSERT文\n")
            f.write("-- 自動生成ファイル\n\n")
            
            f.write("-- 既存データを削除（任意）\n")
            f.write("-- DELETE FROM medications WHERE yj_code IS NOT NULL;\n\n")
            
            total = len(df_filtered)
            for i in range(0, total, batch_size):
                batch = df_filtered.iloc[i:min(i+batch_size, total)]
                
                f.write(f"-- バッチ {i//batch_size + 1}: {i+1}〜{min(i+batch_size, total)}件目\n")
                f.write("INSERT INTO medications (\n")
                f.write("    drug_name, manufacturer, strength, yj_code, price,\n")
                f.write("    dosage_form, route_of_administration\n")
                f.write(") VALUES\n")
                
                values = []
                for idx, row in batch.iterrows():
                    yj_code = escape_sql_string(row['薬価基準収載医薬品コード'])
                    drug_name = escape_sql_string(row['品名'])
                    manufacturer = escape_sql_string(row['メーカー名'])
                    strength = escape_sql_string(row['規格'])
                    price = row['薬価'] if not pd.isna(row['薬価']) else 0
                    
                    value = f"    ({drug_name}, {manufacturer}, {strength}, {yj_code}, {price}, '錠剤', '経口')"
                    values.append(value)
                
                f.write(",\n".join(values))
                f.write("\nON CONFLICT DO NOTHING;\n\n")
        
        print(f"\n✅ SQL生成完了: {output_file}")
        print(f"📈 総バッチ数: {(total // batch_size) + 1}")
        print(f"\n📝 次のステップ:")
        print(f"1. Supabase SQL Editorを開く")
        print(f"2. {output_file} の内容をコピー&ペースト")
        print(f"3. 実行ボタンをクリック")
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    csv_file = "yakka_data.csv"
    output_file = "yakka_insert.sql"
    
    print("🏥 薬価基準データ SQL変換開始\n")
    print("="*60)
    
    generate_insert_sql(csv_file, output_file, batch_size=100)
