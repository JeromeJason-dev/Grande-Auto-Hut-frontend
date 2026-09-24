import FitmentFinder from "./FitmentFinder";

export default function FitmentPage() {
  return (
    <div className="container" style={{ padding: "3rem 1.5rem", maxWidth: 760 }}>
      <h1>Fitment Finder</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: "1.5rem" }}>
        Select your vehicle's make, model, and year — we'll only show parts we've confirmed fit it.
      </p>
      <FitmentFinder />
    </div>
  );
}
