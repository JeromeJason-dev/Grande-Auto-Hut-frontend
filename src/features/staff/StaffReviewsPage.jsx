import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BadgeCheck, MessageSquareText, Search, Star } from "lucide-react";
import * as reviewsApi from "../../api/reviews";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";
import { Avatar, Badge, Pagination } from "../admin/AdminUi";
import { cardClasses, controlClasses, formatDate, timeAgo } from "../admin/adminConstants";

const PAGE_SIZE = 10;

function Stars({ value, size = "h-4 w-4" }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n} aria-hidden="true" strokeWidth={1.5}
          className={`${size} ${n <= Math.round(value) ? "fill-[#BF9A63] text-[#BF9A63]" : "text-[#D6D0C2] dark:text-[#3A4A65]"}`}
        />
      ))}
    </span>
  );
}

function Summary({ summary, activeRating, onPick }) {
  const total = summary?.total ?? 0;
  return (
    <div className={`${cardClasses} grid gap-6 p-5 sm:grid-cols-[10rem_minmax(0,1fr)]`}>
      <div className="flex flex-col items-start justify-center">
        <p className="text-4xl font-semibold tabular-nums text-[#101B2C] dark:text-white">
          {summary?.average_rating != null ? summary.average_rating.toFixed(1) : "–"}
        </p>
        <Stars value={summary?.average_rating ?? 0} />
        <p className="mt-1 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
          {total} review{total === 1 ? "" : "s"}
        </p>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = summary?.breakdown?.[String(n)] ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const active = String(activeRating) === String(n);
          return (
            <button
              key={n} type="button" onClick={() => onPick(active ? "" : String(n))} aria-pressed={active}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-1 text-xs transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#1B2A42] ${active ? "bg-[#FAF7F2] dark:bg-[#1B2A42]" : ""}`}
            >
              <span className="w-10 text-left font-medium text-[#101B2C] dark:text-white">{n} star</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#EDE7DC] dark:bg-[#25344D]">
                <span className="block h-full rounded-full bg-[#BF9A63]" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-8 text-right tabular-nums text-[#7C7669] dark:text-[#9FA8B8]">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-3">
        <Avatar name={review.customer_name} email={review.customer_email} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Stars value={review.rating} />
            <span className="text-sm font-medium text-[#101B2C] dark:text-white">{review.customer_name}</span>
            {review.verified_purchase && (
              <Badge className="!py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Verified purchase
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
            {review.customer_email}
            {review.order_number && <> · Order {review.order_number}</>}
            {" · "}
            <time dateTime={review.created_at} title={formatDate(review.created_at)}>{timeAgo(review.created_at)}</time>
          </p>
          <p className="mt-2 text-sm">
            <span className="text-[#7C7669] dark:text-[#9FA8B8]">On </span>
            <Link to={`/catalog/${review.product_slug}`} className="font-medium text-[#A9834E] hover:underline dark:text-[#D4AF77]">
              {review.product_name}
            </Link>
            <span className="text-[#7C7669] dark:text-[#9FA8B8]"> · {review.product_sku}</span>
          </p>
          {review.comment ? (
            <p className="mt-2 whitespace-pre-line text-sm text-[#1E2430] dark:text-slate-200">{review.comment}</p>
          ) : (
            <p className="mt-2 text-sm italic text-[#9A9385]">No written comment.</p>
          )}
        </div>
      </div>
    </li>
  );
}

export default function StaffReviewsPage() {
  const [rating, setRating] = useState("");
  const [verified, setVerified] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = {
    rating: rating || undefined,
    verified: verified || undefined,
    q: search.trim() || undefined,
    page,
    page_size: PAGE_SIZE,
  };
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["staff-reviews", params],
    queryFn: () => reviewsApi.listAllReviews(params),
    placeholderData: keepPreviousData,
  });
  const reviews = data?.results ?? [];
  const filtered = Boolean(rating || verified || search.trim());

  const reset = (setter) => (value) => { setter(value); setPage(1); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">Customer reviews</h1>
        <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          What customers are saying about our products. Click a star row to filter.
        </p>
      </div>

      <Summary summary={data?.summary} activeRating={rating} onPick={reset(setRating)} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9385]" />
          <input
            type="search" value={search} onChange={(e) => reset(setSearch)(e.target.value)}
            placeholder="Search product, customer or comment" aria-label="Search reviews" className={`${controlClasses} pl-9`}
          />
        </div>
        <select
          aria-label="Filter by rating" value={rating} onChange={(e) => reset(setRating)(e.target.value)}
          className={`${controlClasses} !w-auto`}
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
        <select
          aria-label="Filter by purchase" value={verified} onChange={(e) => reset(setVerified)(e.target.value)}
          className={`${controlClasses} !w-auto`}
        >
          <option value="">All reviews</option>
          <option value="true">Verified purchases</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {isError && <ErrorAlert message={extractErrorMessage(error, "Couldn't load reviews.")} />}

      <div className={`${cardClasses} overflow-hidden`}>
        {isLoading ? (
          <Spinner label="Loading reviews" />
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <MessageSquareText className="h-8 w-8 text-[#BF9A63]" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm font-medium text-[#101B2C] dark:text-white">
              {filtered ? "No reviews match these filters." : "No reviews yet."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPage={setPage} />
      </div>
    </div>
  );
}