import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db';
import { getDocumentWithAccess } from '@/lib/document-service';
import { getActingUserId, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const userId = getActingUserId(req);
    await getDocumentWithAccess(params.id, userId);

    const db = await ensureDbReady();
    const res = await db.execute({
      sql: `SELECT file_name, raw_base64 FROM document_attachments WHERE id = ? AND document_id = ?`,
      args: [params.attachmentId, params.id],
    });

    const row = res.rows[0];
    if (!row) {
      return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
    }

    const buffer = Buffer.from(String(row.raw_base64), 'base64');
    const fileName = String(row.file_name);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
