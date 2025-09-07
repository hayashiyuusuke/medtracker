"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MedicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

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
      alert('更新に失敗しました: ' + error.message);
    } else {
      router.refresh();
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('本当にこの処方記録を削除しますか？')) return;
    const { error } = await supabase.from('medication_records').delete().eq('id', id);
    if (error) {
      alert('削除に失敗しました: ' + error.message);
    } else {
      router.push('/medications');
    }
  };

  if (loading) return <div className="p-8">読み込み中...</div>;
  if (!record) return <div className="p-8">レコードが見つかりませんでした。</div>;

  return (
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
            <div className="mb-4">用法: {record.usage || '-'}</div>
            <div className="mb-4">用量: {record.dosage || '-'}</div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-sky-600 text-white rounded">編集</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">削除</button>
              <button onClick={() => router.push('/medications')} className="px-4 py-2 border rounded">一覧へ戻る</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
