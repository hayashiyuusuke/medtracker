'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { doseRecordService, medicationRecordService } from '../../lib/database';// 服用履歴ページで「予約リスト（予定）」を導入したため、処方データが必要になったからmedicationRecordService を新たにインポート
import ProtectedRoute from '../../components/ProtectedRoute';
import { hasFrequencyLimit } from '../../lib/timeUtils';
import type { DoseRecord, MedicationRecord } from '../../types/database';
import { el, te } from 'date-fns/locale';
import { fa } from 'zod/locales';

interface DoseScheduleItem {// データベースには存在しない、画面表示専用の型
  id: string; // 既存のDoseRecord ID または 一時的なID（服用した薬剤データにつけられるID）
  medicationRecordId: string;// MedicationRecordのID（服用に限らず全ての薬剤データにつけられているID）
  medicationName: string;
  scheduledTime: string; // "08:00" などの時刻文字列（ただの文字列）
  isTaken: boolean;// notific
  doseRecordId?: string; // 既に記録がある場合 DoseRecord ID
  instructions?: string; // 用法（時間がない場合用）
  isTimeSpecific: boolean; // 時間指定があるかどうか（適宜薬と定期薬の区別のため必要）
  maxCount?: number; // 1日あたりの服用回数（必要に応じて追加）
}

/**
 * 日付別フィルタリング機能と服用完了ボタンを提供
 */
