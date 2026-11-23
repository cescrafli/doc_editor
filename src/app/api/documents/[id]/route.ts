import { NextRequest, NextResponse } from 'next/server';
import {
  deleteDocument,
  getDocumentWithAccess,
  updateDocument,
} from '@/lib/document-service';
import { getActingUserId, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getActingUserId(req);
    const document = await getDocumentWithAccess(params.id, userId);
    return NextResponse.json({ document });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getActingUserId(req);
    const body = await req.json();
    const document = await updateDocument(params.id, userId, {
      title: body.title,
      content: body.content,
    });
    return NextResponse.json({ document });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getActingUserId(req);
    await deleteDocument(params.id, userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
