import { NextRequest, NextResponse } from 'next/server';
import {
  addDocumentAttachment,
  deleteDocumentAttachment,
} from '@/lib/document-service';
import { validateAndExtractAttachment, FileValidationError } from '@/lib/file-parser';
import { getActingUserId, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actingUserId = getActingUserId(req);
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      throw new FileValidationError('Please select a file to upload.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { ext, extractedHtml } = await validateAndExtractAttachment(
      file.name,
      file.size,
      buffer
    );

    const document = await addDocumentAttachment(params.id, actingUserId, {
      fileName: file.name,
      fileType: ext,
      fileSize: file.size,
      rawBase64: buffer.toString('base64'),
      extractedHtml,
    });

    return NextResponse.json({ document }, { status: 201 });
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
    const attachmentId = req.nextUrl.searchParams.get('attachmentId') || '';
    const document = await deleteDocumentAttachment(
      params.id,
      actingUserId,
      attachmentId
    );
    return NextResponse.json({ document });
  } catch (err) {
    return handleApiError(err);
  }
}
