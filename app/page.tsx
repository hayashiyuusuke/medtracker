'use client';

import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

/**
 * ホーム画面 - シンプルなタイトルと歓迎メッセージのみ表示
 * ナビゲーションはボトムナビゲーションバーで提供
 */
function HomePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      {/* 画面全体を中央揃えのコンテナとして設定 */}
      <main className="flex flex-col justify-center items-center h-screen px-4">
        
        {/* アプリケーションタイトル */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          MedTracker
        </h1>
        
        {/* 歓迎メッセージ - ユーザーのメールアドレスを表示 */}
        <p className="text-lg text-gray-700 text-center">
          ようこそ、{user?.email || 'ゲスト'}さん
        </p>
        
      </main>
    </ProtectedRoute>
  );
}

export default HomePage;