import type {
  ParsedMedication,
  MedicationData
} from '../types/database';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔬 Step 2: JAHISパーサー実装 (CSV特化)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// 推定ロジック用ヘルパー関数（リマインダー通知のための参考値）
function estimateCount(text: string): number | null {/* １日服用回数を数値化する関数 */
  if (!text) return null;
  
  const matchDaily = text.match(/1日(\d+)回/);// パターン: 1日X回
  if (matchDaily) return parseInt(matchDaily[1], 10);/* 10は１０進数 */

  if (text.includes('毎食')) return 3;  // パターン: 毎食後 -> 3回
  
  if (/朝.*昼.*[夕晩夜]/.test(text)) return 3;  // パターン: 朝昼夕 -> 3回
  
  if (/朝.*[夕晩夜]/.test(text)) return 2;  // パターン: 朝夕 -> 2回

  if (text.includes('時') || text.includes('頓服')) return null;  // パターン: 頓服（疼痛時など） -> null (回数不定)

  return null;
}

function estimateDose(text: string): number | null {/* １回服用量を数値化する関数 */
  if (!text) return null;

  const matchDose = text.match(/1回(\d+(?:\.\d+)?)/);  // パターン: 1回X錠/包/カプセル/mL
  if (matchDose) return parseFloat(matchDose[1]);
  
  return null;
}

export function processQrCode(qrData: string): MedicationData | null {
  console.log('🔬 JAHIS解析開始 (新ロジック)');
  
  try {
    const lines = qrData.split(/\r\n|\r|\n/);/* 行ごとに分割して配列にする処理 */
    
    let patientName = '';
    let prescribedDate = new Date().toISOString().split('T')[0];
    let hospitalName = '';
    
    const medications: ParsedMedication[] = [];
    let currentMedication: Partial<ParsedMedication> | null = null;/* Partial<T> はTypeScriptの機能で、「全てのプロパティを必須ではなく任意（あってもなくても良い状態）にする」という意味 */

    // レコード解析ループ
    for (const line of lines) {/* lines の中身を、先頭から1つずつ line に入れて繰り返す */
      const record = line.trim();
      if (!record) continue;

      const columns = record.split(',');/* さっきは行で分けたが、さらにここでカンマで分割 */
      const recordId = columns[0];

      switch (recordId) {
        case '1': // 患者情報（1,氏名,性別,生年月日...）
          if (columns[1]) patientName = columns[1];
          break;

        case '5': // 調剤年月日（5,YYYYMMDD）
          if (columns[1] && columns[1].length === 8) {
            const d = columns[1];
            prescribedDate = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
          }
          break;

        case '51': // 処方医療機関（51,医療機関名...）
          if (columns[1]) hospitalName = columns[1];
          break;

        case '201': // 薬品情報（201,RP番号,薬品名,用量,単位,薬品コード...）前の薬品があれば保存
          if (currentMedication && currentMedication.name) {/* もし currentMedicationに既にデータが入っているなら、それは「前の薬の処理が終わった」ということなので、完成品リスト（medications）に追加（push）して退避させる。 */
            medications.push(currentMedication as ParsedMedication);
          }
          
          currentMedication = {// 新しい薬品開始（201,RP番号,薬品名,用量,単位,薬品コード...）
            name: columns[2] || '不明な薬品',
            quantity: columns[3],
            unit: columns[4],
            usage_text: '', /* この3行はまだ不明（301の情報）であるためわからない */
            estimated_count: null,
            estimated_dose: null
          };
          break;

        case '301': // 用法情報（301,RP番号,用法,用量,調剤単位...）
          if (currentMedication) {
            const usage = columns[2] || '';
            currentMedication.usage_text = currentMedication.usage_text // 用法テキストをそのまま保存（連結する場合もありうるが、通常は1レコード） 既存のテキストがあれば改行で連結
              ? `${currentMedication.usage_text}\n${usage}` 
              : usage;
            
            // 推定ロジック実行
            if (!currentMedication.estimated_count) {
              currentMedication.estimated_count = estimateCount(usage);
            }
            if (!currentMedication.estimated_dose) {
              currentMedication.estimated_dose = estimateDose(usage);
            }
            
            if (columns[3]) {// 処方日数がここにある場合もある（カラム3）
               currentMedication.days = columns[3];
            }
          }
          break;
          
        case '311': // 備考
           if (currentMedication && columns[2]) {
             currentMedication.usage_text = currentMedication.usage_text 
               ? `${currentMedication.usage_text}\n(備考: ${columns[2]})` 
               : `(備考: ${columns[2]})`;
           }
           break;
      }
    }

    if (currentMedication && currentMedication.name) { // 最後の薬品を保存
      medications.push(currentMedication as ParsedMedication);
    }

    if (medications.length === 0) {
      console.log('❌ 薬剤データが見つかりませんでした');
      return null;
    }

    return {/* 得た情報を最終的にMedicationDataという箱に入れるために返り値としてまとめてここに記載 */
      prescribedDate,
      hospitalName,
      patientName,
      medications
    };

  } catch (error) {
    console.error('❌ JAHIS解析エラー:', error);
    return null;
  }
}

export function debugQrData(qrData: string): void {
  console.log('データ長:', qrData.length);
  console.log('先頭100文字:', qrData.substring(0, 100));
  console.log('カンマ数:', (qrData.match(/,/g) || []).length);
}
