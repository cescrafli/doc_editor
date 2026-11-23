import { NextRequest, NextResponse } from 'next/server';
import { ServiceError } from './document-service';
import { FileValidationError } from './file-parser';

export function getActingUserId(req: NextRequest): string {
  const headerUser = req.headers.get('x-user-id')?.trim();
  const queryUser = req.nextUrl.searchParams.get('actingUserId')?.trim();
  return headerUser || queryUser || 'user-rafli';
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ServiceError || err instanceof FileValidationError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('Unhandled API Error:', err);
  const message = err instanceof Error ? err.message : 'An unexpected server error occurred.';
  return NextResponse.json({ error: message }, { status: 500 });
}
