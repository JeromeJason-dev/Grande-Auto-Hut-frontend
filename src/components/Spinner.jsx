export default function Spinner({ label = "Loading" }) {
  return (
    <div className="row" style={{ gap: "0.6rem", color: "var(--ink-soft)", padding: "2rem 0" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="var(--line-strong)" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span>{label}…</span>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
