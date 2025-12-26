/**
 * 用法（instructions）から通知時間を推測するユーティリティ
 */

// デフォルトの通知時間設定
const DEFAULT_TIMES = {
  morning: '08:00',
  noon: '12:00',
  evening: '18:00',
  night: '22:00'
};

/**
 * 用法テキストから推奨される通知時間の配列を生成する
 * @param instructions 用法テキスト（例: "1日3回 朝昼夕食後", "就寝前"）
 * @returns 時間文字列の配列（例: ["08:00", "12:00", "18:00"]）
 */
export function inferNotificationTimes(instructions: string): string[] {
  if (!instructions) return [];

  const times: Set<string> = new Set();
  const text = instructions;

  // 毎食後（朝・昼・夕）
  if (text.includes('毎食後') || text.includes('毎食')) {
    times.add(DEFAULT_TIMES.morning);
    times.add(DEFAULT_TIMES.noon);
    times.add(DEFAULT_TIMES.evening);
  }

  // 朝
  if (text.includes('朝') || text.includes('起床')) {
    times.add(DEFAULT_TIMES.morning);
  }

  // 昼
  if (text.includes('昼')) {
    times.add(DEFAULT_TIMES.noon);
  }

  // 夕・晩
  if (text.includes('夕') || text.includes('晩') || text.includes('夜')) {
    times.add(DEFAULT_TIMES.evening);
  }

  // 就寝前
  if (text.includes('寝') || text.includes('眠')) {
    times.add(DEFAULT_TIMES.night);
  }

  // 時間順にソートして返す
  return Array.from(times).sort();
}

/**
 * 用法テキストから回数制限の有無を判断する
 * @param instructions 用法テキスト
 * @returns 回数制限があるかどうか
 */
export function hasFrequencyLimit(instructions: string): boolean {
  if (!instructions) return true; // 不明な場合は制限ありとみなす

  const text = instructions;

  // 回数制限なしのキーワード
  const noLimitKeywords = [
    '疼痛時', '痛み時', '必要時', '適宜', '随時',
    '発作時', '症状時', '頓用', '頓服'
  ];

  // 回数制限なしの場合
  if (noLimitKeywords.some(keyword => text.includes(keyword))) {// .some() : 配列の要素が条件を満たすかどうかをチェックする JavaScript/TypeScript のメソッド
    return false;
  }

  // 回数指定がある場合（「1日3回」「1日2回」など）
  if (/\d+回/.test(text) || /回数/.test(text)) {
    return true;
  }

  // 「毎食後」「朝夕」など時間指定がある場合
  if (text.includes('毎食') || text.includes('朝') || text.includes('昼') ||
      text.includes('夕') || text.includes('晩') || text.includes('夜')) {
    return true;
  }

  // 不明な場合は制限ありとみなす
  return true;
}
