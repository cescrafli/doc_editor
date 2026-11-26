import { NextRequest, NextResponse } from 'next/server';
import {
  removeDocumentShare,
  shareDocumentWithUser,
} from '@/lib/services/document.service';
import { getActingUserId, handleApiError } from '@/lib/api/http';
import type { ShareRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actingUserId = getActingUserId(req);
    const body = await req.json();
    const email = String(body.email || '');
    const role = (body.role || 'editor') as ShareRole;

    const document = await shareDocumentWithUser(
      params.id,
      actingUserId,
      email,
      role
    );
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
    const actingUserId = getActingUserId(req);
    const targetUserId = req.nextUrl.searchParams.get('userId') || '';
    const document = await removeDocumentShare(
      params.id,
      actingUserId,
      targetUserId
    );
    return NextResponse.json({ document });
  } catch (err) {
    return handleApiError(err);
  }
}
