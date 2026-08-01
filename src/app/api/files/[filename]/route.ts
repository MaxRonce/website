import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

/**
 * Serves files uploaded through /admin at request time. Needed because
 * `next start` only serves public/ assets that existed at build time — this
 * route reads public/uploads/ from disk on every request, so uploads work
 * immediately on local and VPS hosting without a rebuild.
 */
export async function GET(
  _request: Request,
  { params }: { params: { filename: string } },
) {
  const { filename } = params;
  if (!/^[a-z0-9][a-z0-9\-_.]*$/i.test(filename) || filename.includes('..')) {
    return NextResponse.json({ error: 'Nom de fichier invalide.' }, { status: 400 });
  }
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return NextResponse.json({ error: 'Type de fichier non servi.' }, { status: 404 });
  }

  try {
    const buffer = await fs.readFile(path.join(process.cwd(), 'public', 'uploads', filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
  }
}
