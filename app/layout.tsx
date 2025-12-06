/*
 * 【このファイルの重要な役割】
 * - アプリケーション全体の骨組みを定義
 * - 全ページで共通する要素（フォント、メタデータ、プロバイダー）を設定
 * - HTMLの基本構造を提供
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header'; 
import NotificationManager from '../components/NotificationManager';

/*
 * Geistフォントの設定
 * 
 * 🧠 [問い] なぜ変数名を 'geistSans' にするのでしょうか？　→ フォントの種類を明示するため
 * また、なぜ 'subsets: ["latin"]' を指定するのでしょうか？→ ラテン文字に対応させるため
 */
const geistSans = Geist({
  variable: "--font-geist-sans", // CSS変数として定義
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", // 等幅フォント用
  subsets: ["latin"],
});

/*
 * アプリケーションのメタデータ設定
 * 
 * 🧠 [問い] このmetadataオブジェクトはどこで使用されるのでしょうか？
 * SEO（Search Engine Optimization：検索エンジン最適化）やソーシャルメディアシェアにどう影響するか考えてみてください。
 * 
 * SEOとは、検索エンジンでWebサイトがより上位に表示されるように最適化することです。
 * metadataオブジェクトは、ページのタイトルや説明、キーワードなどを設定し、検索エンジンやSNSでの表示を改善します。
 */
export const metadata: Metadata = {
  title: "MedTracker - お薬手帳アプリ",
  description: "QRコードで簡単にお薬情報を管理できるデジタルお薬手帳アプリです。",
  keywords: ["お薬手帳", "薬", "QRコード", "健康管理"],
  authors: [{ name: "MedTracker Development Team" }],
};

/*
 * ルートレイアウトコンポーネント
 * 
 * @param children - 各ページのコンテンツが挿入される部分
 * @returns アプリケーション全体の基本レイアウト
 * 
 *　→ Next.js App Routerでは、以下のファイルは必ず default export する必要がある。
 * layout.tsx, page.tsx, loading.tsx, error.tsx
 * 理由は、Next.jsがこれらのファイルを特別に扱い、アプリケーションのルーティングとレンダリングを管理するためです。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('🏗️ [レンダリング] RootLayoutがレンダリングされています');

  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/* 
        🔍 [解説] htmlタグの設定
        - lang="ja": 日本語サイトであることを宣言（アクセシビリティ、SEO）
        - className: Geistフォントのcss変数をグローバルに適用
      */}
      <body className="antialiased min-h-screen bg-[#cee6c1] flex flex-col">
        {/* 
          🧠 [問い] 'antialiased' クラスは何をしているのでしょうか？　
          → 文字のアンチエイリアス処理を行い、滑らかに表示する。文字のアンチエイリアス処理とは、隣接するピクセルの色を調整して、文字のエッジを滑らかに見せる技術です。
          また、'min-h-screen flex flex-col' の組み合わせの効果は？　
          → 画面全体の高さを確保し、フレックスボックスで縦方向に要素を配置する。
        */}
        
        <AuthProvider>
          <NotificationManager />
          <Header />
          <main className="flex-1 container mx-auto px-4 py-8 bg-[#cee6c1]">
            {children}
          </main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}

/*
 * 🎓 [学習ポイント] このレイアウトファイルの重要な設計概念
 * 
 * 1. **レイアウトパターン** - Header + Main(flex-1) + Footer の3分割
 * 2. **プロバイダーパターン** - AuthProviderで全体をラップ
 * 3. **CSS Variables** - フォント設定をCSS変数で管理
 * 4. **Flexbox** - レスポンシブな高さ調整
 * 5. **コンポーネント分離** - Header, BottomNavを別ファイルで管理
 * 
 * 🧠 [次のステップ] 
 * - AuthProviderの内部実装
 * - TailwindCSSのコンテナーシステム
 */
