// The signed-out landing page — the only thing an unauthenticated visitor
// sees, so it explains what the app is before asking for a login.
//
// Everything here renders identically on the server and on the client's first
// pass: no dates, no randomness, no state. An earlier version varied a line of
// text on the SDK's loading flag, which broke hydration and left a dead,
// unclickable copy of the sign-in button in the DOM.

const FEATURES = [
  {
    title: "Issue status",
    body: "Open issues from the team's repos, with anything stale flagged for an update.",
    icon: (
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    title: "Weekly allocation",
    body: "Who is on what this week, grouped by sub-team, with leave folded in.",
    icon: (
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
  },
  {
    title: "Leave tracker",
    body: "Annual and long-term leave in one place, feeding the allocation view.",
    icon: (
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
  },
];

// Illustrative preview only — deliberately anonymous placeholder rows rather
// than real people.
const PREVIEW_ROWS = [
  { w: 68, cat: "R&D - IS", tone: "indigo" },
  { w: 52, cat: "R&D - SaaS", tone: "sky" },
  { w: 74, cat: "Maintenance", tone: "amber" },
  { w: 44, cat: "Leave", tone: "slate" },
  { w: 61, cat: "R&D Common", tone: "emerald" },
];

// `signingIn` only ever flips after a user click, i.e. after hydration, so it
// cannot desync the server and client renders.
export default function SignedOutLanding({ onSignIn, allowedDomain, signingIn }) {
  return (
    <main className="page">
      <div className="grid">
        <section className="pitch">
          <div className="brand">
            <span className="mark" aria-hidden="true">TS</span>
            <span className="brandName">Team Status Tracker</span>
          </div>

          <h1>
            Everything the team is working on,<br />
            <span className="accent">without the spreadsheets.</span>
          </h1>

          <p className="lede">
            Issue status, weekly allocations and leave for the IAM team — pulled
            together in one place and kept current.
          </p>

          <button className="cta" onClick={onSignIn} disabled={signingIn}>
            {signingIn ? "Redirecting…" : "Sign in with Asgardeo"}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>

          <p className="restricted">
            <span className="lock" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            Restricted to <strong>@{allowedDomain}</strong> accounts
          </p>

          <ul className="features">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="fIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">{f.icon}</svg>
                </span>
                <div>
                  <h2>{f.title}</h2>
                  <p>{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="previewWrap" aria-hidden="true">
          <div className="preview">
            <div className="pTop">
              <span className="dot r" />
              <span className="dot y" />
              <span className="dot g" />
            </div>
            <div className="pBody">
              <div className="pHead">
                <span className="pTitle">Weekly allocation</span>
                <span className="pWeek">This week</span>
              </div>
              {PREVIEW_ROWS.map((r, i) => (
                <div className="pRow" key={i}>
                  <span className="pAvatar" />
                  <span className="pName" style={{ width: `${r.w}%` }} />
                  <span className={`chip ${r.tone}`}>{r.cat}</span>
                </div>
              ))}
              <div className="pFoot">
                <span className="bar b1" />
                <span className="bar b2" />
                <span className="bar b3" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Helvetica, Arial, sans-serif;
          color: #0f172a;
          background:
            radial-gradient(900px 600px at 8% -10%, #e0e7ff 0%, transparent 60%),
            radial-gradient(800px 600px at 100% 110%, #cffafe 0%, transparent 55%),
            linear-gradient(180deg, #fbfcfe 0%, #f4f6fb 100%);
        }
        .grid {
          width: 100%;
          max-width: 1080px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 30px;
        }
        .mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          color: #fff;
          font-size: 12.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.32);
        }
        .brandName {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #334155;
        }

        h1 {
          margin: 0 0 16px;
          font-size: 42px;
          line-height: 1.12;
          letter-spacing: -0.033em;
          font-weight: 700;
        }
        .accent {
          background: linear-gradient(100deg, #4f46e5, #0891b2);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .lede {
          margin: 0 0 30px;
          max-width: 44ch;
          font-size: 16.5px;
          line-height: 1.62;
          color: #52607a;
        }

        .cta {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          appearance: none;
          border: 0;
          cursor: pointer;
          font-family: inherit;
          font-size: 15px;
          font-weight: 600;
          color: #fff;
          padding: 14px 26px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          box-shadow: 0 6px 18px rgba(67, 56, 202, 0.3);
          transition: transform 0.16s ease, box-shadow 0.16s ease,
            filter 0.16s ease;
        }
        .cta svg {
          width: 17px;
          height: 17px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform 0.16s ease;
        }
        .cta:hover {
          filter: brightness(1.06);
          box-shadow: 0 9px 24px rgba(67, 56, 202, 0.36);
          transform: translateY(-1px);
        }
        .cta:hover svg {
          transform: translateX(3px);
        }
        .cta:active {
          transform: translateY(0);
        }
        .cta:focus-visible {
          outline: 2px solid #4338ca;
          outline-offset: 3px;
        }
        .cta:disabled {
          cursor: progress;
          filter: saturate(0.75);
          box-shadow: none;
        }
        .cta:disabled:hover {
          transform: none;
        }

        .restricted {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 15px 0 0;
          font-size: 13px;
          color: #64748b;
        }
        .restricted strong {
          color: #334155;
          font-weight: 600;
        }
        .lock svg {
          width: 14px;
          height: 14px;
          fill: none;
          stroke: #94a3b8;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
          display: block;
        }

        .features {
          list-style: none;
          margin: 40px 0 0;
          padding: 32px 0 0;
          border-top: 1px solid #e3e8f0;
          display: grid;
          gap: 20px;
        }
        .features li {
          display: flex;
          gap: 13px;
          align-items: flex-start;
        }
        .fIcon {
          flex: none;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fIcon svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: #4f46e5;
          stroke-width: 1.9;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .features h2 {
          margin: 1px 0 3px;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        .features p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          color: #6b7a90;
        }

        /* ---- preview panel ---- */
        .previewWrap {
          display: flex;
          justify-content: center;
        }
        .preview {
          width: 100%;
          max-width: 420px;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 24px 60px -18px rgba(15, 23, 42, 0.28),
            0 6px 18px -8px rgba(15, 23, 42, 0.12);
          transform: perspective(1400px) rotateY(-7deg) rotateX(2deg);
        }
        .pTop {
          display: flex;
          gap: 6px;
          padding: 11px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #eef2f7;
        }
        .dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: block;
        }
        .dot.r { background: #f87171; }
        .dot.y { background: #fbbf24; }
        .dot.g { background: #34d399; }

        .pBody { padding: 18px 18px 20px; }
        .pHead {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 16px;
        }
        .pTitle {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
        }
        .pWeek {
          font-size: 11px;
          color: #94a3b8;
        }
        .pRow {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          border-top: 1px solid #f1f5f9;
        }
        .pAvatar {
          flex: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
        }
        .pName {
          height: 7px;
          border-radius: 4px;
          background: #eef2f7;
        }
        .chip {
          margin-left: auto;
          flex: none;
          font-size: 10.5px;
          font-weight: 600;
          padding: 3.5px 9px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .chip.indigo  { background: #eef2ff; color: #4338ca; }
        .chip.sky     { background: #e0f2fe; color: #0369a1; }
        .chip.amber   { background: #fef3c7; color: #b45309; }
        .chip.slate   { background: #f1f5f9; color: #64748b; }
        .chip.emerald { background: #d1fae5; color: #047857; }

        .pFoot {
          display: flex;
          gap: 6px;
          align-items: flex-end;
          height: 42px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }
        .bar {
          flex: 1;
          border-radius: 4px 4px 0 0;
          background: linear-gradient(180deg, #a5b4fc, #6366f1);
        }
        .b1 { height: 55%; }
        .b2 { height: 88%; }
        .b3 { height: 38%; }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
            gap: 44px;
            max-width: 560px;
          }
          .previewWrap { order: -1; }
          .preview { transform: none; max-width: 100%; }
          h1 { font-size: 34px; }
        }
        @media (max-width: 540px) {
          .page { padding: 32px 18px; }
          h1 { font-size: 28px; }
          .lede { font-size: 15.5px; }
          .cta { width: 100%; justify-content: center; }
        }
      `}</style>
    </main>
  );
}
