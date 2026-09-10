import { Octokit } from "octokit";
import { verifyRequest } from "../../../lib/auth-server";
import { TRACKED_REPOS } from "../../../lib/config";
import { getCachedIssues, upsertCachedIssues, pruneCachedIssues } from "../../../lib/storage";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export default async function handler(req, res) {
  try {
    await verifyRequest(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  try {
    const results = await Promise.all(
      TRACKED_REPOS.map(async (repoSlug) => {
        const [owner, repo] = repoSlug.split("/");
        const { data } = await octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: "open",
          per_page: 100,
        });
        return data
          .filter((i) => !i.pull_request)
          .map((i) => ({
            id: `${repoSlug}#${i.number}`,
            repo: repoSlug,
            title: i.title,
            url: i.html_url,
            state: i.state,
            assignee: i.assignee?.login || null,
            labels: i.labels.map((l) => (typeof l === "string" ? l : l.name)),
            updatedAt: i.updated_at,
          }));
      })
    );
    const issues = results.flat();

    // Upsert this pull into the cache, then drop anything that's fallen out
    // (closed, deleted, or the repo list changed) so the cache mirrors GitHub.
    upsertCachedIssues(issues);
    pruneCachedIssues(issues.map((i) => i.id));

    res.status(200).json({ issues, stale: false });
  } catch (err) {
    // GitHub unreachable / rate-limited — serve the last successful pull
    // instead of a blank page, clearly marked as stale.
    const cached = Object.values(getCachedIssues());
    if (cached.length > 0) {
      return res.status(200).json({ issues: cached, stale: true, error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
}
