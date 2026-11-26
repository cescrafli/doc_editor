import { NextRequest, NextResponse } from 'next/server';
import { getAttachmentBinary } from '@/lib/services/document.service';
import { getActingUserId, handleApiError } from '@/lib/api/http';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attachmentId: string } }
) {
  try {
    const userId = getActingUserId(req);
    const { fileName, buffer } = await getAttachmentBinary(
      params.id,
      userId,
      params.attachmentId
    );

    return new NextResponse(new Uint8Array(buffer), {
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
