'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { medicationRecordService } from '../lib/database';
import type { MedicationRecord } from '../types/database';

export default function NotificationManager() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const lastCheckedMinute = useRef<string>('');// useRef = コンポーネント内で値を「覚えておく」ためのものだが、再レンダリング（画面更新）を起こさない のが特徴。

  // ユーザーの処方記録を取得（定期更新）
  useEffect(() => {
    if (!user) return;

    const fetchRecords = async () => {
      try {
        const data = await medicationRecordService.getUserMedicationRecords(user.id);
        setRecords(data);
      } catch (error) {
        console.error('通知用データの取得に失敗:', error);
      }
    };

    fetchRecords();
    
    // 30秒ごとにデータを再取得（設定変更を反映させるため）
    const intervalId = setInterval(fetchRecords, 30000);
    
    // ウィンドウがフォーカスされた時も再取得
    window.addEventListener('focus', fetchRecords);// 別のタブで変更した設定（薬の追加など）を、戻ってきた時に即座に反映させるため
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', fetchRecords);
    };
  }, [user]);

  // 定期的なチェック（通知ロジック）
  useEffect(() => {
    if (!user) return;

    const checkNotifications = () => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');// 文字列を2桁にし、足りない場合は先頭に'0'を追加（例: "5" → "05"）。
      const currentMinute = now.getMinutes().toString().padStart(2, '0');// 日時オブジェクト（now）から分を取得し、同様に2桁の文字列に変換。
      const currentTime = `${currentHour}:${currentMinute}`;

      // 同じ分に何度も通知しないようにチェック
      if (lastCheckedMinute.current === currentTime) return;// .current は useRef が返すオブジェクトに、あらかじめ用意されている特別なプロパティ　　（メソッドは何かを処理する。プロパティは単なる値の保存場所。）
      lastCheckedMinute.current = currentTime;

      // 通知権限がない場合は何もしない
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
        return;
      }

      records.forEach(record => {
        if (record.notification_times && record.notification_times.includes(currentTime)) {// 設定した時間と現在の時間が一致するかチェック
          // 薬の名前を取得（データがない場合は「お薬」とする）
          const drugName = record.medication?.drug_name || 'お薬';
          
          // 通知を表示
          try {
            new Notification('お薬の時間です', {
              body: `${drugName} の服用時間です (${currentTime})`,// body、icon、tag は、ブラウザの Notification API であらかじめ用意されているプロパティ
              icon: '/favicon.ico', // アプリのアイコン
              tag: `medication-${record.id}-${currentTime}` // 重複通知防止用のタグ
            });
          } catch (e) {
            console.error('通知の表示に失敗しました:', e);
          }
        }
      });
    };

    // 10秒ごとにチェックして、分が変わったタイミングで通知
    const intervalId = setInterval(checkNotifications, 10000);

    // 初回マウント時にもチェックを実行（開発中の動作確認用）
    checkNotifications();

    return () => clearInterval(intervalId);
  }, [user, records]);

  return null; // このコンポーネントは画面には何も表示しません
}
