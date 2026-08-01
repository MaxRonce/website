import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

import fallbackContent from '@/content/content.json';
import { adminUnauthorizedMessage, passwordMatches } from '@/lib/adminAuth';
import { commitFileToGitHub, gitHubConfigured } from '@/lib/githubCommit';

export const dynamic = 'force-dynamic';

const CONTENT_PATH = path.join(process.cwd(), 'src', 'content', 'content.json');
const GITHUB_FILE_PATH = 'src/content/content.json';

/** The content itself is public (it is rendered on the site), so GET is open. */
export async function GET() {
  try {
    const raw = await fs.readFile(CONTENT_PATH, 'utf8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(fallbackContent);
  }
}

export async function POST(request: Request) {
  if (!passwordMatches(request.headers.get('x-admin-password'))) {
    return NextResponse.json({ error: adminUnauthorizedMessage() }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  // Password verification ping from the /admin login screen — no write.
  if (typeof body === 'object' && body !== null && 'verify' in body) {
    return NextResponse.json({ ok: true });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('identity' in body) ||
    !('milestones' in body) ||
    !Array.isArray((body as { milestones: unknown }).milestones)
  ) {
    return NextResponse.json({ error: 'Structure de contenu invalide.' }, { status: 400 });
  }

  const serialized = `${JSON.stringify(body, null, 2)}\n`;

  // Preferred on Vercel: commit to GitHub → automatic redeploy.
  if (gitHubConfigured()) {
    try {
      await commitFileToGitHub(
        GITHUB_FILE_PATH,
        Buffer.from(serialized, 'utf8').toString('base64'),
        'content: update via /admin editor',
      );
      return NextResponse.json({
        ok: true,
        mode: 'github',
        message:
          'Enregistré sur GitHub — le site se met à jour automatiquement dans 1 à 2 minutes.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erreur inconnue';
      return NextResponse.json({ error: `Commit GitHub impossible (${message}).` }, { status: 500 });
    }
  }

  // Local development / VPS: write straight to disk.
  try {
    await fs.writeFile(CONTENT_PATH, serialized, 'utf8');
    return NextResponse.json({
      ok: true,
      mode: 'disk',
      message: 'Enregistré — rechargez le site pour voir les changements.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'erreur inconnue';
    return NextResponse.json(
      {
        error: `Écriture impossible (${message}). Sur Vercel, configurez GITHUB_TOKEN pour enregistrer via GitHub (voir README), ou téléchargez le JSON.`,
      },
      { status: 500 },
    );
  }
}
