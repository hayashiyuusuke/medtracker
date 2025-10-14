'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 画面下部に固定表示されるボトムナビゲーションバー
 * 全ページで共通して表示され、主要機能への導線を提供
 */
export default function BottomNav() {
  const pathname = usePathname();

  // 現在のパスに基づいてアクティブなリンクを判定
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-t-lg border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 px-4">
        {/* 処方一覧リンク */}
        <Link
          href="/medications"
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors text-black hover:bg-[#66904f] active:scale-95`}
        >
          {/* 処方箋アイコン */}
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs font-medium">処方一覧</span>
        </Link>

        {/* 処方登録リンク（メイン機能として強調） */}
        <Link
          href="/medications/new"
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors text-black hover:bg-[#66904f] active:scale-95`}
        >
          {/* 追加アイコン */}
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-xs font-medium">処方登録</span>
        </Link>

        {/* 服用履歴リンク */}
        <Link
          href="/history"
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors text-black hover:bg-[#66904f] active:scale-95`}
        >
          {/* 履歴アイコン */}
          <svg
            className="w-6 h-6 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-medium">服用履歴</span>
        </Link>
      </div>
    </nav>
  );
}
