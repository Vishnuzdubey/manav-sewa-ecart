import { useEffect, useState, useCallback, useRef } from "react";
import DataTable from "../components/DataTable.jsx";
import { ordersApi } from "../services/api.js";
import {
  Search,
  X,
  Package,
  User,
  CreditCard,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Download,
  ShoppingBag,
  CheckCircle,
  Truck,
  RotateCcw,
  TrendingUp,
  Eye,
  MoreHorizontal,
  Filter,
} from "lucide-react";

// ─── Safe helpers ────────────────────────────────────────────────────────────
const str = (v, fallback = "—") => {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "object") return fallback;
  return String(v) || fallback;
};

const num = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

const getItemName = (it) => {
  if (!it) return "Item";
  if (it.variant && typeof it.variant === "object") {
    return (
      str(it.variant.name || it.variant.sku, null) ||
      str(it.productName || it.name || it.title, "Item")
    );
  }
  return str(it.productName || it.name || it.title, "Item");
};

const getItemVariantLabel = (it) => {
  if (!it) return null;
  if (it.variant && typeof it.variant === "object") {
    const v = it.variant;
    const parts = [v.sku, v.mrp != null ? `MRP ₹${num(v.mrp)}` : null].filter(
      Boolean,
    );
    return parts.join(" · ") || null;
  }
  if (it.variant && typeof it.variant === "string") return it.variant;
  return null;
};

const getItemPrice = (it) => {
  if (!it) return 0;
  if (it.variant && typeof it.variant === "object") {
    return num(
      it.sellingPrice ?? it.variant.sellingPrice ?? it.price ?? it.variant.mrp,
    );
  }
  return num(it.sellingPrice ?? it.price);
};

const getItemImage = (it) => {
  if (!it) return null;
  if (
    typeof it.imageUrl === "string" &&
    it.imageUrl &&
    !it.imageUrl.includes("...")
  )
    return it.imageUrl;
  if (it.item?.images?.[0] && !it.item.images[0].includes("..."))
    return it.item.images[0];
  if (typeof it.image === "string" && it.image && !it.image.includes("..."))
    return it.image;
  if (
    it.variant &&
    typeof it.variant === "object" &&
    typeof it.variant.image === "string"
  )
    return it.variant.image;
  return null;
};

const STATUSES = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  // "return_requested",
  // "returned",
  // "refunded",
];

const ORDER_ACTIONS = {
  PROCESSING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  // DELIVERED: ["RETURN_REQUESTED"],
  // RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  // RETURNED: ["REFUNDED"],
};

const ACTION_LABELS = {
  CONFIRMED: "Confirm Order",
  PROCESSING: "Mark Processing",
  SHIPPED: "Mark Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Mark Delivered",
  CANCELLED: "Cancel Order",
  RETURN_REQUESTED: "Accept Return",
  RETURNED: "Mark Returned",
  REFUNDED: "Mark Refunded",
};

const ACTION_STYLES = {
  CONFIRMED: "btn-primary",
  PROCESSING: "btn-primary",
  SHIPPED: "btn-primary",
  OUT_FOR_DELIVERY: "btn-primary",
  DELIVERED: "btn-success",
  CANCELLED: "btn-danger",
  RETURN_REQUESTED: "btn-outline",
  RETURNED: "btn-outline",
  REFUNDED: "btn-outline",
};

const ACTION_API_MAP = {
  CONFIRMED: (api, id) => api.confirm(id),
  PROCESSING: (api, id) => api.process?.(id),
  SHIPPED: (api, id) => api.ship(id),
  OUT_FOR_DELIVERY: (api, id) => api.outForDelivery?.(id),
  DELIVERED: (api, id) => api.deliver?.(id),
  CANCELLED: (api, id) => api.cancel(id),
  // RETURN_REQUESTED: (api, id) => api.returnRequest?.(id),
  // RETURNED: (api, id) => api.markReturned?.(id),
  // REFUNDED: (api, id) => api.refund?.(id),
};

const STATUS_CONFIG = {
  pending: {
    bg: "#FEF3C7",
    text: "#92400E",
    dot: "#F59E0B",
    border: "#FDE68A",
  },
  confirmed: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    dot: "#3B82F6",
    border: "#BFDBFE",
  },
  processing: {
    bg: "#EDE9FE",
    text: "#5B21B6",
    dot: "#7C3AED",
    border: "#DDD6FE",
  },
  shipped: {
    bg: "#E0F2FE",
    text: "#075985",
    dot: "#0EA5E9",
    border: "#BAE6FD",
  },
  out_for_delivery: {
    bg: "#FFEDD5",
    text: "#9A3412",
    dot: "#F97316",
    border: "#FED7AA",
  },
  delivered: {
    bg: "#D1FAE5",
    text: "#065F46",
    dot: "#10B981",
    border: "#A7F3D0",
  },
  cancelled: {
    bg: "#FEE2E2",
    text: "#991B1B",
    dot: "#EF4444",
    border: "#FECACA",
  },
  return_requested: {
    bg: "#FEF3C7",
    text: "#92400E",
    dot: "#F59E0B",
    border: "#FDE68A",
  },
  returned: {
    bg: "#F3F4F6",
    text: "#374151",
    dot: "#9CA3AF",
    border: "#E5E7EB",
  },
  refunded: {
    bg: "#D1FAE5",
    text: "#065F46",
    dot: "#10B981",
    border: "#A7F3D0",
  },
};

