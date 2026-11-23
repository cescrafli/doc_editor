import { NextRequest, NextResponse } from 'next/server';
import { parseFileToHtml, FileValidationError } from '@/lib/file-parser';
import { createDocument } from '@/lib/document-service';
import { getActingUserId, handleApiError } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const actingUserId = getActingUserId(req);
    const formData = await req.formData();
    const file = formData.get('file');
    const shouldCreateDoc = formData.get('createDocument') === 'true';

    if (!file || !(file instanceof File)) {
      throw new FileValidationError('No file provided in upload request.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await parseFileToHtml(file.name, file.size, buffer);

    if (shouldCreateDoc) {
      const document = await createDocument(actingUserId, {
        title: parsed.suggestedTitle,
        content: parsed.htmlContent,
      });
      return NextResponse.json({ parsed, document }, { status: 201 });
    }

    return NextResponse.json({ parsed });
  } catch (err) {
    return handleApiError(err);
  }
}
