"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { z } from "zod";
import { useRouter } from "next/navigation";

const schema = z.object({
  name: z.string().min(1, "薬剤名は必須です"),
  usage: z.string(),
  dosage: z.string(),
  prescribedAt: z.string(),
  doctor: z.string(),
  hospital: z.string(),
  pharmacy: z.string(),
});

export default function MedicationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  type FormShape = {
    name: string;
    usage: string;
    dosage: string;
    prescribedAt: string;
    doctor: string;
    hospital: string;
    pharmacy: string;
  };

  const [form, setForm] = useState<FormShape>({
    name: "", usage: "", dosage: "", prescribedAt: "",
    doctor: "", hospital: "", pharmacy: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
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
    if (submitting) return;
    setSubmitting(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      setMessage("セッションが無効です。再度ログインしてください。");
      router.push('/auth');
      setSubmitting(false);
      return;
    }

    const result = schema.safeParse(form);
    if (!result.success) {
      setMessage(result.error.issues.map(issue => issue.message).join(", "));
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
        setSubmitting(false);
        return;
      }
      medicationId = newMed?.id;
    }

    if (!medicationId) {
      setMessage("薬剤IDの取得に失敗しました。");
      setSubmitting(false);
      return;
    }

    const { error: recError } = await supabase
      .from("medication_records")
      .insert([{
        user_id: currentUser.id,
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
      setSubmitting(false);
    } else {
      setMessage("登録しました");
      setForm({ name: "", usage: "", dosage: "", prescribedAt: "", doctor: "", hospital: "", pharmacy: "" });
      setTimeout(() => router.push('/'), 800);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  return (
    <div className="flex justify-center items-start py-12 bg-gray-100 min-h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">お薬情報登録</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">薬剤名</label>
            <input id="name" name="name" aria-label="薬剤名" placeholder="例: アセトアミノフェン" value={form.name} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="prescribedAt">処方日</label>
            <input id="prescribedAt" name="prescribedAt" type="date" aria-label="処方日" value={form.prescribedAt} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="usage">用法</label>
            <input id="usage" name="usage" placeholder="例: 朝食後" value={form.usage} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="dosage">用量</label>
            <input id="dosage" name="dosage" placeholder="例: 10mg" value={form.dosage} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="doctor">処方医師</label>
            <input id="doctor" name="doctor" placeholder="医師名（任意）" value={form.doctor} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="hospital">医療機関</label>
            <input id="hospital" name="hospital" placeholder="医療機関名（任意）" value={form.hospital} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" htmlFor="pharmacy">薬局</label>
            <input id="pharmacy" name="pharmacy" placeholder="薬局名（任意）" value={form.pharmacy} onChange={handleChange} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-sky-400" />
          </div>
        </div>

        <div className="mt-6">
          <button type="submit" disabled={submitting} className={`w-full py-2 rounded text-white ${submitting ? 'opacity-50 cursor-not-allowed bg-sky-400' : 'bg-sky-600 hover:bg-sky-700'}`}>
            {submitting ? '登録中...' : '登録'}
          </button>
          {message && (
            <p className={`mt-4 text-center ${message.startsWith('登録しました') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>
          )}
        </div>
      </form>
    </div>
  );
}
