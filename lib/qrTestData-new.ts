/**
 * QRコード機能のテスト用ユーティリティ
 * 実際のQRコードの代わりにテストデータを使用してSimpleJahisParserをテスト
 */

import { SimpleJahisParser } from './simpleJahisParser';

// テスト用のJAHIS形式データ
export const testJAHISData = [
  // 基本的な処方箋データ
  `JAHIS
患者: 田中太郎
薬品: ロキソプロフェンナトリウム錠60mg
用量: 1錠
頻度: 1日3回
期間: 7日間
処方日: 2024-09-12
病院: 田中病院`,

  // 複数薬剤の処方箋データ
  `JAHIS
患者: 山田花子
薬品: アムロジピンベシル酸塩錠5mg
用量: 1錠
頻度: 1日1回
期間: 14日間
処方日: 2024-09-12
病院: 山田クリニック`,

  // 最小限のデータ
  `JAHIS
患者: テスト患者
薬品: テスト薬100mg
用量: 2錠
頻度: 1日2回
期間: 3日間
処方日: 2024-09-12
病院: テスト病院`,

  // エラーケース：不正なフォーマット
  "INVALID_FORMAT_TEST_DATA",

  // 一般的なテキストQRコード
  `田中一郎
ロキソニン錠60mg
東京総合病院`,

  // URL形式
  "https://example.com/prescription/12345",

  // 数値のみ
  "1234567890",
];

export class QRTestHelper {
  /**
   * 有効なJAHIS形式のテストデータを取得
   */
  static getValidJAHIS(): string {
    return testJAHISData[0];
  }

  /**
   * 複数薬剤のJAHIS形式データを取得
   */
  static getMultipleMedicationsJAHIS(): string {
    return testJAHISData[1];
  }

  /**
   * 最小限のJAHIS形式データを取得
   */
  static getMinimalJAHIS(): string {
    return testJAHISData[2];
  }

  /**
   * 無効なデータを取得（エラーテスト用）
   */
  static getInvalidData(): string {
    return testJAHISData[3];
  }

  /**
   * 非JAHIS形式のテキストQRコードを取得
   */
  static getNonJAHISData(): string {
    return testJAHISData[4];
  }

  /**
   * URL形式のQRコードを取得
   */
  static getURLData(): string {
    return testJAHISData[5];
  }

  /**
   * 数値のみのQRコードを取得
   */
  static getNumericData(): string {
    return testJAHISData[6];
  }

  /**
   * 全テストケースを実行
   */
  static runAllTests(): void {
    console.log('=== QRテストデータ 全テスト実行 ===');
    
    testJAHISData.forEach((data, index) => {
      console.log(`\n--- テストケース ${index + 1} ---`);
      console.log('入力データ:', data.substring(0, 50) + (data.length > 50 ? '...' : ''));
      
      try {
        // SimpleJahisParserでテスト
        const result = SimpleJahisParser.parseQRData(data);
        
        if (result) {
          console.log('✅ 解析成功:', {
            患者名: result.patientName,
            薬品名: result.medicationName,
            病院名: result.hospitalName,
            処方日: result.prescriptionDate
          });
        } else {
          console.log('❌ 解析失敗: データを解析できませんでした');
        }
        
        // デバッグ情報
        SimpleJahisParser.debugQRData(data);
        
      } catch (error) {
        console.log('❌ 解析エラー:', error instanceof Error ? error.message : error);
      }
    });
    
    console.log('\n=== 全テスト完了 ===');
  }

  /**
   * 特定のテストケースを実行
   */
  static runSingleTest(index: number): void {
    if (index < 0 || index >= testJAHISData.length) {
      console.error('無効なテストケースインデックス:', index);
      return;
    }

    const data = testJAHISData[index];
    console.log(`=== テストケース ${index + 1} 実行 ===`);
    console.log('入力データ:', data);
    
    try {
      const result = SimpleJahisParser.parseQRData(data);
      
      if (result) {
        console.log('✅ 解析成功:', result);
      } else {
        console.log('❌ 解析失敗');
      }
      
    } catch (error) {
      console.log('❌ 解析エラー:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * カスタムデータをテスト
   */
  static testCustomData(data: string): void {
    console.log('=== カスタムデータテスト ===');
    console.log('入力データ:', data);
    
    try {
      const result = SimpleJahisParser.parseQRData(data);
      
      if (result) {
        console.log('✅ 解析成功:', result);
      } else {
        console.log('❌ 解析失敗');
      }
      
      SimpleJahisParser.debugQRData(data);
      
    } catch (error) {
      console.log('❌ 解析エラー:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * パフォーマンステスト
   */
  static performanceTest(): void {
    console.log('=== パフォーマンステスト開始 ===');
    
    const testRuns = 1000;
    const testData = this.getValidJAHIS();
    
    const startTime = performance.now();
    
    for (let i = 0; i < testRuns; i++) {
      SimpleJahisParser.parseQRData(testData);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / testRuns;
    
    console.log(`${testRuns}回の解析実行結果:`);
    console.log(`総時間: ${totalTime.toFixed(2)}ms`);
    console.log(`平均時間: ${averageTime.toFixed(4)}ms`);
    console.log(`1秒あたりの処理数: ${(1000 / averageTime).toFixed(0)}回`);
  }
}

// デフォルトエクスポートも提供
export default QRTestHelper;
