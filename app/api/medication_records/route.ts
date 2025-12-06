import { NextRequest, NextResponse } from 'next/server';
import { medicationRecordService } from '../../../lib/database';

// GET /api/medication_records - ユーザーの処方記録を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');// searchParams.get('userId'): ?userId=123 の 123 を取得。存在しない場合は null。

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });// もしuserIdが取得できなければ、NextResponseとしてJSON形式でUser ID is requiredとstatus: 400を返す。400はクライアント側のリクエストエラーを示すHTTPステータスコード。
    }

    const records = await medicationRecordService.getUserMedicationRecords(userId);
    return NextResponse.json(records);
  } catch (error) {
    console.error('GET /api/medication_records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });// / 500はサーバー側のエラーを示すHTTPステータスコード。
  }
}

// POST /api/medication_records - 新しい処方記録を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, medicationId, ...formData } = body;

    if (!userId || !medicationId) {
      return NextResponse.json({ error: 'User ID and Medication ID are required' }, { status: 400 });
    }

    const record = await medicationRecordService.createMedicationRecord(userId, {
      ...formData,
      medication_id: medicationId,
    });

    return NextResponse.json(record, { status: 201 });// 201 = 作成成功を示すHTTPステータスコード
  } catch (error) {
    console.error('POST /api/medication_records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/medication_records/[id] - 処方記録を更新
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    const updatedRecord = await medicationRecordService.updateMedicationRecord(id, body);
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('PUT /api/medication_records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/medication_records/[id] - 処方記録を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    await medicationRecordService.deleteMedicationRecord(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/medication_records error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}