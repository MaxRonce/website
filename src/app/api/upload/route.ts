import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

import { adminUnauthorizedMessage, passwordMatches } from '@/lib/adminAuth';
import { commitFileToGitHub, gitHubConfigured } from '@/lib/githubCommit';

export const dynamic = 'force-dynamic';

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'svg']);
const MAX_BYTES = 15 * 1024 * 1024;

function slugifyFilename(original: string): { base: string; extension: string } | null {
  const extension = original.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(extension)) return null;
  const base = original
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return { base: base || 'fichier', extension };
}

/**
 * File upload for the /admin editor (posters, slides, reports, CV…).
 * Body: JSON { name: string, data: base64 }. The file lands in
 * public/uploads/ (disk on local/VPS, GitHub commit on Vercel) and the
 * public path (/uploads/…) is returned so the editor can fill the link field.
 */
export async function POST(request: Request) {
  if (!passwordMatches(request.headers.get('x-admin-password'))) {
    return NextResponse.json({ error: adminUnauthorizedMessage() }, { status: 401 });
  }

  let body: { name?: unknown; data?: unknown };
  try {
    body = (await request.json()) as { name?: unknown; data?: unknown };
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }
  if (typeof body.name !== 'string' || typeof body.data !== 'string' || body.data.length === 0) {
    return NextResponse.json({ error: 'Fichier manquant.' }, { status: 400 });
  }

  const named = slugifyFilename(body.name);
  if (!named) {
    return NextResponse.json(
      { error: 'Type de fichier non autorisé (formats acceptés : PDF, PNG, JPG, WEBP, SVG).' },
      { status: 400 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(body.data, 'base64');
  } catch {
    return NextResponse.json({ error: 'Encodage du fichier invalide.' }, { status: 400 });
  }
  if (buffer.byteLength === 0) {
    return NextResponse.json({ error: 'Fichier vide.' }, { status: 400 });
  }
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Fichier trop volumineux (15 Mo maximum).' },
      { status: 413 },
    );
  }

  // Short content-derived suffix keeps names unique without ever colliding
  // with a different file of the same name.
  const stamp = buffer.byteLength.toString(36);
  const filename = `${named.base}-${stamp}.${named.extension}`;
  const publicPath = `/uploads/${filename}`;

  if (gitHubConfigured()) {
    try {
      await commitFileToGitHub(
        `public/uploads/${filename}`,
        buffer.toString('base64'),
        `content: upload ${filename} via /admin`,
      );
      return NextResponse.json({
        ok: true,
        path: publicPath,
        mode: 'github',
        message: `Fichier envoyé sur GitHub — en ligne dans 1 à 2 minutes (${publicPath}).`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erreur inconnue';
      return NextResponse.json({ error: `Envoi GitHub impossible (${message}).` }, { status: 500 });
    }
  }

  try {
    const directory = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), buffer);
    // Served through the API so it works without a rebuild (`next start`
    // only serves public/ assets present at build time).
    const servedPath = `/api/files/${filename}`;
    return NextResponse.json({
      ok: true,
      path: servedPath,
      mode: 'disk',
      message: `Fichier téléversé (${servedPath}).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erreur inconnue';
    return NextResponse.json({ error: `Écriture impossible (${message}).` }, { status: 500 });
  }
}
