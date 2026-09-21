export default function EmptyState({ title, body, action }) {
  return (
    <div className="card" style={{ padding: "2.5rem 2rem", textAlign: "left" }}>
      <h3>{title}</h3>
      {body && <p style={{ color: "var(--ink-soft)" }}>{body}</p>}
      {action}
    </div>
  );
}
