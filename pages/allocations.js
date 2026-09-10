import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "../components/useAppAuth";
import { currentISOWeek, shiftWeek, weekRangeLabel } from "../lib/weeks";

export default function Allocations() {
  const { isAuthenticated, isLoading, claims, signIn, signOut, authFetch } = useAppAuth();
  const [week, setWeek] = useState(currentISOWeek());
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [draft, setDraft] = useState({ category: "", subCommitment: "" });

  function load() {
    authFetch(`/api/allocations?week=${week}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, week]);

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
  if (!data) return <p style={{ padding: 24 }}>Loading allocations…</p>;

  const { roster, categories, allocations, suggestions } = data;
  const canEdit = claims?.roles?.some((r) => ["EM", "PM", "Lead"].includes(r));

  function currentCategory(name) {
    return allocations[name]?.category || suggestions[name] || null;
  }

  function openEdit(name) {
    const existing = allocations[name];
    setDraft({
      category: existing?.category || suggestions[name] || "",
      subCommitment: existing?.subCommitment || "",
    });
    setEditingName(name);
  }

  async function saveEdit(name) {
    const res = await authFetch("/api/allocations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week, name, ...draft }),
    });
    if (res.ok) {
      const saved = await res.json();
      setData((d) => ({ ...d, allocations: { ...d.allocations, [name]: saved } }));
      setEditingName(null);
    } else {
      const err = await res.json();
      alert(err.error || "Could not save");
    }
  }

  // Build the holistic "Weekly Overview" — same shape as the team's original
  // sheet: a count and a name-list per category, plus "(not allocated)".
  const overview = {};
  for (const cat of [...categories, "(not allocated)"]) overview[cat] = [];
  for (const member of roster) {
    const cat = currentCategory(member.name) || "(not allocated)";
    (overview[cat] = overview[cat] || []).push(member.name);
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1300, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 0 }}>Weekly Allocation</h2>
          <Link href="/">← Issue status</Link> {" | "}
          <Link href="/gantt">Timeline</Link> {" | "}
          <Link href="/leave">Leave tracker →</Link>
        </div>
        <div>
          <span style={{ marginRight: 12 }}>
            {claims?.name} ({claims?.roles?.join(", ") || "no role mapped"})
          </span>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0" }}>
        <button onClick={() => setWeek((w) => shiftWeek(w, -1))}>← Prev week</button>
        <strong>{week} ({weekRangeLabel(week)})</strong>
        <button onClick={() => setWeek((w) => shiftWeek(w, 1))}>Next week →</button>
        {week !== currentISOWeek() && (
          <button onClick={() => setWeek(currentISOWeek())}>Back to this week</button>
        )}
      </div>

      {!canEdit && <p style={{ color: "#888" }}>You have read-only access to this view.</p>}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <table style={{ borderCollapse: "collapse", flex: "1 1 600px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Team</th>
              <th style={{ padding: 8 }}>Allocation</th>
              <th style={{ padding: 8 }}>Sub-team / other commitment</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((m) => {
              const cat = currentCategory(m.name);
              const isSuggested = !allocations[m.name]?.category && suggestions[m.name];
              return (
                <tr key={m.name} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{m.name}</td>
                  <td style={{ padding: 8, color: "#888" }}>{m.team}</td>
                  <td style={{ padding: 8 }}>
                    {editingName === m.name ? (
                      <select
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                        onBlur={() => saveEdit(m.name)}
                        autoFocus
                      >
                        <option value="">(not allocated)</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <span
                        onClick={() => canEdit && openEdit(m.name)}
                        style={{
                          cursor: canEdit ? "pointer" : "default",
                          color: isSuggested ? "#b45309" : "inherit",
                          fontStyle: cat ? "normal" : "italic",
                        }}
                        title={isSuggested ? "Suggested from logged leave — click to confirm" : ""}
                      >
                        {cat || "(not allocated)"}{isSuggested ? " (suggested)" : ""}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    {editingName === m.name ? (
                      <input
                        value={draft.subCommitment}
                        onChange={(e) => setDraft({ ...draft, subCommitment: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(m.name)}
                        onBlur={() => saveEdit(m.name)}
                      />
                    ) : (
                      <span onClick={() => canEdit && openEdit(m.name)} style={{ cursor: canEdit ? "pointer" : "default" }}>
                        {allocations[m.name]?.subCommitment || "—"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ flex: "1 1 400px", border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Weekly Overview</h3>
          {[...categories, "(not allocated)"].map((cat) => (
            <div key={cat} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span>{cat}</span>
                <span>{overview[cat].length}</span>
              </div>
              {overview[cat].length > 0 && (
                <div style={{ color: "#666", fontSize: 13 }}>{overview[cat].join(", ")}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
