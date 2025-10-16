#!/usr/bin/env python3
"""
厚生労働省 薬価基準 Excel→CSV変換スクリプト
"""

import pandas as pd
import sys

def convert_yakka_excel_to_csv(excel_file, csv_file):
    """ExcelファイルをCSVに変換"""
    print(f"📂 Excelファイルを読み込み中: {excel_file}")
    
    try:
        # Excelファイルを読み込み（最初のシートを使用）
        df = pd.read_excel(excel_file, sheet_name=0)
        
        print(f"📊 {len(df)}行のデータを読み込みました")
        print(f"📋 列名: {list(df.columns)}")
        
        # 最初の数行を表示
        print("\n📝 データサンプル（最初の3行）:")
        print(df.head(3).to_string())
        
        # CSVに保存（UTF-8エンコード）
        df.to_csv(csv_file, index=False, encoding='utf-8-sig')
        
        print(f"\n✅ CSV変換完了: {csv_file}")
        print(f"📈 総件数: {len(df)}件")
        
    except Exception as e:
        print(f"❌ エラー: {e}")
        sys.exit(1)

if __name__ == "__main__":
    excel_file = "yakka_naiyou.xlsx"
    csv_file = "yakka_data.csv"
    
    convert_yakka_excel_to_csv(excel_file, csv_file)
