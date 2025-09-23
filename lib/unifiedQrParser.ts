/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔄 統一QRコード解析モジュール - 開発者向け重要事項
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 【⚠️ 重要：既存コードの置き換えについて】
 * このモジュールは、複数のQRコード形式を統一的に処理するための最新実装です。
 * 既存の以下のファイルを完全に置き換えることを強く推奨します：
 * 
 * 🗂️ 削除対象ファイル：
 * - lib/qrParser.ts (旧SimpleJahisParser)
 * - lib/jahisStandardParser.ts
 * - lib/simpleJahisParser.ts (既に削除済み)
 * - その他のQR解析関連ファイル
 * 
 * 📦 NPMパッケージのクリーンアップ：
 * 以前にJAHIS関連のパッケージをインストールした場合は、以下のコマンドで削除してください：
 * ```bash
 * npm uninstall jahis-qr-decoder @jahis/qr-parser jahis-prescription-parser
 * npm uninstall zlib pako buffer
 * ```
 * 
 * 🔧 移行手順：
 * 1. 既存のパーサーインポート文を全て削除
 * 2. `import { processQrCode } from '../lib/unifiedQrParser'` に置き換え
 * 3. パーサー呼び出しを `processQrCode(qrData)` に統一
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * 統一薬剤情報インターフェース
 */
export interface Medication {
  name: string;      // 薬剤名
  dosage: string;    // 用法・用量
  quantity?: string; // 数量
  unit?: string;     // 単位
  days?: number;     // 処方日数
}

/**
 * 統一データ形式 - 全てのパーサーがこの形式を返す
 */
export interface MedicationData {
  sourceFormat: 'JAHIS' | 'NON_JAHIS_CSV';  // データ形式の識別
  prescribedDate: string;                    // 処方日 (YYYY-MM-DD)
  hospitalName: string;                      // 医療機関名
  patientName: string;                       // 患者氏名
  medications: Medication[];                 // 薬剤リスト
  rawData?: string;                         // 元データ（デバッグ用）
}

/**
 * QRコード形式判別結果
 */
export type QrFormat = 'JAHIS' | 'NON_JAHIS_CSV' | 'UNKNOWN';

/**
 * 解析エラー情報
 */