const DoseHistoryPage = () => {// 服用履歴ページ - ユーザーの薬剤服用記録を表示
  const { user } = useAuth();
  const [scheduleItems, setScheduleItems] = useState<DoseScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);// 選択された日付を管理する(初期値は現在日時)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 1. 処方データと今日の服用記録を並行して取得
        const [medicationRecords, doseRecords] = await Promise.all([//.  Promise.all = 下記に指定した二つの非同期処理を並行して実行し、両方の結果が揃うのを待つ
          medicationRecordService.getUserMedicationRecords(user.id),// 特定ユーザーの全ての処方データを取得
          doseRecordService.getUserDoseRecords(user.id, selectedDate)// 特定ユーザーの指定日付の服用記録を取得
        ]);

        // 2. 予定リストを生成
        const items: DoseScheduleItem[] = [];

        medicationRecords.forEach(med => {// map ではなく forEach を使う理由は、単に配列をループして items に要素を追加したいだけだから=map は新しい配列を返してしまう。forではない理由はbreak や return を使わないからforEach の方がシンプル
          // A. 通知時間がある場合
          if (med.notification_times && med.notification_times.length > 0) {
            med.notification_times.forEach(time => {
              // 既に記録があるか探す
              const existingRecord = doseRecords.find(d => 
                d.medication_record_id === med.id && 
                d.scheduled_time.includes(time) // 簡易的な判定（本来は日付も考慮）
              );

              items.push({
                id: existingRecord?.id || `temp-${med.id}-${time}`,// temp-: 一時的（temporary）であることを示す接頭語
                medicationRecordId: med.id,
                medicationName: med.medication?.drug_name || '名称不明',
                scheduledTime: time,
                isTaken: existingRecord?.taken || false,
                doseRecordId: existingRecord?.id,
                isTimeSpecific: true
              });
            });
          } 
          // B. 通知時間がない（「適宜服用」や「疼痛時」など）場合
          else {
            // 回数制限がある場合のみ枠を作る
            let limit = med.frequency_per_day || 0;
            // frequency_per_dayがない場合、用法テキストから回数を抽出を試みる
            if (!limit && med.instructions) {
              const match = med.instructions.match(/(\d+)回/);
              if (match) {
                limit = parseInt(match[1], 10);
              }
            }

            if (limit > 0) {
              for (let i = 0; i < limit; i++) {
                // この薬の記録のうち、時間指定がないもの（または手動記録）を順番に割り当てる
                const existingRecord = doseRecords.filter(d => d.medication_record_id === med.id)[i];

                items.push({
                  id: existingRecord?.id || `temp-${med.id}-dose-${i}`,
                  medicationRecordId: med.id,
                  medicationName: med.medication?.drug_name || '名称不明',
                  scheduledTime: existingRecord ? formatTime(existingRecord.actual_time || '') : '-',
                  isTaken: existingRecord?.taken || false,
                  doseRecordId: existingRecord?.id,
                  instructions: med.instructions || `${i + 1}回目`,
                  isTimeSpecific: false,
                  maxCount: limit
                });
              }
            } else {
              // 回数制限なしの場合：既存の服用記録がある場合のみ枠を作る
              const existingRecords = doseRecords.filter(d => d.medication_record_id === med.id);
              existingRecords.forEach((existingRecord, index) => {
                items.push({
                  id: existingRecord.id,
                  medicationRecordId: med.id,
                  medicationName: med.medication?.drug_name || '名称不明',
                  scheduledTime: formatTime(existingRecord.actual_time || ''),
                  isTaken: existingRecord.taken,
                  doseRecordId: existingRecord.id,
                  instructions: med.instructions || '適宜',
                  isTimeSpecific: false,
                  maxCount: med.frequency_per_day
                });
              });
              items.push({
                id: `temp-${med.id}-new`,// Reactでリストを表示する際（map関数を使う時）には、それぞれの項目に重複しない key（ID）が必要。そのため、まだデータがない項目にも「仮のID」を割り振る必要がある。
                medicationRecordId: med.id,
                medicationName: med.medication?.drug_name || '名称不明',
                scheduledTime: '-',
                isTaken: false,
                doseRecordId: undefined, // まだ記録がないので
                instructions: med.instructions || '適宜',
                isTimeSpecific: false,
                maxCount: med.frequency_per_day
              });
            }
          }
        });

        // 3. 時間順にソート（時間指定なしは最後）
        items.sort((a, b) => {// 比較関数: (a, b) => number の形式
          if (a.isTimeSpecific && b.isTimeSpecific) {
            return a.scheduledTime.localeCompare(b.scheduledTime);// localeCompare(...): 文字列を辞書順に比較するJavaScriptのメソッド
          }
          if (a.isTimeSpecific) return -1;
          if (b.isTimeSpecific) return 1;
          return 0;
        });

        setScheduleItems(items);

      } catch (err) {
        console.error('データの取得エラー:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedDate]);// 依存配列: user と selectedDate が変更されたときに再実行

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('ja-JP', {//.  .toLocaleTimeString() : 日時をロケール（言語・地域）に基づいてフォーマットされた時間文字列に変換するメソッド
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP');
    } catch {
      return '不明';
    }
  };

  const handleMarkDoseTaken = async (item: DoseScheduleItem) => {
    try {
      // 服用済みの場合：未服用に戻す（取り消し処理）
      if (item.isTaken) {
        if (item.doseRecordId) {
          await doseRecordService.deleteDoseRecord(item.doseRecordId);
          setScheduleItems(prev => {
            const newLists = prev.map(i =>// mapがforEachと違うところ＝「配列の要素を1つずつ取り出して、変換して、新しい配列を作る」。変換後の新しい配列が戻り値になる。
              i.id === item.id ? { ...i, doseRecordId: undefined, isTaken: false } : i
            );
            if (!item.isTimeSpecific) {// 時間指定なし薬の場合(適宜薬)、未服用に戻したらその枠を削除
              return newLists.filter(i => //fillter(...): 配列の要素を一つずつ調べて、条件に合うものだけを残して新しい配列を作る
                i.id === item.id ||// 今操作したボタンである、または
                i.medicationRecordId !== item.medicationRecordId ||// 違う薬である、または
                i.isTaken === true// 服用済みである
              );
            }
            return newLists;
          });
        }
        return;
      }                   
      // 未服用の場合：服用済みにする
      if (!item.doseRecordId) {// 論理NOT演算子
        // 新規作成
        const newRecord = await doseRecordService.createDoseRecord(user!.id, {// 非nullアサーション演算子: user が null でないことを TypeScript に伝える
          user_id: user!.id,
          medication_record_id: item.medicationRecordId,
          scheduled_time: item.isTimeSpecific ? `${selectedDate}T${item.scheduledTime}:00` : new Date().toISOString(),
          taken: true,
          actual_time: new Date().toISOString()
        });
        
        setScheduleItems(prev => {
          const newList = prev.map(i =>
            i.id === item.id ? { ...i, isTaken: true, doseRecordId: newRecord.id } : i// ...i: 既存のオブジェクトの全プロパティを展開（コピー）し、isTaken と doseRecordId を上書き
          );
          if (!item.isTimeSpecific) {// 時間指定なし薬の場合(適宜薬)、新たに服用枠を追加する必要があるかチェック
            const currentCount = newList.filter(i => i.medicationRecordId === item.medicationRecordId).length;
            const maxLimit = item.maxCount || 999;
            if(currentCount >= maxLimit) {
              return newList;
            }
            newList.push({// 時間指定なし薬の場合、新たに服用枠を追加
              id: `temp-${item.medicationRecordId}-${Date.now()}`,
              medicationRecordId: item.medicationRecordId,
              medicationName: item.medicationName,
              scheduledTime: '-',
              isTaken: false,
              instructions: item.instructions,
              isTimeSpecific: false,
              maxCount: item.maxCount
            });
          }
          return newList;
        }); // prev = scheduleItems の最新の値
      
      } else {
        // 更新
        await doseRecordService.markDoseTaken(item.doseRecordId);
        setScheduleItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, isTaken: true } : i
        ));
      }
    } catch (err) {
      console.error('服用記録の更新エラー:', err);
      setError('服用記録の更新に失敗しました');
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }
 
  const groupedItems = scheduleItems.reduce((acc, item) => {// reduce(...): JavaScript の配列メソッド。配列を1つの値（ここではオブジェクト）にまとめる。
    const key = item.medicationRecordId;
    if (!acc[key]) {
      acc[key] = {
        medicationRecordId: item.medicationRecordId,
        medicationName: item.medicationName, // 薬の名前も保存しておく
        instructions: item.instructions,     // 用法も保存しておく
        isTimeSpecific: item.isTimeSpecific, // タイプも保存しておく
        items: []                            // ボタンを入れる配列はここ！;
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, {
    medicationRecordId: string;
    medicationName: string;
    instructions?: string;
    isTimeSpecific: boolean;
    items: DoseScheduleItem[]
  }>);
 
  return (
    <ProtectedRoute>
      <div className="min-h-screen py-8 bg-[#cee6c1]">
        <div className="max-w-4xl mx-auto px-4">
          
          {/* ページヘッダー */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl text-gray-700">服薬チェック</h1>
          </div>

          {/* 日付選択 */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4">
              <label htmlFor="date" className="font-medium text-gray-700">
                日付を選択:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-gray-700 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 服用記録一覧 */}
          {scheduleItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"

                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {formatDate(selectedDate)}の服用予定はありません
              </h3>
              <p className="text-gray-600">
                処方データが登録されていないか、予定がありません
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(groupedItems).map((group) => (// groupedItems はオブジェクトのため配列を取り出さないとmap関数が使えない(オブジェクトには番号が割り振られていなくて、配列には番号が割り振られている)
                <div key={group.medicationRecordId} className={`bg-white rounded-lg shadow p-6 mb-4`}>
                  {/* 薬の名前 */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {group.medicationName}
                  </h3>
                  {/* ボタンのリスト */}
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleMarkDoseTaken(item)}
                        className={`px-4 py-2 text-sm rounded-full font-bold shadow-sm transition-all ${
                          item.isTaken
                            ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                          : 'bg-white border-2 border-blue-500 text-blue-500 hover:bg-blue-50 active:scale-95'
                        }`}
                      >
                        {item.isTaken ? '服用済み' : '服用する '}
                        {/* 時間指定があるなら時間を、なければ用法（1回目など）を表示 */}
                        {item.isTimeSpecific ? item.scheduledTime : item.instructions}
                        {item.isTaken ? ' (済)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DoseHistoryPage;
