'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /* boolean はtrueかfalseのいずれかという意味 */
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  /* promise は非同期処理の結果を返すオブジェクトを表す型。後に出てくるawaitと合わせて使う */
  signOut: () => Promise<void>;
  /* void は何も返さないことを示す型 */
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
/* createContextは、Reactのコンテキストを作成するための関数です。(context APIと同義) */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    getSession();
    /* getSession について 👉 ローカル関数 getSession の中で Supabase の getSession メソッドを呼んでいる” という二段構造。
     * supabase.auth.getSession()とは supabaseライブラリのauthモジュールにあるgetSessionメソッドを呼び出している。
     * getSessionメソッドは、現在の認証セッションを取得するための非同期関数。
     * async関数とは、非同期処理を行うための関数で、Promiseを返すことが特徴。 
     * session は、ユーザーの認証情報を含むオブジェクト。分割代入を使って変数 session を定義・取得している。
     * ?. は「オプショナルチェーン演算子」と呼ばれ、sessionがnullまたはundefinedの場合にundefinedを返し、エラーを防ぐために使用される。
     * ?? は「Null合体演算子」と呼ばれ、左側の値がnullまたはundefinedの場合に右側の値を返すために使用される。
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    /* onAuthStateChange について 👉 認証状態が変化したときに呼び出されるコールバック関数を登録している。
     * event は認証イベントの種類を示す文字列で、"SIGNED_IN" や "SIGNED_OUT" などがある。
     * session は、ユーザーの認証情報を含むオブジェクトで、ユーザーがサインインしている場合はその情報が含まれる。
     *
     * つまり、getSessionは最初に「今ログインしているか」を一度だけ確認するための関数。
     * onAuthStateChangeは、それ以降ずっと認証状態が変化がないかを監視し、変化したときに呼び出されるコールバック関数を登録するためのメソッド。
     */
    return () => subscription.unsubscribe();
  }, []);
  /* クリーンアップ関数について 👉 コンポーネントがアンマウントされるときに呼び出される関数。
   * useEffectの中で副作用を設定した場合、その副作用をクリーンアップするために使用される。
   * ここでは、onAuthStateChangeで登録した監視を解除するために使用されている。
   * これにより、コンポーネントがアンマウントされた後も監視が続くことを防ぎ、メモリリークを防止する。
   */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data?.user ?? null, error };
  };
  /* 
   * signIn について 👉 signIn は「async関数そのもの」を値として持つ変数。
   * 分割代入の分解 👇 (const { data, error } = ... )
   * const result = await supabase.auth.signInWithPassword(...);
   * const data = result.data;
   * const error = result.error;
   * SupabaseのsignInWithPasswordメソッドを使用して、メール＋パスワードを Supabase サーバーに送信し、認証を行う。
   * Supabaseに通信する時間がかかるため await で結果が返るまで待つ。（非同期処理）
   * 成功した場合は、ユーザー情報を含むオブジェクトを返し、失敗した場合はエラー情報を返す。
   * data?.user ?? null について 👇 
   * ①dataがnullまたはundefinedの場合にnullを返す。
   * ②dataが存在する場合は、そのuserプロパティを返す。
   * ③data.userがnullまたはundefinedの場合にnullを返す。
   * ④data.userが存在する場合は、その値を返す。
   */

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { user: data?.user ?? null, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
  /* value={配りたいもの} */
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
/* contextにはuser, loading, signIn, signUp, signOutが含まれる */