/**
 * 🏥 MedTracker ヘッダーコンポーネント
 * 
 * 【このコンポーネントの目的】
 * - アプリケーション全体で共通して表示される上部ナビゲーション
 * - ユーザーにアプリ名とメインナビゲーションを提供
 * - すべてのページで一貫したブランディングを維持
 */
'use client';

import React from 'react';
import Link from 'next/link';
import {useState} from 'react';
import { is } from 'date-fns/locale';
/**
 * ヘッダーコンポーネント
 * 
 * @purpose アプリケーション全体の上部に表示される共通ヘッダー
 * @returns JSX.Element ヘッダーのUIコンポーネント
 * 
 * 🧠 [問い] なぜこのコンポーネントを別ファイルに分けたのでしょうか？
 * もしlayout.tsxに直接書いたらどんな問題があるでしょうか？
 */
export default function Header() {
  
  console.log('🎯 [開始] Headerコンポーネントがレンダリング開始されました');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // モバイルメニューの開閉状態を管理
  
  return (
    <header 
      className="sticky top-0 z-50 bg-[#cee6c1] text-white shadow-sm"
      role="banner" // アクセシビリティ: スクリーンリーダー用
    >
      {/* 
        🔍 [解説] div要素にcontainerクラスを適用
        - max-width: コンテンツの最大幅を制限
        - mx-auto: 左右の余白を自動調整（中央配置）
        - px-4: 左右に適切な余白を確保
      */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* 
            📱 [セクション1] アプリケーションロゴ・タイトル部分
            ここはアプリのアイデンティティを示す最重要エリア
          */}
          <div className="flex items-center space-x-2">
            {/* 
              🧠 [問い] なぜここで<h1>タグを使っているのでしょうか？
              <div>や<span>ではダメでしょうか？SEO観点で考えてみてください。
            */}
            <h1 className="text-xl  text-gray-700">
              MedTracker
            </h1>
            <span className="text-green-200 text-sm hidden sm:inline">
              お薬手帳アプリ
            </span>
          </div>

          {/* 
            🔗 [セクション2] メインナビゲーション部分
            将来的にユーザーが各機能にアクセスするためのリンク
          */}
          <nav role="navigation" aria-label="メインナビゲーション">
            <div className="hidden md:flex space-x-6">
              {/* 
                🧠 [問い] なぜ 'hidden md:flex' クラスを使っているのでしょうか？
                レスポンシブデザインの観点から考えてみてください。
              */}
              <Link 
                href="/" 
                className="hover:text-green-200 transition-colors duration-200"
                aria-current="page" // アクセシビリティ: 現在のページを示す
              >
                ホーム
              </Link>
              <Link 
                href="/medications/new" 
                className="hover:text-green-200 transition-colors duration-200"
              >
                新しい処方記録
              </Link>
              <Link 
                href="/history" 
                className="hover:text-green-200 transition-colors duration-200"
              >
                履歴
              </Link>
            </div>

            {/* 
              📱 [モバイル用] スマートフォン表示用のハンバーガーメニューボタン
              今回は簡単な実装にしますが、本格的なアプリでは開閉機能が必要
            */}
            {/* ハンバーガーボタン */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)} // クリックで反転
              className="p-2 rounded-md text-gray-700 hover:bg-gray-200 focus:outline-none"
            >
              {/* アイコン（SVG） */}
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  // 開いている時は「×」アイコン
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  // 閉じている時は「三」アイコン
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </nav>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-[#cee6c1]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block text-gray-700 hover:bg-gray-200 rounded-md px-2 py-1"
              aria-current="page"
            >
              ホーム
            </Link>
            <Link
              href="/medications/new"
              className="block text-gray-700 hover:bg-gray-200 rounded-md px-2 py-1"
            >
              新しい処方記録
            </Link>
            <Link
              href="/history"
              className="block text-gray-700 hover:bg-gray-200 rounded-md px-2 py-1"
            >
              履歴
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/**
 * 🎓 [学習ポイント] このコンポーネントで使用した重要な概念
 * 
 * 1. **JSX記法** - HTMLのような見た目でReactコンポーネントを記述
 * 2. **TailwindCSS** - ユーティリティファーストのCSSフレームワーク
 * 3. **アクセシビリティ** - role, aria-*属性でスクリーンリーダー対応
 * 4. **レスポンシブデザイン** - hidden md:flex などのブレークポイント
 * 5. **コンポーネント化** - 再利用可能な独立したUIパーツ
 * 
 * 🧠 [宿題] 
 * - TailwindCSSの 'container', 'mx-auto', 'flex' がそれぞれ何をしているか調べてみてください
 * - このヘッダーをさらに改善するとしたら、どんな機能を追加しますか？
 */
