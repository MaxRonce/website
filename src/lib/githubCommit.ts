/**
 * Committing files to the site's GitHub repository — used by the /admin APIs
 * on read-only hosts (Vercel), where a push triggers an automatic redeploy.
 */

/**
 * Repository to commit to: GITHUB_REPO if set, otherwise the repo Vercel
 * deployed from (system env vars VERCEL_GIT_REPO_OWNER / _SLUG).
 */
export function resolveGitHubRepo(): string | undefined {
  if (process.env.GITHUB_REPO) return process.env.GITHUB_REPO;
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const slug = process.env.VERCEL_GIT_REPO_SLUG;
  return owner && slug ? `${owner}/${slug}` : undefined;
}

export function gitHubConfigured(): boolean {
  return Boolean(resolveGitHubRepo() && process.env.GITHUB_TOKEN);
}

/** Creates or updates a file in the repo. Content is base64-encoded. */
export async function commitFileToGitHub(
  repoFilePath: string,
  contentBase64: string,
  message: string,
): Promise<void> {
  const repo = resolveGitHubRepo();
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH ?? process.env.VERCEL_GIT_COMMIT_REF ?? 'main';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${repoFilePath}`;
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
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub a répondu ${response.status}: ${detail.slice(0, 200)}`);
  }
}
