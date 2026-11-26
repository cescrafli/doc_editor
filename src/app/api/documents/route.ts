import { NextRequest, NextResponse } from 'next/server';
import { createDocument, listAccessibleDocuments } from '@/lib/services/document.service';
import { getActingUserId, handleApiError } from '@/lib/api/http';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getActingUserId(req);
    const documents = await listAccessibleDocuments(userId);
    return NextResponse.json({ documents });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getActingUserId(req);
    const body = await req.json().catch(() => ({}));
    const document = await createDocument(userId, {
      title: body.title,
      content: body.content,
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
