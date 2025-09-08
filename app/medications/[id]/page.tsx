"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "@/components/Toast";
import { formatUsage, formatDosage } from '@/lib/medFormat';

export default function MedicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  type MedicationRecord = {
    id: string;
    dosage?: string | null;
    usage?: string | null;
    prescribed_at?: string | null;
    doctor?: string | null;
    hospital?: string | null;
    pharmacy?: string | null;
    medications?: { name?: string | null } | null;
  };

  type FormState = { dosage: string; usage: string };

  const [record, setRecord] = useState<MedicationRecord | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({ dosage: "", usage: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' | 'error' } | null>(null);
  const [taking, setTaking] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('medication_records')
        .select(`*, medications(name)`)
        .eq('id', id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setRecord(data);
        setForm({ dosage: data.dosage || '', usage: data.usage || '' });
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from('medication_records')
      .update({ dosage: form.dosage, usage: form.usage })
      .eq('id', id);
    if (error) {
      setToast({ message: '更新に失敗しました: ' + error.message, type: 'error' });
    } else {
      setToast({ message: '更新しました', type: 'success' });
      router.refresh();
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    // open modal
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    setModalOpen(false);
    const { error } = await supabase.from('medication_records').delete().eq('id', id);
    if (error) {
      setToast({ message: '削除に失敗しました: ' + error.message, type: 'error' });
    } else {
      setToast({ message: '削除しました', type: 'success' });
      router.push('/medications');
    }
  };

  const handleMarkTaken = async () => {
    if (!record) return;
    setTaking(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setToast({ message: 'サインインが必要です', type: 'error' });
      router.push('/auth');
      setTaking(false);
      return;
    }

    const { error } = await supabase.from('dose_history').insert([{
      user_id: user.id,
      medication_record_id: record.id,
      taken_at: new Date().toISOString(),
      note: null,
    }]);

    if (error) {
      setToast({ message: '記録に失敗しました: ' + error.message, type: 'error' });
    } else {
      setToast({ message: '服用を記録しました', type: 'success' });
    }
    setTaking(false);
  };

  if (loading) return <div className="p-8">読み込み中...</div>;
  if (!record) return <div className="p-8">レコードが見つかりませんでした。</div>;

  return (
    <>
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">{record.medications?.name || '(名前なし)'} の詳細</h1>
        <div className="mb-4 text-sm text-gray-700">
          <div>処方日: {record.prescribed_at || '-'}</div>
          <div>医師: {record.doctor || '-'}</div>
          <div>医療機関: {record.hospital || '-'}</div>
          <div>薬局: {record.pharmacy || '-'}</div>
        </div>

  {editing ? (
          <div className="space-y-3">
            <label className="block text-sm">用法</label>
            <input name="usage" value={form.usage} onChange={handleChange} className="w-full p-2 border rounded" />
            <label className="block text-sm">用量</label>
            <input name="dosage" value={form.dosage} onChange={handleChange} className="w-full p-2 border rounded" />
            <div className="flex gap-2 mt-3">
              <button onClick={handleSave} className="px-4 py-2 bg-sky-600 text-white rounded">保存</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 border rounded">キャンセル</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">用法: {formatUsage(record.usage)}</div>
            <div className="mb-4">用量: {formatDosage(record.dosage)}</div>
            <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="px-4 py-2 bg-sky-600 text-white rounded">編集</button>
                <button onClick={handleMarkTaken} disabled={taking} className={`px-4 py-2 ${taking ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded`}>{taking ? '記録中...' : '服用を記録'}</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">削除</button>
                <button onClick={() => router.push('/medications')} className="px-4 py-2 border rounded">一覧へ戻る</button>
            </div>
          </div>
        )}
  </div>
    </div>
    <ConfirmModal open={modalOpen} title="削除の確認" message="この処方記録を削除しますか？" onConfirm={confirmDelete} onCancel={() => setModalOpen(false)} />
    {toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null}
    </>
  );
}
