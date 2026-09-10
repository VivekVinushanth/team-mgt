import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "../components/useAppAuth";

const emptyForm = { name: "", type: "Annual", startDate: "", endDate: "", notes: "" };

export default function Leave() {
  const { isAuthenticated, isLoading, claims, signIn, signOut, authFetch } = useAppAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);

  function load() {
    authFetch("/api/leave")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setData(d)))
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (isAuthenticated) load();
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
  if (!data) return <p style={{ padding: 24 }}>Loading leave records…</p>;

  const { roster, leaveTypes, leave } = data;
  const canEdit = claims?.roles?.some((r) => ["EM", "PM", "Lead"].includes(r));
  const today = new Date().toISOString().slice(0, 10);

  async function submit(e) {
    e.preventDefault();
    const res = await authFetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(emptyForm);
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Could not save");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this leave record?")) return;
    const res = await authFetch(`/api/leave/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else alert("Could not delete");
  }

  const sorted = [...leave].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ marginBottom: 0 }}>Leave Tracker</h2>
          <Link href="/">← Issue status</Link> {" | "}
          <Link href="/gantt">Timeline</Link> {" | "}
          <Link href="/allocations">Allocation →</Link>
        </div>
        <div>
          <span style={{ marginRight: 12 }}>
            {claims?.name} ({claims?.roles?.join(", ") || "no role mapped"})
          </span>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </div>

      {!canEdit && <p style={{ color: "#888" }}>You have read-only access to leave records.</p>}

      {canEdit && (
        <form onSubmit={submit} style={{ margin: "16px 0", padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
          <h4 style={{ marginTop: 0 }}>Log leave</h4>
          <select
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            style={{ marginRight: 8 }}
          >
            <option value="">Select member…</option>
            {roster.map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={{ marginRight: 8 }}
          >
            {leaveTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
            style={{ marginRight: 8 }}
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            required
            style={{ marginRight: 8 }}
          />
          <input
            placeholder="notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ marginRight: 8 }}
          />
          <button type="submit">Add</button>
        </form>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: 8 }}>Member</th>
            <th style={{ padding: 8 }}>Type</th>
            <th style={{ padding: 8 }}>Start</th>
            <th style={{ padding: 8 }}>End</th>
            <th style={{ padding: 8 }}>Notes</th>
            <th style={{ padding: 8 }}>Logged by</th>
            {canEdit && <th style={{ padding: 8 }}></th>}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const active = r.startDate <= today && today <= r.endDate;
            return (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee", background: active ? "#e8f5e9" : "transparent" }}>
                <td style={{ padding: 8 }}>{r.name}</td>
                <td style={{ padding: 8 }}>{r.type}</td>
                <td style={{ padding: 8 }}>{r.startDate}</td>
                <td style={{ padding: 8 }}>{r.endDate}</td>
                <td style={{ padding: 8 }}>{r.notes}</td>
                <td style={{ padding: 8 }}>{r.updatedBy}</td>
                {canEdit && (
                  <td style={{ padding: 8 }}>
                    <button onClick={() => remove(r.id)}>Delete</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p style={{ color: "#888", fontSize: 14, marginTop: 8 }}>
        Rows highlighted green are currently active leave.
      </p>
    </div>
  );
}
