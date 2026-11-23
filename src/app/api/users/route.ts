import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUserByEmail, listUsers } from '@/lib/document-service';
import { handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await findOrCreateUserByEmail(body.email || '', body.name);
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
