import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../../api/notifications";
import { unwrapList } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";

const ICON = { account: "👤", order_update: "📦", ticket_reply: "💬", general: "🔔" };

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: notificationsApi.listNotifications });
  const notifications = unwrapList(data);

  const markAll = async () => {
    await notificationsApi.markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markOne = async (id) => {
    await notificationsApi.markNotificationRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#7C7669] transition-colors hover:text-[#101B2C]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#101B2C]">Notifications</h1>
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAll}
              className="text-sm font-medium text-[#A9834E] transition-colors hover:text-[#101B2C]"
            >
              Mark all read
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner label="Loading notifications" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E7E2D8] bg-white px-6 py-16">
            <EmptyState
              title="You're all caught up"
              body="New order updates and replies will show up here."
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markOne(n.id)}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                n.is_read
                  ? "border-[#E7E2D8] bg-white"
                  : "cursor-pointer border-[#BF9A63]/30 bg-[#BF9A63]/10 hover:border-[#BF9A63]/50"
              }`}
            >
              <span className="text-xl">{ICON[n.notification_type] || "🔔"}</span>
              <div className="min-w-0 flex-1">
                <strong className="text-sm text-[#101B2C]">{n.title}</strong>
                <p className="mt-0.5 text-sm text-[#7C7669]">{n.message}</p>
                <span className="mt-1 block text-xs text-[#7C7669]">
                  {new Date(n.created_at).toLocaleString("en-KE")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}