// The signed-out landing page. This is the only thing an unauthenticated
// visitor ever sees, so it explains what the app is before asking for a login.

const FEATURES = [
  {
    title: "Issue status",
    body:
      "Open issues pulled from the team's GitHub repos, with anything untouched for two weeks flagged for a status update.",
  },
  {
    title: "Weekly allocation",
    body:
      "Who is on what this week, grouped by sub-team, with leave suggested automatically against the right category.",
  },
  {
    title: "Leave tracker",
    body:
      "Annual and long-term leave in one place, feeding straight into the allocation view so plans reflect who is actually around.",
  },
];

export default function SignedOutLanding({ onSignIn, allowedDomain, checkingSession }) {
  return (
    <main className="wrap">
      <div className="card">
        <div className="mark" aria-hidden="true">TS</div>

        <h1>Team Status Tracker</h1>
        <p className="lede">
          Issue status, weekly allocations and leave for the IAM team — in one place,
          instead of three spreadsheets.
        </p>

        <button className="cta" onClick={onSignIn}>
          Sign in with Asgardeo
        </button>

        <p className="restricted">
          {checkingSession ? (
            <span className="checking">Checking for an existing session…</span>
          ) : (
            <>Restricted to <strong>@{allowedDomain}</strong> accounts</>
          )}
        </p>

        <ul className="features">
          {FEATURES.map((f) => (
            <li key={f.title}>
              <h2>{f.title}</h2>
              <p>{f.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          background:
            radial-gradient(circle at 15% 0%, #eef2ff 0%, transparent 55%),
            radial-gradient(circle at 85% 100%, #ecfeff 0%, transparent 55%),
            #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Helvetica, Arial, sans-serif;
          color: #0f172a;
          box-sizing: border-box;
        }
        .card {
          width: 100%;
          max-width: 720px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 48px 40px 40px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04),
            0 12px 32px rgba(15, 23, 42, 0.06);
          text-align: center;
        }
        .mark {
          width: 48px;
          height: 48px;
          margin: 0 auto 20px;
          border-radius: 12px;
          background: #4f46e5;
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        h1 {
          margin: 0 0 12px;
          font-size: 30px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        .lede {
          margin: 0 auto 28px;
          max-width: 46ch;
          font-size: 16px;
          line-height: 1.6;
          color: #475569;
        }
        .cta {
          appearance: none;
          border: 0;
          cursor: pointer;
          background: #4f46e5;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: inherit;
          padding: 13px 28px;
          border-radius: 8px;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .cta:hover {
          background: #4338ca;
        }
        .cta:active {
          transform: translateY(1px);
        }
        .cta:focus-visible {
          outline: 2px solid #4f46e5;
          outline-offset: 3px;
        }
        .restricted {
          margin: 14px 0 0;
          font-size: 13px;
          color: #64748b;
        }
        .restricted strong {
          color: #334155;
          font-weight: 600;
        }
        .checking {
          color: #94a3b8;
        }
        .features {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          margin: 40px 0 0;
          padding: 32px 0 0;
          border-top: 1px solid #e2e8f0;
          text-align: left;
        }
        .features h2 {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #4f46e5;
        }
        .features p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.55;
          color: #64748b;
        }
        @media (max-width: 640px) {
          .card {
            padding: 36px 24px 32px;
          }
          h1 {
            font-size: 25px;
          }
          .features {
            grid-template-columns: 1fr;
            gap: 22px;
          }
        }
      `}</style>
    </main>
  );
}
