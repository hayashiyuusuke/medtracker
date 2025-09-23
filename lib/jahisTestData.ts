/**
 * JAHIS QRコード テスト用サンプルデータ
 * 開発・デバッグ用のJAHIS形式サンプル
 */

// 正常なJAHIS形式のサンプルデータ
export const validJAHISsamples = [
  // サンプル1: 基本的な処方データ
  "JAHIS,1.0,20250910,田中総合病院,山田太郎医師,さくら調剤薬局,ロキソニン錠,60,mg,1,3,7,食後に服用してください",
  
  // サンプル2: 複数薬剤
  "JAHIS,1.0,20250910,東京中央病院,佐藤花子医師,みどり薬局,アムロジピン錠,5,mg,1,1,30,血圧を下げる薬です,ランソプラゾール,15,mg,1,1,14,胃酸を抑える薬です",
  
  // サンプル3: シンプル版
  "JAHIS,1.0,20250910,サンプル病院,処方医師,薬局名,カロナール,200,mg,1,3,5,解熱鎮痛剤"
];

// 無効なデータのサンプル（テスト用）
export const invalidSamples = [
  "*83871252*",  // 現在読み取れているデータ
  "12345",       // 単純な数字
  "https://example.com", // URL
  "#PRESCRIPTION123",    // 処方箋番号
  "HELLO,WORLD",         // JAHIS形式ではないカンマ区切り
  ""             // 空文字
];

/**
 * テスト用のJAHIS QRコード生成関数
 * ブラウザでJAHISデータをテストするために使用
 */
export function generateTestQRCode(): string {
  const randomSample = validJAHISsamples[Math.floor(Math.random() * validJAHISsamples.length)];
  console.log('🧪 テスト用JAHISデータを生成:', randomSample);
  return randomSample;
}

/**
 * デバッグ用：手動でJAHISデータをテストする関数
 * ブラウザのコンソールで使用可能
 */
export function testJAHISParser() {
  console.log('=== JAHIS パーサーテスト開始 ===');
  
  validJAHISsamples.forEach((sample, index) => {
    console.log(`\n--- テスト ${index + 1} ---`);
    console.log('入力:', sample);
    
    try {
      // この関数は実際のアプリケーションでimportする必要があります
      // const result = parseJAHISData(sample);
      // console.log('✅ 解析成功:', result);
    } catch (error) {
      console.error('❌ 解析失敗:', error);
    }
  });
  
  console.log('\n=== 無効データテスト ===');
  invalidSamples.forEach((sample, index) => {
    console.log(`\n--- 無効テスト ${index + 1} ---`);
    console.log('入力:', sample);
    
    try {
      // const result = parseJAHISData(sample);
      // console.log('⚠️ 予期しない成功:', result);
    } catch (error) {
      console.log('✅ 正しくエラーをキャッチ:', error instanceof Error ? error.message : String(error));
    }
  });
}
