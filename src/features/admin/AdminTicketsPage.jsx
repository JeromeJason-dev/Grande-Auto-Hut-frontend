import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as supportApi from "../../api/support";
import { unwrapList } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";

const STATUS_STYLES = {
  open: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  closed: "bg-[#EDE7DC] text-[#7C7669]",
};

function TicketRow({ ticket }) {
  return (
    <Link
      to={`/support/${ticket.id}`}
      className="flex items-center justify-between rounded-lg border border-[#E7E2D8] bg-white px-4 py-3 transition-colors hover:border-[#BF9A63]/40"
    >
      <span className="text-sm text-[#1E2430]">
        <strong className="font-medium text-[#101B2C]">{ticket.subject}</strong>{" "}
        <span className="text-[#7C7669]">· {ticket.category}</span>
      </span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[ticket.status]}`}
      >
        {ticket.status.replace("_", " ")}
      </span>
    </Link>
  );
}

export default function AdminTicketsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-tickets"], queryFn: supportApi.listTickets });
  const tickets = unwrapList(data);
  const open = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const closed = tickets.filter((t) => t.status === "resolved" || t.status === "closed");

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading tickets" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#101B2C]">Needs attention</h2>
      {open.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#E7E2D8] bg-white px-6 py-10">
          <EmptyState title="No open tickets" body="Nice — the queue is clear." />
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {open.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-[#101B2C]">Resolved / closed</h2>
      <div className="mt-4 flex flex-col gap-2">
        {closed.map((t) => (
          <TicketRow key={t.id} ticket={t} />
        ))}
      </div>
    </div>
  );
}