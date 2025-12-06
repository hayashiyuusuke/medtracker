import React, { useState, useEffect } from 'react';
import { medicationRecordService } from '../lib/database';
import type { MedicationRecord } from '../types/database';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicationRecord;
  onUpdate: (updatedRecord: MedicationRecord) => void;
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
  record,
  onUpdate
}: NotificationSettingsModalProps) {
  const [times, setTimes] = useState<string[]>([]);
  const [newTime, setNewTime] = useState('08:00');
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // モーダルが開いた時に初期値をセット
  useEffect(() => {
    if (isOpen && record.notification_times) {
      setTimes(record.notification_times);
    } else {
      setTimes([]);
    }
    
    // 通知権限の状態を確認
    if (typeof window !== 'undefined' && 'Notification' in window) {// window はブラウザのグローバルオブジェクト（ブラウザの「窓」みたいなもの）で、typeof window で型を確認している。。Notification は、ブラウザの通知 API（Application Programming Interface）。
      setPermissionStatus(Notification.permission);
    }
  }, [isOpen, record]);

  // 通知権限をリクエスト
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('このブラウザは通知に対応していません');
      return;
    }

    const permission = await Notification.requestPermission();//  Notification.requestPermission() = ブラウザの Notifications API（通知 API） に含まれる組み込み関数
    setPermissionStatus(permission);// state を更新して UI を反映。
    
    if (permission === 'granted') {
      // テスト通知を送る
      new Notification('通知設定が有効になりました', {// インスタンス化（new）して新しい通知オブジェクトを作成。Notification は、ブラウザの Notifications API に含まれるコンストラクタ関数（クラスみたいなもの）。
        body: '指定した時間に通知が届きます',
        icon: '/favicon.ico'
      });
    }
  };

  // 時間を追加
  const addTime = () => {
    if (!times.includes(newTime)) {// 現在の times 配列に newTime が含まれていない場合
      const newTimes = [...times, newTime].sort();// .sort(): 時間を昇順に並べ替え。
      setTimes(newTimes);
    }
  };

  // 時間を削除
  const removeTime = (timeToRemove: string) => {
    setTimes(times.filter(t => t !== timeToRemove));// filter(...): JavaScript の配列メソッド。条件に合う要素だけを残して、新しい配列を作る。
  };

  // 保存処理
  const handleSave = async () => {
    try {
      setLoading(true);
      
      // データベースを更新
      const updated = await medicationRecordService.updateMedicationRecord(record.id, {
        notification_times: times
      });

      if (updated) {
        onUpdate(updated);
        onClose();
      }
    } catch (error) {
      console.error('通知設定の保存に失敗しました:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800">通知設定</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* 薬剤情報 */}
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="font-bold text-blue-800">{record.medication?.drug_name || '薬剤名不明'}</p>
            <p className="text-sm text-blue-600 mt-1">{record.instructions}</p>
          </div>

          {/* 通知権限の確認 */}
          {permissionStatus !== 'granted' && (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">
                通知を受け取るにはブラウザの許可が必要です
              </p>
              <button
                onClick={requestPermission}
                className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded border border-yellow-300 transition-colors"
              >
                通知を許可する
              </button>
            </div>
          )}

          {/* 時間設定エリア */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              通知時間を追加
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                step="1800"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTime}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                追加
              </button>
            </div>
          </div>

          {/* 設定済み時間リスト */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              設定済みの時間 ({times.length})
            </label>
            {times.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-md border border-dashed border-gray-200">
                通知時間は設定されていません
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {times.map((time) => (
                  <div key={time} className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md">
                    <span className="font-medium text-gray-700">{time}</span>
                    <button
                      onClick={() => removeTime(time)}
                      className="text-gray-400 hover:text-red-500 ml-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