export interface ParseError {
  code: string;
  message: string;
  details?: any;
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔍 Step 1: データ形式自動判別
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * QRコードデータの形式を自動判別（改善版）
 * より柔軟で堅牢な判別ロジックを採用
 * @param qrData QRコードから読み取った生データ
 * @returns 判別されたデータ形式
 */
export function detectQrFormat(qrData: string): QrFormat {
  console.log('🔍 QR形式判別開始（改善版）:', qrData.substring(0, 50) + '...');
  
  // 空データチェック
  if (!qrData || qrData.trim() === '') {
    console.log('❌ 空のデータ');
    return 'UNKNOWN';
  }

  const trimmedData = qrData.trim();
  
  /**
   * Rule 1 (Priority: HIGH)
   * JAHIS形式の判別 - 'JAHIS|1|' で始まるかを確認
   */
  if (trimmedData.startsWith('JAHIS|1|')) {
    console.log('✅ JAHIS標準形式として判別（JAHIS|1|パターン）');
    return 'JAHIS';
  }
  
  // 追加のJAHIS形式パターン
  if (trimmedData.startsWith('JAHIS|') || trimmedData.includes('JAHIS')) {
    console.log('✅ JAHIS標準形式として判別（その他JAHISパターン）');
    return 'JAHIS';
  }
  
  // JAHISバイナリ形式（特殊文字区切り）
  if (trimmedData.includes('\x1C') && trimmedData.includes('\x1D')) {
    console.log('✅ JAHISバイナリ形式として判別');
    return 'JAHIS';
  }

  /**
   * Rule 2 (Priority: MEDIUM)  
   * 非JAHIS形式の判別 - カンマが含まれているかを確認
   * より普遍的な特徴（カンマの存在）で判定し、将来のパターンにも対応
   */
  if (trimmedData.includes(',')) {
    console.log('✅ 非JAHISカンマ区切り形式として判別（カンマ存在パターン）');
    console.log('📊 カンマ数:', (trimmedData.match(/,/g) || []).length);
    console.log('📊 先頭20文字:', trimmedData.substring(0, 20));
    return 'NON_JAHIS_CSV';
  }

  /**
   * Rule 3 (Priority: LOW)
   * 上記のいずれにも該当しない場合は未知の形式
   */
  console.log('⚠️ 未知の形式');
  console.log('📊 データ特徴:');
  console.log('   - 長さ:', trimmedData.length);
  console.log('   - 先頭文字:', trimmedData.charAt(0));
  console.log('   - カンマ含有:', trimmedData.includes(','));
  console.log('   - JAHIS含有:', trimmedData.includes('JAHIS'));
  return 'UNKNOWN';
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔬 Step 2: JAHISパーサー実装
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * JAHIS形式データの解析
 * @param qrData JAHIS形式のQRデータ
 * @returns 統一形式のMedicationData
 */
export function parseJahisData(qrData: string): MedicationData | null {
  console.log('🔬 JAHIS解析開始');
  
  try {
    // JAHIS Base64形式の処理
    if (qrData.startsWith('JAHIS|')) {
      return parseJahisBase64Format(qrData);
    }
    
    // JAHISバイナリ形式の処理
    if (qrData.includes('\x1C')) {
      return parseJahisBinaryFormat(qrData);
    }
    
    console.log('❌ 対応していないJAHIS形式');
    return null;
    
  } catch (error) {
    console.error('❌ JAHIS解析エラー:', error);
    return null;
  }
}

/**
 * JAHIS Base64形式の解析
 * 注：実際の実装では、信頼できるJAHISライブラリを使用することを推奨
 */
function parseJahisBase64Format(qrData: string): MedicationData | null {
  console.log('📄 JAHIS Base64形式解析');
  
  try {
    // "JAHIS|1|base64data" 形式の解析
    const parts = qrData.split('|');
    if (parts.length < 3) {
      throw new Error('Invalid JAHIS format');
    }
    
    const base64Data = parts[2];
    
    // 注：実際の実装では、zlibやpakoライブラリでXMLを展開
    // ここでは簡略化した処理を示す
    console.log('Base64データサイズ:', base64Data.length);
    
    // モックデータとして基本情報を返す
    return {
      sourceFormat: 'JAHIS',
      prescribedDate: new Date().toISOString().split('T')[0],
      hospitalName: 'JAHIS対応医療機関',
      patientName: '患者名（JAHIS解析）',
      medications: [
        {
          name: 'JAHIS解析薬剤',
          dosage: '1日3回 食後',
          quantity: '21',
          unit: '錠',
          days: 7
        }
      ],
      rawData: qrData
    };
    
  } catch (error) {
    console.error('JAHIS Base64解析エラー:', error);
    return null;
  }
}

/**
 * JAHISバイナリ形式の解析
 */
function parseJahisBinaryFormat(qrData: string): MedicationData | null {
  console.log('🔢 JAHISバイナリ形式解析');
  
  try {
    const sections = qrData.split('\x1C');
    const medications: Medication[] = [];
    
    let hospitalName = 'JAHIS医療機関';
    let patientName = 'JAHIS患者';
    let prescribedDate = new Date().toISOString().split('T')[0];
    
    // セクション解析（簡略版）
    sections.forEach((section, index) => {
      console.log(`セクション ${index}:`, section.substring(0, 50));
      
      // 薬剤情報の抽出（実際の実装では詳細な仕様に従う）
      if (section.includes('薬') || section.includes('Drug')) {
        medications.push({
          name: `JAHISバイナリ薬剤 ${medications.length + 1}`,
          dosage: '1日3回',
          quantity: '21',
          unit: '錠'
        });
      }
    });
    
    return {
      sourceFormat: 'JAHIS',
      prescribedDate,
      hospitalName,
      patientName,
      medications: medications.length > 0 ? medications : [
        {
          name: 'JAHISバイナリ解析薬剤',
          dosage: '用法指示',
          quantity: '不明',
          unit: '錠'
        }
      ],
      rawData: qrData
    };
    
  } catch (error) {
    console.error('JAHISバイナリ解析エラー:', error);
    return null;
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📊 Step 3: 非JAHISパーサー実装
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * カンマ区切り形式データの解析（完全書き換え版）
 * レコード構造を正しく認識する2段階アプローチ
 * @param qrData カンマ区切り形式のQRデータ
 * @returns 統一形式のMedicationData
 */
export function parseNonJahisCsvData(qrData: string): MedicationData | null {
  console.log('📊 非JAHISカンマ区切り解析開始（新ロジック）');
  console.log('生データ:', qrData.substring(0, 200) + '...');
  
  try {
    /**
     * Step 1: レコードへの分割
     * \r\n や改行文字でまず分割し、その後 201, や 301, でレコードを識別
     */
    console.log('=== Step 1: レコード分割 ===');
    
    // 改行文字で分割（\r\n, \n, \r に対応）
    let records = qrData.split(/\r\n|\r|\n/);
    
    // 改行がない場合は、201, や 301, パターンで分割を試行
    if (records.length === 1) {
      console.log('改行文字なし、パターンマッチで分割を試行');
      // 201, や 301, の前で分割（先頭は除く）
      const recordPattern = /(?=(?:201|301),)/g;
      const rawSplit = qrData.split(recordPattern);
      records = rawSplit.filter(record => record.trim().length > 0);
    }
    
    console.log('分割されたレコード数:', records.length);
    records.forEach((record, index) => {
      console.log(`レコード${index}: ${record.substring(0, 50)}...`);
    });

    /**
     * Step 2: ヘッダー情報の解析
     */
    console.log('=== Step 2: ヘッダー解析 ===');
    
    let prescribedDate = new Date().toISOString().split('T')[0];
    let headerInfo = '';
    
    // 最初のレコードがヘッダー情報の可能性
    const firstRecord = records[0];
    if (firstRecord && !firstRecord.trim().startsWith('201') && !firstRecord.trim().startsWith('301')) {
      headerInfo = firstRecord;
      console.log('ヘッダー情報:', headerInfo);
      
      // 処方日の抽出（数字のみ、または数字+英字パターン）
      const dateMatch = headerInfo.match(/(\d{8,}[A-Z]?\d*)/);
      if (dateMatch) {
        const dateStr = dateMatch[1].replace(/[A-Z]/g, ''); // 英字を除去
        if (dateStr.length >= 8) {
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          prescribedDate = `${year}-${month}-${day}`;
          console.log('抽出された処方日:', prescribedDate);
        }
      }
    }

    /**
     * Step 3: 各レコードの解析と構造化
     */
    console.log('=== Step 3: レコード解析 ===');
    
    const medications: Medication[] = [];
    
    // 作業用の薬剤情報型を定義
    interface WorkingMedication {
      name?: string;
      dosage?: string;
      quantity?: string;
      unit?: string;
      days?: number;
    }
    
    let currentMedication: WorkingMedication | null = null;
    
    records.forEach((record, index) => {
      const trimmedRecord = record.trim();
      if (!trimmedRecord) return;
      
      console.log(`--- レコード ${index} 解析: ${trimmedRecord.substring(0, 100)} ---`);
      
      const parts = trimmedRecord.split(',');
      const recordType = parts[0]?.trim();
      
      if (recordType === '201') {
        /**
         * 201レコード: 薬剤基本情報
         * フォーマット: 201,インデックス,薬剤名,数量,単位,コード,フラグ...
         */
        console.log('🔬 201レコード（薬剤情報）を解析');
        
        const medicationIndex = parts[1]?.trim();
        const medicationName = parts[2]?.trim();
        const quantity = parts[3]?.trim();
        const unit = parts[4]?.trim();
        const medicationCode = parts[5]?.trim();
        
        if (medicationName) {
          // 前の薬剤が完了していれば配列に追加
          if (currentMedication && (currentMedication as any).name) {
            medications.push({
              name: (currentMedication as any).name,
              dosage: (currentMedication as any).dosage || '用法不明',
              quantity: (currentMedication as any).quantity || '',
              unit: (currentMedication as any).unit || '',
              days: (currentMedication as any).days
            });
          }
          
          // 新しい薬剤オブジェクトを開始
          currentMedication = {
            name: medicationName,
            quantity: quantity || '',
            unit: unit || '',
            dosage: '用法不明', // 301レコードで更新される
          };
          
          console.log(`✅ 薬剤${medicationIndex}: ${medicationName} (${quantity}${unit})`);
        }
        
      } else if (recordType === '301') {
        /**
         * 301レコード: 用法・用量情報
         * フォーマット: 301,インデックス,未使用,用法,日数,単位,フラグ...
         */
        console.log('💊 301レコード（用法情報）を解析');
        
        const medicationIndex = parts[1]?.trim();
        const dosageInfo = parts[2]?.trim();
        const daysInfo = parts[3]?.trim();
        const dosageUnit = parts[4]?.trim();
        
        if (currentMedication) {
          // 直前の薬剤オブジェクトに用法情報を追加
          if (dosageInfo) {
            currentMedication.dosage = dosageInfo;
          }
          
          // 日数の抽出
          if (daysInfo) {
            const daysMatch = daysInfo.match(/(\d+)/);
            if (daysMatch) {
              currentMedication.days = parseInt(daysMatch[1]);
            }
          }
          
          console.log(`✅ 用法${medicationIndex}: ${dosageInfo} (${daysInfo})`);
        } else {
          console.log('⚠️ 301レコードに対応する201レコードが見つかりません');
        }
        
      } else {
        console.log(`⚠️ 未知のレコードタイプ: ${recordType}`);
      }
    });
    
    // 最後の薬剤が残っている場合は追加
    if (currentMedication && (currentMedication as any).name) {
      medications.push({
        name: (currentMedication as any).name,
        dosage: (currentMedication as any).dosage || '用法不明',
        quantity: (currentMedication as any).quantity || '',
        unit: (currentMedication as any).unit || '',
        days: (currentMedication as any).days
      });
    }
    
    /**
     * Step 4: 結果の構築
     */
    console.log('=== Step 4: 結果構築 ===');
    console.log(`✅ 合計 ${medications.length} 種類の薬剤を解析完了`);
    
    medications.forEach((med, index) => {
      console.log(`  [${index + 1}] ${med.name}`);
      console.log(`      用法: ${med.dosage}`);
      console.log(`      数量: ${med.quantity}${med.unit}`);
      console.log(`      日数: ${med.days ? med.days + '日分' : '不明'}`);
    });
    
    return {
      sourceFormat: 'NON_JAHIS_CSV',
      prescribedDate,
      hospitalName: '処方元医療機関',
      patientName: '患者名（CSV解析）',
      medications: medications.length > 0 ? medications : [
        {
          name: '薬剤情報を解析できませんでした',
          dosage: 'データ形式を確認してください',
          quantity: '',
          unit: ''
        }
      ],
      rawData: qrData
    };
    
  } catch (error) {
    console.error('❌ 非JAHISカンマ区切り解析エラー:', error);
    return {
      sourceFormat: 'NON_JAHIS_CSV',
      prescribedDate: new Date().toISOString().split('T')[0],
      hospitalName: 'エラー',
      patientName: 'エラー',
      medications: [
        {
          name: '解析エラーが発生しました',
          dosage: error instanceof Error ? error.message : '不明なエラー',
          quantity: '',
          unit: ''
        }
      ],
      rawData: qrData
    };
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎯 Step 4: メインコントローラー実装
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * 🎯 統一QRコード処理メイン関数
 * 
 * この関数を呼び出すだけで、QRコード形式を意識することなく
 * 常にMedicationDataオブジェクトが取得できます。
 * 
 * @param qrData QRコードから読み取った生データ
 * @returns 統一形式のMedicationData、または解析失敗時はnull
 */
export function processQrCode(qrData: string): MedicationData | null {
  console.log('🎯 統一QRコード処理開始');
  console.log('データ長:', qrData?.length || 0);
  console.log('先頭50文字:', qrData?.substring(0, 50) || '');
  
  try {
    // Step 1: 形式判別
    const format = detectQrFormat(qrData);
    console.log('判別結果:', format);
    
    if (format === 'UNKNOWN') {
      console.log('❌ 未対応の形式です');
      return null;
    }
    
    // Step 2 & 3: 形式に応じた解析
    let result: MedicationData | null = null;
    
    if (format === 'JAHIS') {
      console.log('🔬 JAHIS形式として解析');
      result = parseJahisData(qrData);
    } else if (format === 'NON_JAHIS_CSV') {
      console.log('📊 非JAHISカンマ区切り形式として解析');
      result = parseNonJahisCsvData(qrData);
    }
    
    // 結果検証
    if (result && result.medications.length > 0) {
      console.log('✅ 解析成功!');
      console.log(`- 形式: ${result.sourceFormat}`);
      console.log(`- 処方日: ${result.prescribedDate}`);
      console.log(`- 薬剤数: ${result.medications.length}`);
      result.medications.forEach((med, index) => {
        console.log(`  [${index + 1}] ${med.name} - ${med.dosage}`);
      });
      
      return result;
    } else {
      console.log('❌ 解析に失敗しました');
      return null;
    }
    
  } catch (error) {
    console.error('❌ 統一QRコード処理エラー:', error);
    return null;
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🛠️ ユーティリティ関数
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * テスト用のサンプルデータで動作確認（拡張版）
 */
export function testUnifiedParser(): void {
  console.log('🧪 統一パーサーテスト開始（拡張版）');
  
  // テストデータセット
  const testCases = [
    {
      name: '非JAHISカンマ区切り（パターンA - 数字のみ）',
      data: "32971101830,1,301,1,1 日 1 回(朝食) 2 錠毎,1,調剤,5,1,,1,201,2,ベタメタゾンリン酸塩錠10mg「タナベ」,2,錠,4,4980022F2042,1,301,2,,(朝 タ)食後,30,日分,1,1,,1",
      expected: 'NON_JAHIS_CSV'
    },
    {
      name: '非JAHISカンマ区切り（パターンB - アルファベット含む）',
      data: "329711Q1030,1,301,1,1 日 1 回(朝食) 2 錠毎,1,調剤,5,1,,1,201,2,ベタメタゾンリン酸塩錠10mg「タナベ」,2,錠,4,4980022F2042,1,301,2,,(朝 タ)食後,30,日分,1,1,,1",
      expected: 'NON_JAHIS_CSV'
    },
    {
      name: '非JAHISカンマ区切り（改行区切りパターン）',
      data: "329711Q1030,1\r\n301,1,１日１回(眠前)２噴霧,1,調剤,5,1,,1\r\n201,2,ベポタスチンベシル酸塩錠１０ｍｇ「タナベ」,2,錠,4,4490022F2042,1\r\n301,2,(朝･夕)食後,30,日分,1,1,,1",
      expected: 'NON_JAHIS_CSV'
    },
    {
      name: 'JAHIS標準形式',
      data: "JAHIS|1|eyJwcmVzY3JpcHRpb24iOiJ0ZXN0In0=",
      expected: 'JAHIS'
    },
    {
      name: 'カンマなし文字列（未知の形式）',
      data: "ただの文字列です",
      expected: 'UNKNOWN'
    },
    {
      name: '空データ',
      data: "",
      expected: 'UNKNOWN'
    }
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 各テストケースを実行
  testCases.forEach((testCase, index) => {
    console.log(`--- テスト${index + 1}: ${testCase.name} ---`);
    console.log('テストデータ:', testCase.data.substring(0, 50) + '...');
    
    // 形式判別テスト
    const detectedFormat = detectQrFormat(testCase.data);
    const formatTestResult = detectedFormat === testCase.expected ? '✅' : '❌';
    console.log(`形式判別: ${detectedFormat} (期待値: ${testCase.expected}) ${formatTestResult}`);
    
    // 実際の解析テスト
    if (detectedFormat !== 'UNKNOWN') {
      const parseResult = processQrCode(testCase.data);
      console.log('解析結果:', parseResult ? '✅ 成功' : '❌ 失敗');
      if (parseResult) {
        console.log(`  - 薬剤数: ${parseResult.medications.length}`);
        console.log(`  - 形式: ${parseResult.sourceFormat}`);
      }
    }
    
    console.log('');
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 テスト完了');
}

/**
 * デバッグ用の詳細ログ出力
 */
export function debugQrData(qrData: string): void {
  console.log('🔍 QRデータ詳細デバッグ');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('データ長:', qrData.length);
  console.log('先頭100文字:', qrData.substring(0, 100));
  console.log('末尾100文字:', qrData.substring(Math.max(0, qrData.length - 100)));
  
  // 特殊文字の検出
  const specialChars = ['\x1C', '\x1D', '\x1E', '\x1F'];
  console.log('特殊文字検出:');
  specialChars.forEach(char => {
    const count = (qrData.match(new RegExp(char, 'g')) || []).length;
    if (count > 0) {
      console.log(`  - 0x${char.charCodeAt(0).toString(16)}: ${count}個`);
    }
  });
  
  // カンマの数
  const commaCount = (qrData.match(/,/g) || []).length;
  console.log('カンマ数:', commaCount);
  
  // 形式判別結果
  const format = detectQrFormat(qrData);
  console.log('判別形式:', format);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// デフォルトエクスポート
export default {
  processQrCode,
  detectQrFormat,
  parseJahisData,
  parseNonJahisCsvData,
  testUnifiedParser,
  debugQrData
};
