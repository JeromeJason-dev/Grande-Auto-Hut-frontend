export default function Price({ value, size = "md" }) {
  const formatted = new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0 }).format(Number(value));
  const cls = { sm: "0.85rem", md: "1rem", lg: "1.35rem" }[size];
  return (
    <span className="mono" style={{ fontSize: cls, fontWeight: 500 }}>
      KES {formatted}
    </span>
  );
}