const STATUS_OVERVIEW_CARDS = [
  {
    key: "pending",
    label: "Pending",
    Icon: Clock,
    accent: "#F59E0B",
    light: "#FEF3C7",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    Icon: CheckCircle,
    accent: "#3B82F6",
    light: "#DBEAFE",
  },
  {
    key: "processing",
    label: "Processing",
    Icon: TrendingUp,
    accent: "#7C3AED",
    light: "#EDE9FE",
  },
  {
    key: "shipped",
    label: "Shipped",
    Icon: Truck,
    accent: "#0EA5E9",
    light: "#E0F2FE",
  },
  {
    key: "delivered",
    label: "Delivered",
    Icon: ShoppingBag,
    accent: "#10B981",
    light: "#D1FAE5",
  },
  {
    key: "returned",
    label: "Returned",
    Icon: RotateCcw,
    accent: "#9CA3AF",
    light: "#F3F4F6",
  },
];

const PAGE_SIZES = [10, 20, 50];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function OrderStatusBadge({ status }) {
  const s = (status || "").toLowerCase().replace(/-/g, "_");
  const c = STATUS_CONFIG[s] || {
    bg: "#F3F4F6",
    text: "#374151",
    dot: "#9CA3AF",
    border: "#E5E7EB",
  };
  const label = (status || "—").replace(/_/g, " ").replace(/-/g, " ");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        textTransform: "capitalize",
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

// ─── Payment Badge ────────────────────────────────────────────────────────────
function PaymentBadge({ method }) {
  const m = (method || "").toUpperCase();
  const colorMap = {
    COD: { bg: "#FEF3C7", text: "#92400E" },
    CASH: { bg: "#FEF3C7", text: "#92400E" },
    UPI: { bg: "#D1FAE5", text: "#065F46" },
    CARD: { bg: "#DBEAFE", text: "#1E40AF" },
    ONLINE: { bg: "#EDE9FE", text: "#5B21B6" },
  };
  const c = colorMap[m] || { bg: "#F3F4F6", text: "#374151" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: c.bg,
        color: c.text,
      }}
    >
      {m || "—"}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "#6366F1",
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];
  const idx = name ? name.charCodeAt(0) % colors.length : 0;
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        flexShrink: 0,
        background: colors[idx],
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ width, height, radius = 6, style = {} }) {
  return (
    <div
      style={{
        width: width || "100%",
        height: height || 16,
        borderRadius: radius,
        background: "var(--color-background-secondary)",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ filter }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "var(--color-background-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <ShoppingBag
          size={28}
          style={{ color: "var(--color-text-tertiary)" }}
        />
      </div>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--color-text-primary)",
          margin: "0 0 6px",
        }}
      >
        No orders found
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--color-text-tertiary)",
          margin: 0,
          maxWidth: 280,
        }}
      >
        {filter !== "all"
          ? `No orders match the "${filter.replace(/_/g, " ")}" filter.`
          : "No orders match the selected filters."}
      </p>
    </div>
  );
}

