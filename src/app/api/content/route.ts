import { timingSafeEqual, createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

import fallbackContent from '@/content/content.json';

export const dynamic = 'force-dynamic';

const CONTENT_PATH = path.join(process.cwd(), 'src', 'content', 'content.json');
const GITHUB_FILE_PATH = 'src/content/content.json';

/**
 * Constant-time password check. Both sides are hashed first so the comparison
 * length never depends on the submitted value.
 */
function passwordMatches(submitted: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !submitted) return false;
  const a = createHash('sha256').update(submitted).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

function unauthorized(): NextResponse {
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  return NextResponse.json(
    {
      error: configured
        ? 'Mot de passe incorrect.'
        : "L'éditeur est désactivé : aucune variable ADMIN_PASSWORD n'est configurée (voir README).",
    },
    { status: 401 },
  );
}

/**
 * Commits content.json to the GitHub repository. Used on read-only hosts
 * (Vercel): the push triggers an automatic redeploy, so the site updates a
 * couple of minutes after saving.
 */
async function saveToGitHub(serialized: string): Promise<void> {
  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH ?? 'main';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${GITHUB_FILE_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'cosmic-portfolio-admin',
    'Content-Type': 'application/json',
  };

  let sha: string | undefined;
  const current = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
    headers,
    cache: 'no-store',
  });
  if (current.ok) {
    const data = (await current.json()) as { sha?: string };
    sha = data.sha;
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'content: update via /admin editor',
      content: Buffer.from(serialized, 'utf8').toString('base64'),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub a répondu ${response.status}: ${detail.slice(0, 200)}`);
  }
}

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
    return unauthorized();
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
  if (process.env.GITHUB_REPO && process.env.GITHUB_TOKEN) {
    try {
      await saveToGitHub(serialized);
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
        error: `Écriture impossible (${message}). Sur Vercel, configurez GITHUB_REPO et GITHUB_TOKEN pour enregistrer via GitHub (voir README), ou téléchargez le JSON.`,
      },
      { status: 500 },
    );
  }
}
