// app/medications/new/page.tsx

"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { z } from "zod";
import { useRouter } from "next/navigation";

// Zodスキーマ定義
const schema = z.object({
  name: z.string().min(1, "薬剤名は必須です"),
  usage: z.string(),
  dosage: z.string(),
  prescribedAt: z.string(),
  doctor: z.string(),
  hospital: z.string(),
  pharmacy: z.string(),
});

export default function NewMedicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    name: "", usage: "", dosage: "", prescribedAt: "",
    doctor: "", hospital: "", pharmacy: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [messageType, setMessageType] = useState<"" | "error" | "success">("");

  // ページ読み込み時にログイン状態を確認する保護機能
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      } else {
        router.push('/auth');
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return; // 二重送信防止
    setSubmitting(true);

    // ★★★ 最終手段：フォーム送信時にもセッションを再確認する ★★★
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setMessage("セッションが無効です。再度ログインしてください。");
      setMessageType("error");
      router.push('/auth'); // ログインページに飛ばす
      setSubmitting(false);
      return;
    }
    // ★★★ ここまでが追加された二重チェック ★★★
    
    const result = schema.safeParse(form);
    if (!result.success) {
      setMessage(result.error.issues.map(issue => issue.message).join(", "));
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    let medicationId = null;
    const { data: existingMed } = await supabase
      .from("medications")
      .select("id")
      .eq("name", form.name)
      .single();

    if (existingMed) {
      medicationId = existingMed.id;
    } else {
      const { data: newMed, error: medError } = await supabase
        .from("medications")
        .insert({ name: form.name })
        .select("id")
        .single();
      
      if (medError) {
        setMessage(`薬剤マスタ登録エラー: ${medError.message}`);
        setMessageType("error");
        setSubmitting(false);
        return;
      }
      medicationId = newMed?.id;
    }

    if (!medicationId) {
      setMessage("薬剤IDの取得に失敗しました。");
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    const { error: recError } = await supabase
      .from("medication_records")
      .insert([{
        user_id: currentUser.id, // 再取得した、最も信頼できるユーザーIDを使用
        medication_id: medicationId,
        dosage: form.dosage,
        usage: form.usage,
        prescribed_at: form.prescribedAt,
        doctor: form.doctor,
        hospital: form.hospital,
        pharmacy: form.pharmacy,
      }]);

    if (recError) {
      setMessage(`処方記録登録エラー: ${recError.message}`);
      setMessageType("error");
      setSubmitting(false);
      return;
    }

    // 成功
    setMessage("登録しました");
    setMessageType("success");
    setForm({
      name: "", usage: "", dosage: "", prescribedAt: "",
      doctor: "", hospital: "", pharmacy: "",
    });
    // 登録成功後、一覧またはトップにリダイレクト
    setTimeout(() => router.push('/'), 800);
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">お薬情報登録</h2>
            <input name="name" placeholder="薬剤名" value={form.name} onChange={handleChange} className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input name="usage" placeholder="用法" value={form.usage} onChange={handleChange} className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input name="dosage" placeholder="用量" value={form.dosage} onChange={handleChange} className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input name="prescribedAt" type="date" placeholder="処方日" value={form.prescribedAt} onChange={handleChange} className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input name="doctor" placeholder="処方医師" value={form.doctor} onChange={handleChange} className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input name="hospital" placeholder="医療機関" value={form.hospital} onChange={handleChange} className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <input name="pharmacy" placeholder="薬局" value={form.pharmacy} onChange={handleChange} className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
            <button type="submit" disabled={submitting} className={`w-full py-2 rounded text-white ${submitting ? 'opacity-50 cursor-not-allowed bg-sky-400' : 'bg-sky-600 hover:bg-sky-700'}`}>
              {submitting ? '登録中...' : '登録'}
            </button>
            {message && (
              <p className={`mt-4 text-center ${messageType === 'success' ? 'text-green-600' : messageType === 'error' ? 'text-red-500' : 'text-gray-700'}`}>
                {message}
              </p>
            )}
        </form>
    </div>
  );
}