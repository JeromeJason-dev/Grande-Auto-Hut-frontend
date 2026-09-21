const VARIANT = {
  pending: "neutral",
  confirmed: "steel",
  processing: "steel",
  in_transit: "warning",
  delivered: "success",
  cancelled: "danger",
};

const LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderStatusBadge({ status }) {
  return <span className={`badge badge-${VARIANT[status] || "neutral"}`}>{LABEL[status] || status}</span>;
}
