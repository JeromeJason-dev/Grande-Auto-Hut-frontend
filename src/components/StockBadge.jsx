export default function StockBadge({ inStock, lowStock }) {
  if (!inStock) return <span className="badge badge-danger">Out of stock</span>;
  if (lowStock) return <span className="badge badge-warning">Low stock</span>;
  return <span className="badge badge-success">In stock</span>;
}
