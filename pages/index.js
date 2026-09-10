import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "../components/useAppAuth";
import SignedOutLanding from "../components/SignedOutLanding";
import { ALLOWED_EMAIL_DOMAIN } from "../lib/config";

const STALE_DAYS = 14;

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function Dashboard() {
  const { isAuthenticated, isLoading, claims, signIn, signOut, authFetch } = useAppAuth();
  const [issues, setIssues] = useState([]);
  const [stale, setStale] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({ status: "", comment: "", startDate: "", targetDate: "" });
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !claims?.allowedDomain) return;
    setLoadingIssues(true);
    authFetch("/api/github/issues")
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !data.issues) throw new Error(data.error);
        setIssues(data.issues);
        setStale(data.stale);
        if (data.stale) setError(`Showing cached data — live pull failed: ${data.error}`);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingIssues(false));
  }, [isAuthenticated, claims]);

  async function openEdit(issue) {
    const res = await authFetch(`/api/status/${encodeURIComponent(issue.id)}`);
    const existing = await res.json();
    setDraft({
      status: existing?.status || issue.state,
      comment: existing?.comment || "",
      startDate: existing?.startDate || "",
      targetDate: existing?.targetDate || "",
    });
    setEditing(issue.id);
  }

  async function saveEdit(issueId) {
    const res = await authFetch(`/api/status/${encodeURIComponent(issueId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const saved = await res.json();
      setOverrides((o) => ({ ...o, [issueId]: saved }));
      setEditing(null);
    } else {
      const err = await res.json();
      alert(err.error || "Could not save");
    }
  }

  // Deliberately not gated on isLoading: Asgardeo's session check can take
  // many seconds, and blocking on it left visitors staring at a bare
  // "Loading…" with no idea what the app was. Show the landing page straight
  // away and let the session check resolve behind it.
  if (!isAuthenticated) {
    return (
      <SignedOutLanding
        onSignIn={() => signIn()}
        allowedDomain={ALLOWED_EMAIL_DOMAIN}
        checkingSession={isLoading}
      />
    );
  }

  if (claims && !claims.allowedDomain) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24, fontFamily: "sans-serif",
        background: "#f8fafc",
      }}>
        <div style={{
          maxWidth: 420, textAlign: "center", background: "#fff", padding: 40,
          borderRadius: 16, border: "1px solid #e2e8f0",
        }}>
          <h1 style={{ fontSize: 22, margin: "0 0 10px", color: "#0f172a" }}>
            Access restricted
          </h1>
          <p style={{ color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
            This app is limited to @{ALLOWED_EMAIL_DOMAIN} accounts. You are signed
            in as <strong>{claims.email}</strong>.
          </p>
          <button
            onClick={() => signOut()}
            style={{
              background: "#4f46e5", color: "#fff", border: 0, cursor: "pointer",
              padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const roles = claims?.roles || [];

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 0 }}>Team Status Tracker</h2>
          <Link href="/gantt">Timeline</Link> {" | "}
          <Link href="/allocations">Sub-team allocation</Link> {" | "}
          <Link href="/leave">Leave tracker →</Link>
        </div>
        <div>
          <span style={{ marginRight: 12 }}>
            {claims?.name} ({roles.join(", ") || "no role mapped"})
          </span>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </div>

      {error && <p style={{ color: "crimson" }}>Error loading GitHub issues: {error}</p>}
      {loadingIssues && <p>Loading issues…</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: 8 }}>Repo</th>
            <th style={{ padding: 8 }}>Issue</th>
            <th style={{ padding: 8 }}>Assignee</th>
            <th style={{ padding: 8 }}>GitHub state</th>
            <th style={{ padding: 8 }}>Manual status / comment</th>
            <th style={{ padding: 8 }}>Last updated</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => {
            const ov = overrides[issue.id];
            const stale = daysSince(issue.updatedAt) > STALE_DAYS && !ov;
            return (
              <tr key={issue.id} style={{ borderBottom: "1px solid #eee", background: stale ? "#fff8e1" : "transparent" }}>
                <td style={{ padding: 8 }}>{issue.repo}</td>
                <td style={{ padding: 8 }}>
                  <a href={issue.url} target="_blank" rel="noreferrer">{issue.title}</a>
                </td>
                <td style={{ padding: 8 }}>{issue.assignee || "—"}</td>
                <td style={{ padding: 8 }}>{issue.state}</td>
                <td style={{ padding: 8 }}>
                  {ov ? (
                    <span><b>{ov.status}</b> — {ov.comment} <i>({ov.updatedBy})</i></span>
                  ) : stale ? (
                    <span style={{ color: "#b45309" }}>No update in {daysSince(issue.updatedAt)}d — needs a status comment</span>
                  ) : (
                    <span style={{ color: "#888" }}>—</span>
                  )}
                </td>
                <td style={{ padding: 8 }}>{new Date(issue.updatedAt).toLocaleDateString()}</td>
                <td style={{ padding: 8 }}>
                  {roles.some((r) => ["EM", "PM", "Lead"].includes(r)) && (
                    <button onClick={() => openEdit(issue)}>Edit</button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {editing && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "white", padding: 24, borderRadius: 8, width: 400 }}>
            <h3>Update status</h3>
            <label>Status</label>
            <input
              style={{ display: "block", width: "100%", marginBottom: 12 }}
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            />
            <label>Comment</label>
            <textarea
              style={{ display: "block", width: "100%", marginBottom: 12 }}
              rows={4}
              value={draft.comment}
              onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
            />
            <label>Start date</label>
            <input
              type="date"
              style={{ display: "block", width: "100%", marginBottom: 12 }}
              value={draft.startDate}
              onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
            />
            <label>Target date</label>
            <input
              type="date"
              style={{ display: "block", width: "100%", marginBottom: 12 }}
              value={draft.targetDate}
              onChange={(e) => setDraft({ ...draft, targetDate: e.target.value })}
            />
            <button onClick={() => saveEdit(editing)}>Save</button>
            <button onClick={() => setEditing(null)} style={{ marginLeft: 8 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
