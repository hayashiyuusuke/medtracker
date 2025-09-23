"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function AuthPage() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // trueなら新規登録フォーム、falseならログインフォームを表示するための状態
  const [isSignUp, setIsSignUp] = useState(false);

  // 既にログインしている場合はホームページへリダイレクト
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // 新規登録
  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await signUp(email, password);
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("確認メールを送信しました。メールをご確認ください。");
      }
    } catch (err) {
      setMessage("新規登録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // ログイン
  const handleLogin = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        setMessage(error.message);
      } else {
        router.push('/');
      }
    } catch (err) {
      setMessage("ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // フォーム送信時の処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // ページの再読み込みを防ぐ
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  // ログイン済みの場合は何も表示しない
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 text-white">
      <main className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            電子お薬手帳 MedTracker
          </h1>
        </div>
        <div className="p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
            {isSignUp ? "新規登録" : "ログイン"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <input
              type="password"
              placeholder="パスワード (6文字以上)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSignUp ? "登録中..." : "ログイン中..."}
                </div>
              ) : (
                isSignUp ? "登録する" : "ログインする"
              )}
            </button>
            {message && (
              <p className="mt-2 text-center text-red-500">{message}</p>
            )}
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isSignUp
                ? "すでにアカウントをお持ちですか？ ログイン"
                : "アカウントをお持ちでないですか？ 新規登録"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}