# Team Status Tracker

Pulls open issues from your GitHub repos, shows status, flags anything stale,
lets EM/PM/Lead add a manual status + comment, and includes a **weekly
allocation planner** and **leave tracker** modeled directly on the team's
existing allocation sheet. Auth is Asgardeo (React SDK), restricted to
@wso2.com accounts, with roles driven by Asgardeo groups.

## 1. Configure repos, roster, and roles
Edit `lib/config.js`:
- `TRACKED_REPOS` — your GitHub repos, e.g. `"wso2/product-is"`.
- `TEAMS` — the sub-teams people can be assigned to (Leads / User Mgt &
  Authentication / OAuth & OIDC / B2B / IS Core / IAM SaaS / Thunder /
  Thunder Core / Dev Rel).
- `TEAM_ROSTER` — starts empty; add people as `{ name, team }`, with `team`
  drawn from `TEAMS`. Keyed by name (not email) — add an `email` field only
  if you later want to link a row to a specific Asgardeo login.
- `ALLOCATION_CATEGORIES` — ported from your sheet's "Weekly Overview" tab
  (R&D - IS, R&D - SaaS, R&D - ThunderID, R&D Common, Maintenance - SaaS,
  Maintenance - OnPrem, CS Cmt., SA Cmt., DevRel Cmt., Other Cmt., Leave,
  Long-term Leave). Edit if these change.
- `ASGARDEO_GROUP_TO_ROLE` — map your Asgardeo group names to `EM`/`PM`/`Lead`/`Dev`.
- `STATUS_EDIT_ROLES` / `ALLOCATION_EDIT_ROLES` / `LEAVE_EDIT_ROLES` — who can
  edit each view. All default to EM/PM/Lead; narrow to `["Lead"]` for any of
  them if you want that specific view locked to Leads only.
- `ALLOWED_EMAIL_DOMAIN` — defaults to `wso2.com`.

## 2. Set up the Asgardeo app
Create a **Single-Page Application (SPA)** in the Asgardeo console — the
React SDK uses browser-based OIDC + PKCE, no client secret.
- Redirect URLs: your app's URL.
- Enable the `groups` claim/scope in **User Attributes** so group membership
  reaches both the browser and the API routes' token verification.
- Copy the Client ID and base URL (`https://api.asgardeo.io/t/<org>`) into `.env`.

## 3. GitHub token
Fine-grained PAT (or GitHub App) with read-only access to Issues on your
tracked repos, in `GITHUB_TOKEN`.

## 4. Local dev
```bash
cp .env.example .env   # fill in the values above
npm install
npm run dev
```

## 5. Deploy to Choreo
`.choreo/component.yaml` + `Dockerfile` are included.
1. Push to a Git repo Choreo can access, create a component from it.
2. Add the env vars from `.env.example` in Choreo's environment config.
3. Deploy, then update the `NEXT_PUBLIC_ASGARDEO_*REDIRECT_URL` values (and the
   redirect URL registered in Asgardeo) to match the URL Choreo assigns.

## Weekly allocation planner (`/allocations`)
Matches the shape of the team's existing sheet, not a generic percentage
matrix:
- Each person gets **one allocation category per week** (not a % split) —
  e.g. "R&D - IS", "Maintenance - OnPrem", "Leave" — plus a free-text
  sub-team/other-commitment note, exactly like the original "Main Allocation"
  + "Sub Team / Other Commitment" columns.
- Prev/next week navigation, same ISO-week convention (`2026-W38`) as the sheet.
- The **Weekly Overview** panel is the holistic view: a live count and name
  list per category for the selected week — the same rollup your sheet's
  "Weekly Overview" tab computed by hand.
- If someone has a logged leave record overlapping the selected week, their
  row shows a *suggested* category (Leave / Long-term Leave) in amber — a
  Lead confirms it with one click rather than re-entering it.

## Leave tracker (`/leave`)
Logs Annual/Sabbatical leave per roster member (by name), editable by
`LEAVE_EDIT_ROLES` ("leads and above"). Feeds the allocation suggestions above.
It's a log, not an approval workflow — no request/approve states or conflict
detection.

## How access control actually works
- **Domain restriction is enforced server-side**, not just hidden in the UI.
  Every API route calls `verifyRequest()` (`lib/auth-server.js`), which
  re-verifies the ID token's signature against Asgardeo's JWKS and rejects
  any email not ending in `@wso2.com`.
- **Role gating** works the same way: edit checks run server-side on every
  write, using roles derived from the verified token's `groups` claim.
- The client-side check in `components/useAppAuth.js` only exists to show
  the right UI faster — it is not itself a security boundary.

## GitHub issue caching
Every pull upserts the fetched issues into a local cache (`data/issues-cache.json`)
keyed by issue id, and prunes anything no longer returned (closed, deleted, or
dropped from `TRACKED_REPOS`) so the cache mirrors GitHub. If a live pull fails
(rate limit, outage), the API falls back to serving the last successful cache
instead of an error page, with `stale: true` so the UI can flag it.
This cache is intentionally **not** in CDS — an issue isn't owned by one
person's profile (it can be unassigned, reassigned, or have multiple
collaborators), so it stays a simple id-keyed store, separate from the
per-person CDS data.

## Timeline / Gantt view (`/gantt`)
Manual, on top of the same issue-status data — not a separate scheduling
system. Adding a start date and target date to a task's status override
(same modal used for status + comment on `/`) plots it as a bar on a
week-by-week grid, styled after the original spreadsheet's Gantt tabs.
Tasks without both dates set are listed but not plotted. Since GitHub Issues
have no native start/target date concept, this is the same trade-off as
before: it's exactly as good as what gets entered manually, no more.

## Known limitations
- **Storage is JSON files** — fine for a pilot; on Choreo, container storage
  isn't guaranteed to survive a redeploy. Swap `lib/storage.js` for Choreo's
  managed Postgres before relying on this long-term (same function signatures).
- **Allocation is manual entry**, not derived from actual GitHub workload —
  same as the original sheet. Deriving it from real issue assignments would
  be a bigger next step.
- **Staleness threshold** (issue status view) is hardcoded to 14 days in
  `pages/index.js`.
