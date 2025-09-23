/**
 * 🏥 MedTracker ヘッダーコンポーネント
 * 
 * 【このコンポーネントの目的】
 * - アプリケーション全体で共通して表示される上部ナビゲーション
 * - ユーザーにアプリ名とメインナビゲーションを提供
 * - すべてのページで一貫したブランディングを維持
 */

import React from 'react';

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

  return (
    <header 
      className="bg-green-600 text-white shadow-lg"
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
            <h1 className="text-xl font-bold">
              <span className="text-2xl mr-2" role="img" aria-label="薬のアイコン">
                💊
              </span>
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
              <a 
                href="/" 
                className="hover:text-green-200 transition-colors duration-200"
                aria-current="page" // アクセシビリティ: 現在のページを示す
              >
                ホーム
              </a>
              <a 
                href="/medications/new" 
                className="hover:text-green-200 transition-colors duration-200"
              >
                新しい処方記録
              </a>
              <a 
                href="/history" 
                className="hover:text-green-200 transition-colors duration-200"
              >
                履歴
              </a>
            </div>

            {/* 
              📱 [モバイル用] スマートフォン表示用のハンバーガーメニューボタン
              今回は簡単な実装にしますが、本格的なアプリでは開閉機能が必要
            */}
            <button 
              className="md:hidden p-2 rounded-md hover:bg-green-700 transition-colors"
              aria-label="メニューを開く"
              aria-expanded="false" // アクセシビリティ: メニューの開閉状態
            >
              <span className="text-xl">☰</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 
        🧠 [問い] なぜ上記のconsole.logを削除する必要があったのでしょうか？
        JSX内でのJavaScript実行とReactNodeの違いについて考えてみてください。
      */}
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
