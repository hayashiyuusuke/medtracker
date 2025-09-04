"use client"; // ページをクライアントコンポーネントにするため
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // 作成したクライアントをインポート

import Image from "next/image";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "確認メールを送信しました");
  };

  const supabaseTest = async () => {
    const { data, error } = await supabase.from('test_table').select('*');
    if (error && error.code !== '42P01') { // 42P01は「テーブルが存在しない」エラーなので無視
      console.error('Supabase Error:', error);
    } else {
      console.log('Supabase Connection Success:', data);
    }
  };
  supabaseTest();
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-sky-500 bg-sky-100 p-4 rounded-lg">
          電子お薬手帳 MedTracker
        </h1>
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
          <h2 className="text-xl font-bold mb-4">新規登録</h2>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input input-bordered w-full mb-2"
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input input-bordered w-full mb-2"
          />
          <button onClick={handleSignUp} className="btn btn-primary w-full">登録</button>
          {message && <p className="mt-2 text-red-500">{message}</p>}
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden="true"
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
