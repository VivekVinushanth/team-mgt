import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "../components/useAppAuth";
import { weeksBetween, weekRangeLabel } from "../lib/weeks";

export default function Gantt() {
  const { isAuthenticated, isLoading, claims, signIn, signOut, authFetch } = useAppAuth();
  const [issues, setIssues] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      authFetch("/api/github/issues").then((r) => r.json()),
      authFetch("/api/status").then((r) => r.json()),
    ])
      .then(([issuesData, overridesData]) => {
        if (issuesData.error && !issuesData.issues) throw new Error(issuesData.error);
        setIssues(issuesData.issues || []);
        setOverrides(overridesData);
      })
      .catch((e) => setError(e.message));
  }, [isAuthenticated]);

  if (isLoading) return <p style={{ padding: 24 }}>Loading…</p>;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 48, fontFamily: "sans-serif" }}>
        <h2>Team Status Tracker</h2>
        <button onClick={() => signIn()}>Sign in with Asgardeo</button>
      </div>
    );
  }

  if (claims && !claims.allowedDomain) {
    return (
      <div style={{ padding: 48, fontFamily: "sans-serif" }}>
        <h2>Access restricted</h2>
        <p>This app is limited to @wso2.com accounts. You're signed in as {claims.email}.</p>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  if (error) return <p style={{ padding: 24, color: "crimson" }}>{error}</p>;

  // Only issues with both dates set can be plotted.
  const scheduled = issues
    .map((issue) => ({ issue, dates: overrides[issue.id] }))
    .filter(({ dates }) => dates?.startDate && dates?.targetDate);

  const unscheduled = issues.filter((i) => !overrides[i.id]?.startDate || !overrides[i.id]?.targetDate);

  if (scheduled.length === 0) {
    return (
      <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1000, margin: "0 auto" }}>
        <NavHeader claims={claims} signOut={signOut} />
        <p style={{ color: "#888" }}>
          No tasks have both a start and target date set yet. Open a task from the{" "}
          <Link href="/">issue status page</Link> and add dates to see it here.
        </p>
      </div>
    );
  }

  // Build the shared week axis spanning every scheduled task.
  const allStarts = scheduled.map(({ dates }) => dates.startDate);
  const allTargets = scheduled.map(({ dates }) => dates.targetDate);
  const rangeStart = allStarts.reduce((a, b) => (a < b ? a : b));
  const rangeEnd = allTargets.reduce((a, b) => (a > b ? a : b));
  const weeks = weeksBetween(rangeStart, rangeEnd);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1400, margin: "0 auto" }}>
      <NavHeader claims={claims} signOut={signOut} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ padding: 8, textAlign: "left", position: "sticky", left: 0, background: "var(--bg, white)" }}>
                Task
              </th>
              <th style={{ padding: 8, textAlign: "left" }}>Repo</th>
              {weeks.map((w) => (
                <th key={w} style={{ padding: "4px 6px", fontSize: 11, whiteSpace: "nowrap", textAlign: "center" }}>
                  {w.split("-W")[1]}
                  <div style={{ fontWeight: "normal", color: "#888" }}>{weekRangeLabel(w)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scheduled.map(({ issue, dates }) => {
              const taskWeeks = new Set(weeksBetween(dates.startDate, dates.targetDate));
              return (
                <tr key={issue.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 8, position: "sticky", left: 0, background: "var(--bg, white)" }}>
                    <a href={issue.url} target="_blank" rel="noreferrer">{issue.title}</a>
                  </td>
                  <td style={{ padding: 8, color: "#888" }}>{issue.repo}</td>
                  {weeks.map((w) => (
                    <td key={w} style={{ padding: 0, textAlign: "center" }}>
                      {taskWeeks.has(w) && (
                        <div style={{ height: 18, margin: "4px 2px", background: "#378ADD", borderRadius: 3 }} />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unscheduled.length > 0 && (
        <p style={{ color: "#888", fontSize: 14, marginTop: 16 }}>
          {unscheduled.length} task{unscheduled.length === 1 ? "" : "s"} without both dates set aren't shown here —
          add a start and target date from the <Link href="/">issue status page</Link> to plot them.
        </p>
      )}
    </div>
  );
}

function NavHeader({ claims, signOut }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div>
        <h2 style={{ marginBottom: 0 }}>Timeline</h2>
        <Link href="/">← Issue status</Link> {" | "}
        <Link href="/allocations">Allocation</Link> {" | "}
        <Link href="/leave">Leave</Link>
      </div>
      <div>
        <span style={{ marginRight: 12 }}>
          {claims?.name} ({claims?.roles?.join(", ") || "no role mapped"})
        </span>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    </div>
  );
}
