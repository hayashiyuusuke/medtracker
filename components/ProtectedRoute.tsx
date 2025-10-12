'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}
/*
 * interface でchildrenを定義する理由
 * - 型で意図を明確化するため
 * - ProtectedRouteProps　という名前をつけることで、コンポーネントのAPIを明確にするため
 */

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);
/* 
 * !loading （ローディング中じゃない時）かつ !user（未ログイン）の時にリダイレクトを行う
 *
 * useEffectの依存配列にuser, loading, routerを含める理由
 * - user: 認証状態が変わったときにリダイレクトを行うため
 * - loading: 読み込み中はリダイレクトを行わないため
 * - router: ページが変わったときにリダイレクトを行うため
 */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
