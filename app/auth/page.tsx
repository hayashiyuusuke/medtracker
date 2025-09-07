"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  // trueなら新規登録フォーム、falseならログインフォームを表示するための状態
  const [isSignUp, setIsSignUp] = useState(true);

  // 新規登録
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("確認メールを送信しました。メールをご確認ください。");
    }
  };

  // ログイン
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(error.message);
    } else {
      // ログイン成功後はホームページなどに遷移させるのが一般的
      router.push('/');
      // window.location.href = '/'; // 例：ホームページへリダイレクト
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

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-900 text-white">
      <main className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-sky-400">
            電子お薬手帳 MedTracker
          </h1>
        </div>
        <div className="p-8 bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isSignUp ? "新規登録" : "ログイン"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="input input-bordered w-full bg-gray-700 border-gray-600"
            />
            <input
              type="password"
              placeholder="パスワード (6文字以上)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input input-bordered w-full bg-gray-700 border-gray-600"
            />
            <button type="submit" className="btn btn-primary w-full">
              {isSignUp ? "登録する" : "ログインする"}
            </button>
            {message && (
              <p className="mt-2 text-center text-red-500">{message}</p>
            )}
          </form>
          <div className="text-center mt-4">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-sky-400 hover:underline"
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