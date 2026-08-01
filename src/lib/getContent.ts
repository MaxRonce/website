import { promises as fs } from 'fs';
import path from 'path';

import fallbackContent from '@/content/content.json';
import type { SiteContent } from '@/content/types';

/**
 * Server-side content loader. Reads content.json from disk at request time so
 * that edits made through /admin (on hosts with a writable filesystem — VPS,
 * local dev) appear without rebuilding; falls back to the content bundled at
 * build time when the filesystem is unavailable (e.g. serverless).
 */
export async function getContent(): Promise<SiteContent> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'src', 'content', 'content.json'),
      'utf8',
    );
    return JSON.parse(raw) as SiteContent;
  } catch {
    return fallbackContent as SiteContent;
  }
}
