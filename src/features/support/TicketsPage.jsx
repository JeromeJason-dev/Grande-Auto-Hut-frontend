import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as supportApi from "../../api/support";
import { unwrapList } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";

const STATUS_STYLES = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-[#E7E2D8] text-[#7C7669]",
};

const STATUS_LABEL = { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" };

export default function TicketsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["tickets"], queryFn: supportApi.listTickets });
  const tickets = unwrapList(data);

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#101B2C]">Support</h1>
          <Link
            to="/support/new"
            className="rounded-md bg-[#101B2C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46]"
          >
            New ticket
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner label="Loading tickets" />
          </div>
        )}

        {!isLoading && tickets.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E7E2D8] bg-white px-6 py-16">
            <EmptyState
              title="No tickets yet"
              body="Open a ticket if you need help with an order, product, or payment."
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              to={`/support/${t.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-[#E7E2D8] bg-white p-4 text-[#1E2430] transition-colors hover:border-[#BF9A63]/40 hover:shadow-[0_10px_25px_rgba(16,27,44,0.05)]"
            >
              <div className="min-w-0">
                <strong className="text-[#101B2C]">{t.subject}</strong>
                <div className="mt-0.5 text-sm text-[#7C7669]">
                  {t.message_count} message{t.message_count !== 1 && "s"} ·{" "}
                  {new Date(t.updated_at).toLocaleDateString("en-KE")}
                </div>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[t.status]}`}
              >
                {STATUS_LABEL[t.status]}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}