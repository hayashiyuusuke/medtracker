/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔄 統一QRコード解析モジュール
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// 型定義のインポート（types/database.ts から一元管理）
import type {
  ParsedMedication,
  MedicationData,
  QrFormat,
  ParseError
} from '../types/database';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔍 Step 1: データ形式自動判別
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/**
 * @param qrData QRコードから読み取った生データ
 * @returns 判別されたデータ形式
 */
/* この2行はJSDocコメント と呼ばれるもので、関数の説明を記述するための特殊なコメント形式。なくてもいいがあった方が親切でわかりやすい。 param = パラメーター qrData = 関数の引数名 returns = 戻り値の説明 */
export function detectQrFormat(qrData: string): QrFormat {
  console.log('🔍 QR形式判別開始（改善版）:', qrData.substring(0, 50) + '...');
  
  // 空データチェック　ガード節
  if (!qrData || qrData.trim() === '') {
    console.log('❌ 空のデータ');
    return 'UNKNOWN';
  }

  const trimmedData = qrData.trim();
  
  /**
   * Rule 1 (Priority: HIGH)
   * JAHIS形式の判別 - 'JAHIS|1|' で始まるかを確認
   */
  if (trimmedData.startsWith('JAHIS|1|')) {/* .startsWith(): 文字列が指定の文字で始まるかを判定するJavaScriptのメソッド */
    console.log('✅ JAHIS標準形式として判別（JAHIS|1|パターン）');/* JAHISが定めたお薬手帳QRコードの標準規格では、データが必ず JAHIS|1| で始まるルールになっている */
    return 'JAHIS';
  }
  
  // 追加のJAHIS形式パターン
  if (trimmedData.startsWith('JAHIS|') || trimmedData.includes('JAHIS')) {
    console.log('✅ JAHIS標準形式として判別（その他JAHISパターン）');
    return 'JAHIS';
  }
  
  // JAHISバイナリ形式（特殊文字区切り）
  if (trimmedData.includes('\x1C') && trimmedData.includes('\x1D')) {/* ASCII制御文字 \x1C と \x1D が含まれていれば true */
    console.log('✅ JAHISバイナリ形式として判別');
    return 'JAHIS';
  }

  /**
   * Rule 2 (Priority: MEDIUM)  
   * 非JAHIS形式の判別 - カンマが含まれているかを確認
   * より普遍的な特徴（カンマの存在）で判定し、将来のパターンにも対応
   */
  if (trimmedData.includes(',')) {
    console.log('✅ 非JAHISカンマ区切り形式として判別（カンマ存在パターン）');/* QRコードのデータにカンマ(,)が含まれていれば、非JAHIS形式(カンマ区切り形式)と判定している */
    console.log('📊 カンマ数:', (trimmedData.match(/,/g) || []).length);/* .match()	文字列から正規表現パターンに一致する部分を検索 g = グローバルフラグ（全て見つける） ||[] = 左辺がnullの場合から配列を返す */
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
  console.log('   - 先頭文字:', trimmedData.charAt(0));/* .charAt(位置) メソッド = 指定位置の1文字を取得 */
  console.log('   - カンマ含有:', trimmedData.includes(','));/* .includes() メソッド = 戻り値: true または false (boolean型) */
  console.log('   - JAHIS含有:', trimmedData.includes('JAHIS'));
  return 'UNKNOWN';/* 関数を終了し、'UNKNOWN' を返す */
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
export function parseJahisData(qrData: string): MedicationData | null {/* qrData = 引数 MedicationData | null = 戻り値 */
  console.log('🔬 JAHIS解析開始');
  
  try {
    // JAHIS Base64形式の処理/* Base64形式とは、バイナリデータを64種類のASCII文字で表現する方式。バイナリを通信で壊れないテキストに変えるために使用される */
    if (qrData.startsWith('JAHIS|')) {
      return parseJahisBase64Format(qrData);
    }

    // JAHISバイナリ形式の処理/* バイナリデータとは、特定の形式で表現されたデータのことです。 */
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
function parseJahisBase64Format(qrData: string): MedicationData | null {/* export ではないのは、内部でのみ使用するため。他のファイルに export するのは detectQrFormat() , parseJahisData() , parseNonJahisCsvData() , processQrCode() のみ */
  console.log('📄 JAHIS Base64形式解析');
  
  try {
    // "JAHIS|1|base64data" 形式の解析
    const parts = qrData.split('|');/* .split('|') = パイプ記号（|）で文字列を分割 */
    if (parts.length < 3) {/* JAHIS標準規格では、データが必ず3つの部分に分かれているため、3つ未満のパーツの場合エラーを投げる */
      throw new Error('Invalid JAHIS format');
    }
    
    const base64Data = parts[2];
    
    // 注：実際の実装では、zlibやpakoライブラリでXMLを展開
    // ここでは簡略化した処理を示す
    console.log('Base64データサイズ:', base64Data.length);
    
    // モックデータとして基本情報を返す/* モックデータとは本物そっくりのダミーデータ */
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
          days: '7'  // 文字列型に統一
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
function parseJahisBinaryFormat(qrData: string): MedicationData | null {/* JAHISバイナリ形式（特殊文字で区切られた形式）のQRコードを解析する関数 */
  console.log('🔢 JAHISバイナリ形式解析');
  
  try {
    const sections = qrData.split('\x1C');/* '\x1C' = データを区切るための特殊文字 */
    const medications: ParsedMedication[] = [];  
    const hospitalName = 'JAHIS医療機関';
    const patientName = 'JAHIS患者';
    const prescribedDate = new Date().toISOString().split('T')[0];
    
    // セクション解析（簡略版）
    sections.forEach((section, index) => {/* forEach = 配列の各要素に対して処理を実行。 section: 現在の要素の値。 index: 現在の要素の位置（0から始まる)。 */
      console.log(`セクション ${index}:`, section.substring(0, 50));/* 先頭50文字だけ取得 */
      
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
      prescribedDate,/* 短縮記法（変数名とプロパティ名が同じ場合） */
      hospitalName,
      patientName,
      medications: medications.length > 0 ? medications : [/* 条件 ? 真の場合 : 偽の場合 */
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
 * 関数ごとにデータの状態・意味が異なるため、それぞれにJSDocを書く */
export function parseNonJahisCsvData(qrData: string): MedicationData | null {
  console.log('📊 非JAHISカンマ区切り解析開始（新ロジック）');
  console.log('生データ:', qrData.substring(0, 200) + '...');
  
  try {
    /**
     * Step 1: レコードへの分割　\r\n や改行文字でまず分割し、その後 201, や 301, でレコードを識別
     */
    console.log('=== Step 1: レコード分割 ===');
    
    // 改行文字で分割（\r\n, \n, \r に対応）
    let records = qrData.split(/\r\n|\r|\n/);
    
    // 改行がない場合は、201, や 301, パターンで分割を試行（改行がないQRコードも存在する。その場合、全データが1つの要素になってしまう）
    if (records.length === 1) {
      console.log('改行文字なし、パターンマッチで分割を試行');
      // 201, や 301, の前で分割（先頭は除く）
      const recordPattern = /(?=(?:201|301),)/g;/* (?=pattern) = 先読みアサーション👉「この位置の直後にpatternがあるか確認」(?:) = 非キャプチャグループ👉グループ化だけして記憶はしない。速い、効率的。 */
      /* 日本の標準規格で定められているレコードタイプ👉薬の情報（201）と飲み方（301） */
      const rawSplit = qrData.split(recordPattern);
      records = rawSplit.filter(record => record.trim().length > 0);/* .filter() = 条件を満たす要素のみ残す トリムして文字数が０文字以上のrecord要素を返す */
    }
    
    console.log('分割されたレコード数:', records.length);
    records.forEach((record, index) => {
      console.log(`レコード${index}: ${record.substring(0, 50)}...`);
    });

    /**
     * Step 2: ヘッダー情報の解析
     */
    console.log('=== Step 2: ヘッダー解析 ===');
    
    let prescribedDate = new Date().toISOString().split('T')[0];/* もしQRコードから処方日が抽出できなかった場合のデフォルト値（今日の日付）として使用 */
    let headerInfo = '';/* 初期値が空文字の変数 */
    
    // 最初のレコードがヘッダー情報の可能性 処方日や医療機関情報などのヘッダーが先頭にあり、その後に薬剤レコード（201, 301）が続く場合があるため
    const firstRecord = records[0];
    if (firstRecord && !firstRecord.trim().startsWith('201') && !firstRecord.trim().startsWith('301')) {/* 「201」や「301」で始まらない場合のみ、ヘッダーとして処理する。 */
      headerInfo = firstRecord;
      console.log('ヘッダー情報:', headerInfo);
      
      // 処方日の抽出（数字のみ、または数字+英字パターン）
      const dateMatch = headerInfo.match(/(\d{8,}[A-Z]?\d*)/);
      /* 8桁以上の数字 = \d{8,} 
       * オプションで1文字の大文字アルファベット = [A-Z]? 
       * 0文字以上の数字 = \d* */
      if (dateMatch) {
        const dateStr = dateMatch[1].replace(/[A-Z]/g, ''); // 英字を除去
        if (dateStr.length >= 8) {
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          prescribedDate = `${year}-${month}-${day}`;
          console.log('抽出された処方日:', prescribedDate);
        }
      }/* return があるとこの後の薬剤レコードの解析がスキップされるため、return は不要。 */
    }

    /**
     * Step 3: 各レコードの解析と構造化
     */
    console.log('=== Step 3: レコード解析 ===');
    
    const medications: ParsedMedication[] = [];
    
    interface WorkingMedication { // 作業用の薬剤情報型を定義
      name: string;  // 必須に変更（型安全強化）
      dosage?: string;
      quantity?: string;
      unit?: string;
      days?: string;  // 文字列型に統一
    }/* 薬剤情報を一時的に保持・構築するための「作業用」型定義。最終的な出力型（ParsedMedication）とは異なり、解析途中で不完全なデータを扱える柔軟な構造を提供。 */

    const medicationMap = new Map<number, WorkingMedication>();/* Map とはキーと値のペアを保持するコレクションで、薬剤情報をインデックスで管理するために使用。ここでは201と301を同じインデックスでリンクするために機能している。Map の特徴として、キーで直接アクセスできて同じインデックスのレコードが複数あっても、上書きして最新の情報を保持。 */

    records.forEach((record, index) => {
      const trimmedRecord = record.trim();
      if (!trimmedRecord) return;/* 早期リターン　forEachスキップし、以下の処理に移る */
      
      console.log(`--- レコード ${index} 解析: ${trimmedRecord.substring(0, 100)} ---`);
      
      const parts = trimmedRecord.split(',');
      const recordType = parts[0]?.trim();/* オプショナルチェーン = nullやundefinedの場合にエラーを防ぐための構文 */
      
      if (recordType === '201') { /*201レコード: 薬剤基本情報　フォーマット: 201,インデックス,薬剤名,数量,単位,コード,フラグ...*/
        console.log('🔬 201レコード（薬剤情報）を解析');
        
        const medicationIndex = parseInt(parts[1]?.trim() || '0');/* parseFloat（小数）とは異なり、parseIntは小数点以下をすべて切り捨て */
        const medicationName = parts[2]?.trim() || '';/* 空文字にすることで、下の処理でスキップする設計 */
        const quantity = parts[3]?.trim();
        const unit = parts[4]?.trim();
        const medicationCode = parts[5]?.trim();

        if (medicationName.trim()) {/* ここで空文字なら処理をスキップし、無効なレコードを保存しない設計 */
          medicationMap.set(medicationIndex, {
            name: medicationName,
            quantity: quantity || '',
            unit: unit || '',
            dosage: '用法不明',
          });
          
          console.log(`✅ 薬剤${medicationIndex}: ${medicationName} (${quantity}${unit})`);
        }

      } else if (recordType === '301') { /*301レコード: 用法・用量情報　フォーマット: 301,インデックス,未使用,用法,日数,単位,フラグ...*/
        console.log('💊 301レコード（用法情報）を解析');
        
        const medicationIndex = parseInt(parts[1]?.trim() || '0');/* medicationIndex は Map<number, WorkingMedication> のキーとして数値型である必要があるため、parseInt で整数に変換 */
        const dosageInfo = parts[3]?.trim();
        const daysInfo = parts[4]?.trim();
        const dosageUnit = parts[5]?.trim();
        
        const med = medicationMap.get(medicationIndex);
        if (med) {
          if (dosageInfo) {
            med.dosage = dosageInfo;
          }
          
          if (daysInfo) {
            const daysMatch = daysInfo.match(/(\d+)日分/) || daysInfo.match(/(\d+)/);
            if (daysMatch) {
              med.days = daysMatch[1];
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
    
    medicationMap.forEach((med) => { // Mapから配列に変換 /* forEach の役割: 配列や Map の各要素に対して、指定したコールバック関数を順次実行。ループ処理を簡潔に書けるメソッド。 */
      medications.push({
        name: med.name,
        dosage: med.dosage || '用法不明',
        quantity: med.quantity || '',
        unit: med.unit || '',
        days: med.days
      });
    });
    
    /**
     * Step 4: 結果の構築
     */
    console.log('=== Step 4: 結果構築 ===');
    console.log(`✅ 合計 ${medications.length} 種類の薬剤を解析完了`);

    medications.forEach((med, index) => {/* 「キーと値のペアだから (key, value) の順で来るはずだ」と直感的に思いがちですが、「配列と同じで『中身』が主役だから (value, key) の順」 と覚えると理解しやすい */
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
