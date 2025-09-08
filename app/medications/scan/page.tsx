"use client";
import React, { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const ENABLE_QR = process.env.NEXT_PUBLIC_ENABLE_QR_SCANNER === "true";

const parsedSchema = z.object({
  name: z.string().min(1),
  usage: z.string().optional(),
  dosage: z.string().optional(),
  prescribedAt: z.string().optional(),
  doctor: z.string().optional(),
  hospital: z.string().optional(),
  pharmacy: z.string().optional(),
});

// スタブのパーサ: 実際はJAHIS仕様に合わせて実装する
function stubParse(qrText: string) {
  // simple fake parse: try split by | and map
  const parts = qrText.split("|");
  const name = parts[0] || "";
  return {
    name,
    usage: parts[1] || "",
    dosage: parts[2] || "",
    prescribedAt: parts[3] || "",
    doctor: parts[4] || "",
    hospital: parts[5] || "",
    pharmacy: parts[6] || "",
  };
}

export default function ScanPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<null | z.infer<typeof parsedSchema>>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!ENABLE_QR) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-bold mb-4">QR スキャン機能は無効になっています</h1>
          <p className="mb-4">開発中のためデフォルトでは無効です。利用するには環境変数 <code>NEXT_PUBLIC_ENABLE_QR_SCANNER=true</code> を設定してください。</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => router.push('/medications/new')} className="px-4 py-2 bg-sky-600 text-white rounded">手動で登録する</button>
          </div>
        </div>
      </div>
    );
  }

  const handleParse = () => {
    setMessage("");
    try {
      const data = stubParse(raw.trim());
      const result = parsedSchema.safeParse(data);
      if (!result.success) {
        setMessage(result.error.issues.map(i => i.message).join(', '));
        setParsed(null);
        return;
      }
      setParsed(result.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg || "パースに失敗しました");
      setParsed(null);
    }
  };

  const handleSave = async () => {
    if (!parsed) return;
    setSubmitting(true);
    // auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('サインインが必要です');
      setSubmitting(false);
      router.push('/auth');
      return;
    }

    try {
      // medications マスタ登録（存在確認）
      const { data: existing } = await supabase.from('medications').select('id').eq('name', parsed.name).single();
      let medId = existing?.id ?? null;
      if (!medId) {
        const { data: newMed, error: medErr } = await supabase.from('medications').insert({ name: parsed.name }).select('id').single();
        if (medErr) throw medErr;
        medId = newMed.id;
      }

      const { error: recErr } = await supabase.from('medication_records').insert([{
        user_id: user.id,
        medication_id: medId,
        dosage: parsed.dosage ?? null,
        usage: parsed.usage ?? null,
        prescribed_at: parsed.prescribedAt ?? null,
        doctor: parsed.doctor ?? null,
        hospital: parsed.hospital ?? null,
        pharmacy: parsed.pharmacy ?? null,
      }]);
      if (recErr) throw recErr;
      setMessage('保存しました');
      setParsed(null);
      setRaw('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage(msg || '保存に失敗しました');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-start justify-center">
      <div className="w-full max-w-2xl bg-white p-6 rounded shadow">
        
        <h1 className="text-xl font-bold mb-4">QR スキャン（簡易）</h1>
        <p className="text-sm text-gray-600 mb-4">カメラ読み取りは未実装のため、QR の生データを貼り付けてください（開発用）。JAHIS 仕様に合わせたパーサは今後実装します。</p>

        <textarea value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="QR 生データを貼り付け" className="w-full p-2 border rounded h-36 mb-3" />
        <div className="flex gap-2 mb-4">
          <button onClick={handleParse} className="px-4 py-2 bg-sky-600 text-white rounded">パース</button>
          <button onClick={() => { setRaw(''); setParsed(null); setMessage(''); }} className="px-4 py-2 border rounded">クリア</button>
        </div>

        {message && <div className="mb-4 text-sm text-red-500">{message}</div>}

        {parsed && (
          <div className="mb-4 p-4 border rounded bg-gray-50">
            <h2 className="font-semibold mb-2">プレビュー</h2>
            <div className="text-sm text-gray-700 space-y-1">
              <div>薬剤名: {parsed.name}</div>
              <div>用法: {parsed.usage || '-'}</div>
              <div>用量: {parsed.dosage || '-'}</div>
              <div>処方日: {parsed.prescribedAt || '-'}</div>
              <div>医師: {parsed.doctor || '-'}</div>
              <div>医療機関: {parsed.hospital || '-'}</div>
              <div>薬局: {parsed.pharmacy || '-'}</div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={handleSave} disabled={submitting} className={`px-4 py-2 rounded text-white ${submitting ? 'bg-sky-400' : 'bg-sky-600 hover:bg-sky-700'}`}>
                {submitting ? '保存中...' : '保存'}
              </button>
              <button onClick={() => setParsed(null)} className="px-4 py-2 border rounded">編集に戻る</button>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">カメラ読み取りを実装する場合は、<code>react-qr-reader</code> などを導入してデバイスのカメラを利用してください。</div>
      </div>
    </div>
  );
}
