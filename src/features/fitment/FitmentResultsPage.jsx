import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as fitmentApi from "../../api/fitment";
import { unwrapList } from "../../api/client";
import ProductCard from "../../components/ProductCard";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import FitmentFinder from "./FitmentFinder";

export default function FitmentResultsPage() {
  const [params] = useSearchParams();
  const make = params.get("make");
  const model = params.get("model");
  const year = params.get("year");

  const { data: raw, isLoading, isError, error } = useQuery({
    queryKey: ["fitment-results", make, model, year],
    queryFn: () => fitmentApi.findFittingProducts({ make, model, year }),
    enabled: !!(make && model && year),
  });
  const data = raw ? unwrapList(raw) : undefined;

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <FitmentFinder compact />
      </div>

      <h1 style={{ textTransform: "capitalize" }}>
        Parts for {make?.replace(/-/g, " ")} {model?.replace(/-/g, " ")} {year}
      </h1>

      {isLoading && <Spinner label="Checking fitment" />}

      {isError && (
        <EmptyState
          title="No matching vehicle found"
          body={error?.response?.status === 404
            ? "We couldn't find that make/model/year combination. Try adjusting your selection above."
            : "Something went wrong looking that up."}
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          title="No parts confirmed for this vehicle yet"
          body="We haven't catalogued fitment for this exact year. Try browsing the full catalog or contact support."
          action={<Link to="/catalog" className="btn btn-secondary btn-sm" style={{ marginTop: "0.75rem" }}>Browse full catalog</Link>}
        />
      )}

      {data && data.length > 0 && (
        <>
          <p style={{ color: "var(--ink-soft)" }}>{data.length} part{data.length !== 1 && "s"} confirmed to fit.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {data.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