// ─── Mobile Order Card ────────────────────────────────────────────────────────
function MobileOrderCard({ order, onView }) {
  const customerName = str(
    order.customer?.user?.name || order.customerName || order.user?.name,
  );
  const total = num(order.grandTotal ?? order.totalAmount ?? order.amount);
  const itemCount = order.orderItems?.length ?? order.items?.length ?? 0;
  const date = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "1px solid var(--color-border-secondary)",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={customerName} />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              {customerName}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 11,
                color: "var(--color-text-tertiary)",
              }}
            >
              #{(order.id || order._id)?.slice(-8).toUpperCase()} · {date}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 10,
          borderTop: "1px solid var(--color-border-tertiary)",
        }}
      >
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--color-text-tertiary)",
              }}
            >
              Amount
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              ₹{total.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--color-text-tertiary)",
              }}
            >
              Items
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {itemCount}
            </p>
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: "var(--color-text-tertiary)",
              }}
            >
              Payment
            </p>
            <div style={{ marginTop: 2 }}>
              <PaymentBadge method={order.paymentType || order.paymentMethod} />
            </div>
          </div>
        </div>
        <button
          onClick={() => onView(order)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 14px",
            borderRadius: 8,
            background: "var(--color-background-secondary)",
            border: "1px solid var(--color-border-secondary)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            color: "var(--color-text-primary)",
          }}
        >
          <Eye size={13} /> View
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Orders() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [drawer, setDrawer] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusCounts, setStatusCounts] = useState({});

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Client-side search on current data
  const [localSearch, setLocalSearch] = useState("");

  const filteredData = localSearch.trim()
    ? data.filter((order) => {
        const q = localSearch.toLowerCase();
        const id = (order.id || order._id || "").toLowerCase();
        const name = (
          order.customer?.user?.name ||
          order.customerName ||
          order.user?.name ||
          ""
        ).toLowerCase();
        const phone = (
          order.customer?.user?.phone ||
          order.phone ||
          ""
        ).toLowerCase();
        const email = (
          order.customer?.user?.email ||
          order.user?.email ||
          ""
        ).toLowerCase();
        const items = order.orderItems || order.items || [];
        const hasProduct = items.some(
          (it) =>
            getItemName(it).toLowerCase().includes(q) ||
            (it.variant?.sku || "").toLowerCase().includes(q),
        );
        return (
          id.includes(q) ||
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          hasProduct
        );
      })
    : data;

  const load = useCallback(async (p = page, l = limit, f = filter) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: p, limit: l };
      if (f !== "all") params.status = f.toUpperCase();
      const res = await ordersApi.list(params);
      const items =
        res?.orders ||
        res?.data?.items ||
        res?.data?.orders ||
        res?.items ||
        (Array.isArray(res?.data) ? res.data : null) ||
        [];
      if (!Array.isArray(items))
        throw new Error("Unexpected response format from server.");
      const pagination = res?.pagination || res?.data?.pagination || {};
      setData(items);
      setTotal(pagination.total ?? items.length);
      setTotalPages(
        pagination.totalPages ??
          (pagination.total ? Math.ceil(pagination.total / l) : 1),
      );
      // Track counts per status from the current page if available
      if (res?.statusCounts || res?.counts) {
        setStatusCounts(res.statusCounts || res.counts || {});
      }
    } catch (e) {
      console.error("Failed to load orders:", e);
      setError(e?.message || "Failed to load orders. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, limit, filter);
    setPage(1);
  }, [filter, limit]);

  useEffect(() => {
    load(page, limit, filter);
  }, [page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(page, limit, filter);
    setRefreshing(false);
  };

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = [
      "Order ID",
      "Customer",
      "Email",
      "Phone",
      "Status",
      "Amount",
      "Payment",
      "Date",
    ];
    const rows = data.map((o) => [
      (o.id || o._id)?.slice(-8).toUpperCase(),
      str(o.customer?.user?.name || o.customerName || o.user?.name),
      str(o.customer?.user?.email || o.user?.email),
      str(o.customer?.user?.phone || o.phone),
      o.status,
      num(o.grandTotal ?? o.totalAmount ?? o.amount),
      str(o.paymentType || o.paymentMethod),
      new Date(o.createdAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCardClick = (status) => {
    setActiveStatus(status);
    setFilter(status);
    setPage(1);
  };

  const handleAction = async (orderId, action) => {
    setActionLoading(action);
    setActionError(null);
    try {
      await ACTION_API_MAP[action]?.(ordersApi, orderId);
      await load(page, limit, filter);
      setDrawer((prev) => (prev ? { ...prev, status: action } : null));
    } catch (e) {
      console.error("Action failed:", e);
      setActionError(
        e?.message || "Failed to update order status. Please try again.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const currentStatus = (drawer?.status || "").toUpperCase().replace(/-/g, "_");
  const availableActions = ORDER_ACTIONS[currentStatus] || [];

  const paginationStart = Math.min((page - 1) * limit + 1, total);
  const paginationEnd = Math.min(page * limit, total);

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes skeleton-pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-success { background:#10B981;color:white;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;justify-content:center;transition:background 0.15s; }
        .btn-success:hover { background:#059669; }
        .btn-success:disabled { opacity:0.5;cursor:not-allowed; }
        .btn-primary { background:#6366F1;color:white;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;justify-content:center;transition:background 0.15s; }
        .btn-primary:hover { background:#4F46E5; }
        .btn-primary:disabled { opacity:0.5;cursor:not-allowed; }
        .btn-danger { background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;justify-content:center;transition:background 0.15s; }
        .btn-danger:hover { background:#FECACA; }
        .btn-danger:disabled { opacity:0.5;cursor:not-allowed; }
        .btn-outline { background:transparent;color:var(--color-text-primary);border:1px solid var(--color-border-secondary);border-radius:8px;padding:9px 16px;font-size:13px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;justify-content:center;transition:background 0.15s; }
        .btn-outline:hover { background:var(--color-background-secondary); }
        .btn-outline:disabled { opacity:0.5;cursor:not-allowed; }
        .pg-btn { border:1px solid var(--color-border-tertiary);background:var(--color-background-primary);color:var(--color-text-primary);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.12s;font-weight:500; }
        .pg-btn:hover:not(:disabled) { background:var(--color-background-secondary);border-color:var(--color-border-primary); }
        .pg-btn:disabled { opacity:0.4;cursor:not-allowed; }
        .pg-num { border:1px solid transparent;background:transparent;color:var(--color-text-secondary);border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer;min-width:36px;text-align:center;transition:all 0.12s;font-weight:500; }
        .pg-num:hover { background:var(--color-background-secondary);color:var(--color-text-primary); }
        .pg-num.active { background:#6366F1;color:white;border-color:#6366F1;font-weight:600; }
        .drawer-section { border-top: 0.5px solid var(--color-border-tertiary); padding-top: 16px; margin-top: 16px; }
        .drawer-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-tertiary); margin-bottom: 10px; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 13px; }
        .detail-row .k { color: var(--color-text-secondary); }
        .detail-row .v { font-weight: 500; color: var(--color-text-primary); text-align: right; max-width: 55%; word-break: break-word; }
        .item-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 8px; background: var(--color-background-secondary); font-size: 13px; }
        .actions-footer { position: sticky; bottom: 0; background: var(--color-background-primary); border-top: 0.5px solid var(--color-border-tertiary); padding: 14px 0 0; margin-top: 8px; }
        .status-filter-bar::-webkit-scrollbar { display:none; }
        .status-filter-bar { -ms-overflow-style:none;scrollbar-width:none; }
        .status-card:hover { transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,0.08)!important; }
        .status-card { transition:all 0.18s ease; }
        .overview-scroll::-webkit-scrollbar { display:none; }
        .overview-scroll { -ms-overflow-style:none;scrollbar-width:none; }
        .action-icon-btn { display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:1px solid var(--color-border-secondary);background:var(--color-background-primary);cursor:pointer;color:var(--color-text-secondary);transition:all 0.12s; }
        .action-icon-btn:hover { background:var(--color-background-secondary);color:var(--color-text-primary); }
      `}</style>

      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: "0 0 4px",
            }}
          >
            Orders Management
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-tertiary)",
              margin: 0,
            }}
          >
            Manage, track, and fulfill customer orders.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid var(--color-border-secondary)",
              background: "var(--color-background-primary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              color: "var(--color-text-primary)",
              opacity: refreshing || loading ? 0.6 : 1,
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? "spin 0.7s linear infinite" : "none",
              }}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid var(--color-border-secondary)",
              background: "var(--color-background-primary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              color: "var(--color-text-primary)",
            }}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Status Overview Cards ── */}
      {/* <div
        className="overview-scroll"
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {STATUS_OVERVIEW_CARDS.map(({ key, label, Icon, accent, light }) => {
          const count =
            statusCounts[key] ?? statusCounts[key.toUpperCase()] ?? null;
          const isActive = activeStatus === key;
          return (
            <button
              key={key}
              className="status-card"
              onClick={() => handleCardClick(key)}
              style={{
                flexShrink: 0,
                minWidth: 130,
                padding: "14px 16px",
                borderRadius: 12,
                background: isActive
                  ? accent
                  : "var(--color-background-primary)",
                border: `1.5px solid ${isActive ? accent : "var(--color-border-secondary)"}`,
                cursor: "pointer",
                textAlign: "left",
                boxShadow: isActive
                  ? `0 4px 12px ${accent}30`
                  : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  marginBottom: 10,
                  background: isActive ? "rgba(255,255,255,0.25)" : light,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  size={16}
                  style={{ color: isActive ? "white" : accent }}
                />
              </div>
              {loading ? (
                <Skeleton width={40} height={22} style={{ marginBottom: 6 }} />
              ) : (
                <p
                  style={{
                    margin: "0 0 3px",
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: isActive ? "white" : "var(--color-text-primary)",
                  }}
                >
                  {count !== null ? count.toLocaleString("en-IN") : "—"}
                </p>
              )}
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  color: isActive
                    ? "rgba(255,255,255,0.85)"
                    : "var(--color-text-secondary)",
                }}
              >
                {label}
              </p>
            </button>
          );
        })}
      </div> */}

      {/* ── Filter Bar + Search ── */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "1px solid var(--color-border-secondary)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Status Pills */}
        <div
          className="status-filter-bar"
          style={{
            display: "flex",
            overflowX: "auto",
            gap: 2,
            padding: "10px 12px",
            borderBottom: "1px solid var(--color-border-tertiary)",
          }}
        >
          {STATUSES.map((s) => {
            const isActive = filter === s;
            const label =
              s === "all"
                ? "All Orders"
                : s.replace(/_/g, " ").replace(/-/g, " ");
            const conf =
              s !== "all"
                ? STATUS_CONFIG[s.toLowerCase().replace(/-/g, "_")]
                : null;
            return (
              <button
                key={s}
                onClick={() => {
                  setFilter(s);
                  setActiveStatus(s);
                  setPage(1);
                }}
                style={{
                  flexShrink: 0,
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background: isActive
                    ? conf
                      ? conf.bg
                      : "#F3F4F6"
                    : "transparent",
                  color: isActive
                    ? conf
                      ? conf.text
                      : "var(--primary)"
                    : "var(--color-text-secondary)",
                  border: isActive
                    ? `1.5px solid ${conf ? conf.border : "#E5E7EB"}`
                    : "1.5px solid transparent",
                  textTransform: "capitalize",
                  transition: "all 0.12s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px", // Adds clean spacing between input and results count
            width: "100%",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
            }}
          >
            {/* Search Icon */}
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted-foreground)", // Updated to match your theme
                pointerEvents: "none",
              }}
            />

            {/* Input Field */}
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by order ID, customer name, phone, or product…"
              style={{
                width: "100%",
                padding: "16px 36px", // Balanced padding to make room for both icons
                borderRadius: "8px",
                border: "1px solid var(--border)", // Updated to match your theme
                background: "var(--surface)", // Updated to use the clean white surface
                fontSize: "14px",
                color: "var(--foreground)", // Updated to match your theme
                outline: "none",
                boxSizing: "border-box",
                fontWeight: 500,
              }}
            />

            {/* Clear Button */}
            {localSearch && (
              <button
                onClick={() => setLocalSearch("")}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted-foreground)", // Updated to match your theme
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Results Counter */}
          {localSearch && (
            <span
              style={{
                fontSize: "13px",
                color: "var(--muted-foreground)", // Updated to match your theme
                whiteSpace: "nowrap",
              }}
            >
              {filteredData.length} result{filteredData.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>{" "}
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 10,
            background: "var(--color-background-danger, #FEF2F2)",
            border: "1px solid var(--color-border-danger, #FECACA)",
            color: "var(--color-text-danger, #B91C1C)",
            fontSize: 13,
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button
            onClick={() => load(page, limit, filter)}
            style={{
              marginLeft: "auto",
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              border: "1px solid var(--color-border-danger, #FECACA)",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              color: "var(--color-text-danger, #B91C1C)",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Mobile Cards ── */}
      <div className="lg:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "var(--color-background-primary)",
                border: "1px solid var(--color-border-secondary)",
                borderRadius: 14,
                padding: "14px 16px",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <Skeleton
                  width={32}
                  height={32}
                  radius={999}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <Skeleton
                    width="60%"
                    height={14}
                    style={{ marginBottom: 6 }}
                  />
                  <Skeleton width="40%" height={12} />
                </div>
                <Skeleton width={80} height={22} radius={999} />
              </div>
              <Skeleton height={1} radius={0} style={{ marginBottom: 12 }} />
              <div style={{ display: "flex", gap: 16 }}>
                <Skeleton width={60} height={36} />
                <Skeleton width={60} height={36} />
                <Skeleton width={60} height={36} />
              </div>
            </div>
          ))
        ) : filteredData.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filteredData.map((order) => (
            <MobileOrderCard
              key={order.id || order._id}
              order={order}
              onView={setDrawer}
            />
          ))
        )}
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden lg:block">
        <DataTable
          loading={loading}
          data={filteredData}
          rowKey="id"
          emptyText={<EmptyState filter={filter} />}
          columns={[
            {
              key: "id",
              title: "Order",
              render: (r) => (
                <div>
                  <button
                    onClick={() => setDrawer(r)}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#6366F1",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "block",
                    }}
                  >
                    #{(r.id || r._id)?.slice(-8).toUpperCase()}
                  </button>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                    }}
                  >
                    {new Date(r.createdAt || Date.now()).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              ),
            },
            {
              key: "customer",
              title: "Customer",
              render: (r) => {
                const name = str(
                  r.customer?.user?.name || r.customerName || r.user?.name,
                );
                const email = str(
                  r.customer?.user?.email || r.user?.email,
                  null,
                );
                const phone = str(r.customer?.user?.phone || r.phone, null);
                return (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 9 }}
                  >
                    <Avatar name={name} />
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {name}
                      </p>
                      {email && (
                        <p
                          style={{
                            margin: "1px 0 0",
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {email}
                        </p>
                      )}
                      {phone && (
                        <p
                          style={{
                            margin: "1px 0 0",
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {phone}
                        </p>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              key: "items",
              title: "Items",
              render: (r) => {
                const items = r.orderItems || r.items || [];
                const first = items[0];
                const extra = items.length - 1;
                if (!first)
                  return (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      —
                    </span>
                  );
                const img = getItemImage(first);
                return (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "1px solid var(--color-border-tertiary)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 7,
                          background: "var(--color-background-secondary)",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid var(--color-border-tertiary)",
                        }}
                      >
                        <Package
                          size={13}
                          style={{ color: "var(--color-text-tertiary)" }}
                        />
                      </div>
                    )}
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--color-text-primary)",
                          maxWidth: 130,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getItemName(first)}
                      </p>
                      {getItemVariantLabel(first) && (
                        <p
                          style={{
                            margin: "1px 0 0",
                            fontSize: 10,
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          {getItemVariantLabel(first)}
                        </p>
                      )}
                      {extra > 0 && (
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: 10,
                            color: "#6366F1",
                            fontWeight: 500,
                          }}
                        >
                          +{extra} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              key: "total",
              title: "Amount",
              render: (r) => {
                const grand = num(r.grandTotal ?? r.totalAmount ?? r.amount);
                const tax = num(r.taxAmount);
                const shipping = num(r.shippingCharge);
                const platformFee = num(r.platformFee);
                const discount = num(r.discountAmount);
                const rewardDiscount = num(r.rewardDiscount);
                const totalDiscount = discount + rewardDiscount;

                return (
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      ₹{grand.toLocaleString("en-IN")}
                    </p>
                    {(shipping > 0 || platformFee > 0 || totalDiscount > 0 || tax > 0) && (
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 10,
                          color: "var(--color-text-tertiary)",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {shipping > 0 && <span>Ship ₹{shipping}</span>}
                        {platformFee > 0 && <span>Fee ₹{platformFee}</span>}
                        {totalDiscount > 0 && (
                          <span style={{ color: "#10B981" }}>−₹{totalDiscount}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              key: "payment",
              title: "Payment",
              render: (r) => (
                <PaymentBadge method={r.paymentType || r.paymentMethod} />
              ),
            },
            {
              key: "address",
              title: "Address",
              render: (r) => {
                const a =
                  r.deliveryAddress || r.shippingAddress || r.address || {};
                const line = [
                  a.flatnumber ? `Flat ${a.flatnumber}` : null,
                  a.city,
                  a.state,
                  a.pincode || a.zip,
                ]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      display: "block",
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {line || "—"}
                  </span>
                );
              },
            },
            {
              key: "date",
              title: "Date",
              render: (r) => (
                <span
                  style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
                >
                  {new Date(r.createdAt || Date.now()).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </span>
              ),
            },
            {
              key: "status",
              title: "Status",
              render: (r) => <OrderStatusBadge status={r.status} />,
            },
            {
              key: "actions",
              title: "Actions",
              render: (r) => (
                <div style={{ display: "flex", gap: 5 }}>
                  <button
                    className="action-icon-btn"
                    onClick={() => setDrawer(r)}
                    title="View Details"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* ── Pagination ── */}
      {(totalPages > 1 || total > 0) && !loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            paddingTop: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{ fontSize: 13, color: "var(--color-text-secondary)" }}
            >
              {total > 0
                ? `Showing ${paginationStart}–${paginationEnd} of ${total} orders`
                : "No orders"}
            </span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                fontSize: 12,
                padding: "5px 8px",
                borderRadius: 8,
                border: "1px solid var(--color-border-secondary)",
                background: "var(--color-background-primary)",
                color: "var(--color-text-primary)",
                cursor: "pointer",
              }}
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                className="pg-btn"
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="First page"
              >
                «
              </button>
              <button
                className="pg-btn"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button
                    key={p}
                    className={`pg-num${page === p ? " active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="pg-btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Next <ChevronRight size={14} />
              </button>
              <button
                className="pg-btn"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                title="Last page"
              >
                »
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Drawer — original layout preserved exactly */}
      {drawer && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}
        >
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.45)" }}
            onClick={() => {
              setDrawer(null);
              setActionError(null);
            }}
          />
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#fff",
              height: "100%",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 20px 14px",
                borderBottom: "0.5px solid var(--color-border-tertiary)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "var(--color-background-primary)",
                zIndex: 2,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-tertiary)",
                    marginBottom: 3,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    fontWeight: 500,
                  }}
                >
                  Order
                </p>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    margin: 0,
                    color: "var(--color-text-primary)",
                  }}
                >
                  #{(drawer.id || drawer._id)?.slice(-8).toUpperCase()}
                </h2>
                <div style={{ marginTop: 8 }}>
                  <OrderStatusBadge status={drawer.status} />
                </div>
              </div>
              <button
                onClick={() => {
                  setDrawer(null);
                  setActionError(null);
                }}
                style={{
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: 8,
                  padding: 6,
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  marginTop: 2,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto" }}>
              {/* Customer */}
              <div style={{ marginBottom: 0 }}>
                <p
                  className="drawer-label"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-tertiary)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <User size={11} /> Customer
                </p>
                <div
                  style={{
                    background: "var(--color-background-secondary)",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      margin: "0 0 2px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {str(
                      drawer.customer?.user?.name ||
                        drawer.customerName ||
                        drawer.user?.name,
                    )}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      margin: "0 0 6px",
                    }}
                  >
                    {str(drawer.customer?.user?.email || drawer.user?.email)}
                  </p>
                  {str(drawer.customer?.user?.phone || drawer.phone, null) && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                        margin: 0,
                      }}
                    >
                      {str(drawer.customer?.user?.phone || drawer.phone)}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery address */}
              {(drawer.deliveryAddress ||
                drawer.shippingAddress ||
                drawer.address) && (
                <div className="drawer-section">
                  <p
                    className="drawer-label"
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--color-text-tertiary)",
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={11} /> Delivery address
                  </p>
                  <div
                    style={{
                      background: "var(--color-background-secondary)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {(() => {
                      const a =
                        drawer.deliveryAddress ||
                        drawer.shippingAddress ||
                        drawer.address ||
                        {};
                      return (
                        [
                          a.flatnumber ? `Flat ${a.flatnumber}` : null,
                          a.line1 || a.street,
                          a.city,
                          a.state,
                          a.pincode || a.zip,
                          a.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Cancel reason (if cancelled) */}
              {drawer.cancelReason && (
                <div className="drawer-section">
                  <p
                    className="drawer-label"
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--color-text-danger, #B91C1C)",
                      marginBottom: 8,
                    }}
                  >
                    Cancel Reason
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                      lineHeight: 1.6,
                      background: "#FEE2E2",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    {drawer.cancelReason}
                  </p>
                </div>
              )}

              {/* Order items */}
              <div className="drawer-section">
                <p
                  className="drawer-label"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-tertiary)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Package size={11} /> Items (
                  {(drawer.orderItems || drawer.items || []).length})
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {(drawer.orderItems || drawer.items || []).length > 0 ? (
                    (drawer.orderItems || drawer.items).map((it, i) => {
                      const imgSrc = getItemImage(it);
                      const variantLabel = getItemVariantLabel(it);
                      const itemPrice = getItemPrice(it);
                      const qty = num(it.quantity, 1) || 1;
                      return (
                        <div key={it.id || it._id || i} className="item-row">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt=""
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 6,
                                  objectFit: "cover",
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 6,
                                  background:
                                    "var(--color-background-tertiary)",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Package
                                  size={14}
                                  style={{
                                    color: "var(--color-text-tertiary)",
                                  }}
                                />
                              </div>
                            )}
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: 500,
                                  fontSize: 13,
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                {getItemName(it)}
                              </p>
                              {variantLabel && (
                                <p
                                  style={{
                                    margin: "2px 0 0",
                                    fontSize: 11,
                                    color: "var(--color-text-tertiary)",
                                  }}
                                >
                                  {variantLabel}
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              textAlign: "right",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 500,
                                fontSize: 13,
                                color: "var(--color-text-primary)",
                              }}
                            >
                              ₹{itemPrice.toLocaleString("en-IN")}
                            </p>
                            <p
                              style={{
                                margin: "2px 0 0",
                                fontSize: 11,
                                color: "var(--color-text-tertiary)",
                              }}
                            >
                              × {qty}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-tertiary)",
                        margin: 0,
                        padding: "8px 0",
                      }}
                    >
                      No item details available.
                    </p>
                  )}
                </div>
              </div>

              {/* Payment & totals */}
              <div className="drawer-section">
                <p
                  className="drawer-label"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-tertiary)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <CreditCard size={11} /> Payment
                </p>
                <div
                  style={{
                    background: "var(--color-background-secondary)",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div className="detail-row">
                    <span className="k">Method</span>
                    <span className="v">
                      {str(drawer.paymentType || drawer.paymentMethod)}
                    </span>
                  </div>
                  {drawer.paymentStatus && (
                    <div className="detail-row">
                      <span className="k">Payment Status</span>
                      <span className="v">{str(drawer.paymentStatus)}</span>
                    </div>
                  )}

                  {/* Items Subtotal */}
                  {(() => {
                    const items = drawer.orderItems || drawer.items || [];
                    const itemsSubtotal = items.reduce(
                      (sum, it) =>
                        sum +
                        (num(it.total) ||
                          num(it.sellingPrice ?? it.price ?? 0) *
                            (num(it.quantity, 1) || 1)),
                      0,
                    );
                    return itemsSubtotal > 0 ? (
                      <div className="detail-row">
                        <span className="k">Items Subtotal</span>
                        <span className="v">
                          ₹{itemsSubtotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    ) : null;
                  })()}

                  {/* Shipping Charge */}
                  {drawer.shippingCharge != null && (
                    <div className="detail-row">
                      <span className="k">Shipping Charge</span>
                      <span className="v">
                        {num(drawer.shippingCharge) > 0
                          ? `+₹${num(drawer.shippingCharge).toLocaleString("en-IN")}`
                          : "Free"}
                      </span>
                    </div>
                  )}

                  {/* Platform Fee */}
                  {drawer.platformFee != null && num(drawer.platformFee) > 0 && (
                    <div className="detail-row">
                      <span className="k">Platform Fee</span>
                      <span className="v">
                        +₹{num(drawer.platformFee).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {/* Tax */}
                  {num(drawer.taxAmount) > 0 && (
                    <div className="detail-row">
                      <span className="k">Tax</span>
                      <span className="v">
                        +₹{num(drawer.taxAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {/* Coupon Discount */}
                  {drawer.couponCode && (
                    <div className="detail-row">
                      <span className="k">Coupon ({drawer.couponCode})</span>
                      <span className="v" style={{ color: "#10B981" }}>
                        −₹{num(drawer.discountAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {!drawer.couponCode && num(drawer.discountAmount) > 0 && (
                    <div className="detail-row">
                      <span className="k">Discount</span>
                      <span className="v" style={{ color: "#10B981" }}>
                        −₹{num(drawer.discountAmount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {/* Reward Points Discount */}
                  {num(drawer.rewardDiscount) > 0 && (
                    <div className="detail-row">
                      <span className="k">
                        Reward Points ({drawer.rewardPointsUsed ?? 0} pts)
                      </span>
                      <span className="v" style={{ color: "#10B981" }}>
                        −₹{num(drawer.rewardDiscount).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      borderTop: "0.5px solid var(--color-border-tertiary)",
                      marginTop: 6,
                      paddingTop: 6,
                    }}
                  >
                    <div className="detail-row">
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        Grand Total
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        ₹
                        {num(
                          drawer.grandTotal ??
                            drawer.totalAmount ??
                            drawer.amount,
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="drawer-section">
                <p
                  className="drawer-label"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-tertiary)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Clock size={11} /> Timeline
                </p>
                <div className="detail-row">
                  <span className="k">Placed</span>
                  <span className="v">
                    {new Date(drawer.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {drawer.updatedAt && drawer.updatedAt !== drawer.createdAt && (
                  <div className="detail-row">
                    <span className="k">Last updated</span>
                    <span className="v">
                      {new Date(drawer.updatedAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {drawer.cancelledAt && (
                  <div className="detail-row">
                    <span className="k">Cancelled</span>
                    <span className="v" style={{ color: "#EF4444" }}>
                      {new Date(drawer.cancelledAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
                {drawer.deliveredAt && (
                  <div className="detail-row">
                    <span className="k">Delivered</span>
                    <span className="v">
                      {new Date(drawer.deliveredAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {drawer.notes && (
                <div className="drawer-section">
                  <p
                    className="drawer-label"
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--color-text-tertiary)",
                      marginBottom: 8,
                    }}
                  >
                    Note
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-secondary)",
                      margin: 0,
                      lineHeight: 1.6,
                      background: "var(--color-background-secondary)",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    {drawer.notes}
                  </p>
                </div>
              )}

              <div style={{ height: availableActions.length > 0 ? 80 : 20 }} />
            </div>

            {/* Sticky action footer */}
            {availableActions.length > 0 && (
              <div
                style={{
                  padding: "12px 20px 20px",
                  borderTop: "0.5px solid var(--color-border-tertiary)",
                  background: "var(--color-background-primary)",
                  flexShrink: 0,
                }}
              >
                {actionError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 8,
                      background: "var(--color-background-danger)",
                      border: "0.5px solid var(--color-border-danger)",
                      color: "var(--color-text-danger)",
                      fontSize: 12,
                      marginBottom: 10,
                    }}
                  >
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span>{actionError}</span>
                    <button
                      onClick={() => setActionError(null)}
                      style={{
                        marginLeft: "auto",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-danger)",
                        padding: 0,
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-tertiary)",
                    marginBottom: 10,
                  }}
                >
                  Update status
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      availableActions.length === 1 ? "1fr" : "repeat(2, 1fr)",
                    gap: 8,
                  }}
                >
                  {availableActions.map((action) => (
                    <button
                      key={action}
                      className={ACTION_STYLES[action] || "btn-outline"}
                      disabled={!!actionLoading}
                      onClick={() =>
                        handleAction(drawer.id || drawer._id, action)
                      }
                      style={{ width: "100%" }}
                    >
                      {actionLoading === action ? (
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            border: "2px solid currentColor",
                            borderTopColor: "transparent",
                            borderRadius: "50%",
                            display: "inline-block",
                            animation: "spin 0.7s linear infinite",
                          }}
                        />
                      ) : (
                        <ArrowRight size={13} />
                      )}
                      {ACTION_LABELS[action] || action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableActions.length === 0 && (
              <div
                style={{
                  padding: "12px 20px 20px",
                  borderTop: "0.5px solid var(--color-border-tertiary)",
                  background: "var(--color-background-primary)",
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-tertiary)",
                    margin: 0,
                    textAlign: "center",
                    padding: "8px 0",
                  }}
                >
                  No further actions available for this order.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
