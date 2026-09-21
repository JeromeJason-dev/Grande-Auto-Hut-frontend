import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container" style={{ padding: "4rem 1.5rem", textAlign: "left" }}>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist, or the link is broken.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  );
}
