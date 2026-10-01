import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../../api/notifications";
import { unwrapList } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";

// Icon + color per notification_type, matching the reference design's
// colored square icons (blue / green / purple / slate).
const TYPE_META = {
  account: {
    label: "Account",
    bg: "bg-purple-100 dark:bg-purple-500/15",
    fg: "text-purple-600 dark:text-purple-300",
    icon: "👤",
  },
  order_update: {
    label: "Ticket",
    bg: "bg-blue-100 dark:bg-blue-500/15",
    fg: "text-blue-600 dark:text-blue-300",
    icon: "🎫",
  },
  ticket_reply: {
    label: "Message",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
    fg: "text-emerald-600 dark:text-emerald-300",
    icon: "💬",
  },
  general: {
    label: "General",
    bg: "bg-slate-100 dark:bg-white/10",
    fg: "text-slate-600 dark:text-slate-300",
    icon: "🔔",
  },
};

function typeMeta(type) {
  return TYPE_META[type] || TYPE_META.general;
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const steps = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secondsInUnit] of steps) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${unit}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.listNotifications });
  const notifications = unwrapList(data);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const markAll = async () => {
    await notificationsApi.markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markOne = async (id) => {
    await notificationsApi.markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        !search ||
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.message?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || n.notification_type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && !n.is_read) ||
        (statusFilter === "read" && n.is_read);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, search, typeFilter, statusFilter]);

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="min-h-full bg-slate-50 p-14 dark:bg-[#0B121F] transition-colors duration-200">
      <div className="w-full">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-[#101B2C] dark:text-slate-300 dark:hover:bg-white/5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101B2C] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
          {/* Mark all as read — pinned to the top-right corner of the card */}
          {hasUnread && (
            <button
              onClick={markAll}
              className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-[#BF9A63] dark:hover:bg-[#AC8855] dark:text-slate-950"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Mark All as Read
            </button>
          )}

          {/* Header */}
          <div className="mb-5 pr-40">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Stay updated with your latest activities and messages
            </p>
          </div>

          {/* Search + filters */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#0B121F] dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#0B121F] dark:text-slate-300 dark:focus:ring-indigo-500/20"
            >
              <option value="all">All statuses</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-[#0B121F] dark:text-slate-300 dark:focus:ring-indigo-500/20"
            >
              <option value="all">All types</option>
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading && (
            <div className="flex justify-center py-16">
              <Spinner label="Loading notifications" />
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-16 dark:border-white/10 dark:bg-white/5">
              <EmptyState
                title="You're all caught up"
                body="New order updates and replies will show up here."
              />
            </div>
          )}

          {/* Table */}
          {!isLoading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    <th className="pb-3 pr-4 font-semibold">Notification</th>
                    <th className="pb-3 pr-4 font-semibold">Type</th>
                    <th className="pb-3 pr-4 font-semibold">Time</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => {
                    const meta = typeMeta(n.notification_type);
                    return (
                      <tr
                        key={n.id}
                        onClick={() => !n.is_read && markOne(n.id)}
                        className={`border-t border-slate-100 transition-colors dark:border-white/10 ${
                          n.is_read
                            ? "hover:bg-slate-50 dark:hover:bg-white/5"
                            : "cursor-pointer bg-indigo-50/60 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/15"
                        }`}
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm ${meta.bg} ${meta.fg}`}
                            >
                              {meta.icon}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.message}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 align-top">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-[#BF9A63]/20 dark:text-[#E8C990]">
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-4 pr-4 align-top text-sm text-slate-500 dark:text-slate-400">
                          {timeAgo(n.created_at)}
                        </td>
                        <td className="py-4 align-top text-sm">
                          <span
                            className={
                              n.is_read
                                ? "text-slate-400 dark:text-slate-500"
                                : "font-semibold text-indigo-600 dark:text-indigo-400"
                            }
                          >
                            {n.is_read ? "read" : "unread"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}