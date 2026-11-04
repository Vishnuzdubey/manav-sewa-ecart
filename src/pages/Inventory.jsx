import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  PackageX,
  Search,
  RefreshCw,
  Download,
  X,
  ChevronDown,
  Edit3,
  History,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  Clock,
} from "lucide-react";
import { inventoryApi } from "../services/api.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStock(r) {
  return r.stockQty ?? r.quantity ?? 0;
}

// Real API uses "id", not "_id"
function getVariantId(r) {
  return r.id ?? "";
}

// Real API has productId directly on the variant object
function getProductId(r) {
  return r.productId ?? r.product?.id ?? "";
}

function getVariantName(r) {
  return r.name ?? r.variantName ?? "—";
}

function getProductName(r) {
  return r.product?.title ?? r.productTitle ?? "—";
}

function formatDate(val) {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(rows) {
  const headers = [
    "Product",
    "Variant",
    "Variant ID",
    "SKU",
    "Stock",
    "Low Stock Alert",
    "Status",
    "Last Updated",
  ];
  const lines = rows.map((r) => {
    const qty = getStock(r);
    const status =
      qty === 0
        ? "Out of Stock"
        : r.lowStockAlert && qty <= r.lowStockAlert
          ? "Low Stock"
          : "Healthy";
    return [
      getProductName(r),
      getVariantName(r),
      getVariantId(r),
      r.sku ?? "",
      qty,
      r.lowStockAlert ?? "",
      status,
      formatDate(r.updatedAt ?? r.createdAt),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Stock Badge ──────────────────────────────────────────────────────────────

function StockBadge({ qty }) {
  if (qty === 0)
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        {qty}
      </span>
    );
  if (qty <= 10)
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
        {qty}
      </span>
    );
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
      {qty}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ qty, alert }) {
  if (qty === 0)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
        <PackageX className="h-3 w-3" />
        Out of Stock
      </span>
    );
  if (alert && qty <= alert)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
        <AlertTriangle className="h-3 w-3" />
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
      <Package className="h-3 w-3" />
      Healthy
    </span>
  );
}

// ─── Log Type Badge ───────────────────────────────────────────────────────────

function LogTypeBadge({ type }) {
  if (type === "INCREMENT")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <ArrowUp className="h-3 w-3" />
        Increment
      </span>
    );
  if (type === "DECREMENT")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
        <ArrowDown className="h-3 w-3" />
        Decrement
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
      <ArrowLeftRight className="h-3 w-3" />
      Set
    </span>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-4 bg-gray-100 rounded-md animate-pulse w-full" />
          {i === 0 && (
            <div className="h-3 bg-gray-100 rounded-md animate-pulse w-2/3 mt-1.5" />
          )}
        </td>
      ))}
    </tr>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ search }) {
  return (
    <tr>
      <td colSpan={8}>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <PackageX className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            No inventory items found
          </p>
          <p className="text-xs text-gray-400 text-center max-w-xs">
            {search
              ? `No results for "${search}". Try a different search term.`
              : "There are no items in this category right now."}
          </p>
        </div>
      </td>
    </tr>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const accentMap = {
  green: {
    icon: "bg-emerald-100 text-emerald-600",
    count: "text-emerald-700",
    ring: "ring-2 ring-emerald-400",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  yellow: {
    icon: "bg-amber-100 text-amber-600",
    count: "text-amber-700",
    ring: "ring-2 ring-amber-400",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  red: {
    icon: "bg-red-100 text-red-600",
    count: "text-red-700",
    ring: "ring-2 ring-red-400",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

function StatCard({
  icon: Icon,
  label,
  count,
  filter,
  activeFilter,
  accent,
  onClick,
}) {
  const a = accentMap[accent];
  const isActive = activeFilter === filter;
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border p-5 transition-all duration-200 bg-white hover:shadow-md ${
        isActive
          ? `${a.ring} ${a.border} shadow-md`
          : "border-gray-200 shadow-sm hover:border-gray-300"
      }`}
    >
      {isActive && (
        <span
          className={`absolute top-3 right-3 h-2 w-2 rounded-full ${a.dot}`}
        />
      )}
      <div className="flex items-center gap-4">
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${a.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-0.5 ${a.count}`}>{count}</p>
        </div>
      </div>
    </button>
  );
}

// ─── Stock History Drawer ─────────────────────────────────────────────────────

function HistoryDrawer({ variant, allLogs, logsLoading, onClose }) {
  const variantId = getVariantId(variant);

  // Filter logs for this specific variant
  const logs = useMemo(
    () => allLogs.filter((l) => l.variantId === variantId),
    [allLogs, variantId],
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <History className="h-4 w-4 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900">
                Stock History
              </h3>
            </div>
            <p className="text-sm text-gray-500">{getProductName(variant)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400">
                {getVariantName(variant)}
              </span>
              <span className="text-gray-300">·</span>
              <span className="font-mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {variant.sku}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">Current: </span>
              <StockBadge qty={getStock(variant)} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Log list */}
        <div className="flex-1 overflow-y-auto">
          {logsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-100 p-4 space-y-2 animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                No history yet
              </p>
              <p className="text-xs text-gray-400 max-w-xs">
                Stock movements for this variant will appear here after
                adjustments are made.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {logs.map((log, idx) => {
                const isInc = log.type === "INCREMENT";
                const isDec = log.type === "DECREMENT";
                const changeColor = isInc
                  ? "text-emerald-600"
                  : isDec
                    ? "text-red-500"
                    : "text-blue-600";
                const changeSign = isInc ? "+" : isDec ? "−" : "→";

                return (
                  <div
                    key={log.id ?? idx}
                    className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <LogTypeBadge type={log.type} />
                      <span className={`text-sm font-bold ${changeColor}`}>
                        {changeSign} {log.quantityChange}
                      </span>
                    </div>

                    {/* Stock transition */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">Stock:</span>
                      <span className="text-xs font-semibold text-gray-600">
                        {log.previousQty}
                      </span>
                      <ArrowLeftRight className="h-3 w-3 text-gray-300" />
                      <span className="text-xs font-bold text-gray-900">
                        {log.newQty}
                      </span>
                    </div>

                    {/* Note */}
                    {log.note && (
                      <p className="text-xs text-gray-400 mb-2 italic">
                        "{log.note}"
                      </p>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(log.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400 text-center">
            {logs.length} movement{logs.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Adjust Modal ─────────────────────────────────────────────────────────────

const actionLabels = {
  set: "Set stock quantity to",
  increment: "Increase stock by",
  decrement: "Decrease stock by",
};

function AdjustModal({ variant, onClose, onSaved }) {
  const [action, setAction] = useState("set");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const currentStock = getStock(variant);

  const previewStock = () => {
    const q = Number(quantity);
    if (isNaN(q) || quantity === "") return null;
    if (action === "set") return q;
    if (action === "increment") return currentStock + q;
    if (action === "decrement") return Math.max(0, currentStock - q);
    return null;
  };

  const preview = previewStock();

  const handleSubmit = async () => {
    const q = Number(quantity);
    if (!quantity || isNaN(q) || q < 0) return;
    setLoading(true);
    try {
      await inventoryApi.updateStock(
        getProductId(variant),
        getVariantId(variant),
        {
          quantity: q,
          action,
          note: note.trim() || "Manual stock update",
        },
      );
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Adjust Stock
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Update inventory quantity
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Product Info */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wide">
              Product
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {getProductName(variant)}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>
                <span className="font-medium text-gray-600">Variant:</span>{" "}
                {getVariantName(variant)}
              </span>
              {variant.sku && (
                <span>
                  <span className="font-medium text-gray-600">SKU:</span>{" "}
                  {variant.sku}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-500">Current Stock:</span>
              <StockBadge qty={currentStock} />
            </div>
          </div>

          {/* Action */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Action
            </label>
            <div className="relative">
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="set">Set — Replace current quantity</option>
                <option value="increment">Increment — Add to stock</option>
                <option value="decrement">Decrement — Remove from stock</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              {actionLabels[action]}
            </label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            {preview !== null && (
              <p className="text-xs text-gray-500 pt-0.5">
                Stock after update:{" "}
                <span
                  className={`font-semibold ${
                    preview === 0
                      ? "text-red-600"
                      : preview <= 10
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  {preview}
                </span>
              </p>
            )}
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Note{" "}
              <span className="text-gray-400 font-normal normal-case">
                (optional)
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for adjustment..."
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !quantity}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Inventory() {
  const [activeFilter, setActiveFilter] = useState("low");
  const [inventory, setInventory] = useState([]);
  const [counts, setCounts] = useState({ high: 0, low: 0, out_of_stock: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null); // adjust modal
  const [historyVariant, setHistoryVariant] = useState(null); // history drawer
  const [allLogs, setAllLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch all-filter counts ───────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    try {
      const [high, low, out] = await Promise.allSettled([
        inventoryApi.getVariantsByFilter("high"),
        inventoryApi.getVariantsByFilter("low"),
        inventoryApi.getVariantsByFilter("out_of_stock"),
      ]);
      const extract = (res) => {
        if (res.status !== "fulfilled") return 0;
        const v = res.value;
        const arr = Array.isArray(v) ? v : (v?.inventory ?? v?.variants ?? []);
        return arr.length;
      };
      setCounts({
        high: extract(high),
        low: extract(low),
        out_of_stock: extract(out),
      });
    } catch (_) {}
  }, []);

  // ── Fetch active filter inventory ─────────────────────────────────────────
  const fetchInventory = useCallback(async (filter) => {
    setLoading(true);
    try {
      const res = await inventoryApi.getVariantsByFilter(filter);
      // Real API shape: { success, filter, inventory: [...] }
      const arr = Array.isArray(res)
        ? res
        : (res?.inventory ?? res?.variants ?? []);
      setInventory(arr);
    } catch (_) {
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch all stock movement logs (once, cached) ──────────────────────────
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await inventoryApi.stockMovements();
      // Real API shape: { success, logs: [...] }
      const arr = Array.isArray(res) ? res : (res?.logs ?? []);
      setAllLogs(arr);
    } catch (_) {
      setAllLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchInventory(activeFilter);
  }, [activeFilter]);

  const handleFilterChange = (f) => {
    setActiveFilter(f);
    setSearch("");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCounts(),
      fetchInventory(activeFilter),
      fetchLogs(),
    ]);
    setRefreshing(false);
  };

  // After stock save: close modal, refresh everything, re-open history if open
  const handleSaved = async () => {
    const prevHistoryVariant = historyVariant;
    setSelectedVariant(null);
    await Promise.all([
      fetchCounts(),
      fetchInventory(activeFilter),
      fetchLogs(),
    ]);
    // If history drawer was open, keep it open (logs will be refreshed)
    if (prevHistoryVariant) setHistoryVariant(prevHistoryVariant);
  };

  const handleOpenHistory = (row) => {
    setHistoryVariant(row);
  };

  // ── Client-side search ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return inventory;
    const q = search.toLowerCase();
    return inventory.filter(
      (r) =>
        getProductName(r).toLowerCase().includes(q) ||
        getVariantName(r).toLowerCase().includes(q) ||
        (r.sku ?? "").toLowerCase().includes(q),
    );
  }, [inventory, search]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Inventory Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Monitor stock levels, prevent shortages, and manage inventory
              efficiently.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => exportCSV(filtered)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Package}
            label="High Stock"
            count={counts.high}
            filter="high"
            activeFilter={activeFilter}
            accent="green"
            onClick={() => handleFilterChange("high")}
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock"
            count={counts.low}
            filter="low"
            activeFilter={activeFilter}
            accent="yellow"
            onClick={() => handleFilterChange("low")}
          />
          <StatCard
            icon={PackageX}
            label="Out of Stock"
            count={counts.out_of_stock}
            filter="out_of_stock"
            activeFilter={activeFilter}
            accent="red"
            onClick={() => handleFilterChange("out_of_stock")}
          />
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-gray-800 capitalize">
                {activeFilter.replace(/_/g, " ")} Inventory
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                {search ? " matching search" : ""}
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, variant, SKU…"
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-sm placeholder-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
                  {[
                    "Product",
                    "Variant",
                    "SKU",
                    "Current Stock",
                    "Low Stock Alert",
                    "Status",
                    "Last Updated",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : filtered.length === 0 ? (
                  <EmptyState search={search} />
                ) : (
                  filtered.map((row) => {
                    const qty = getStock(row);
                    const vid = getVariantId(row);
                    const logCount = allLogs.filter(
                      (l) => l.variantId === vid,
                    ).length;

                    return (
                      <tr
                        key={vid}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                      >
                        {/* Product */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-900 leading-tight">
                            {getProductName(row)}
                          </p>
                        </td>

                        {/* Variant */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-gray-800">
                            {getVariantName(row)}
                          </p>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                            {row.sku ?? "—"}
                          </span>
                        </td>

                        {/* Stock */}
                        <td className="px-4 py-3.5">
                          <StockBadge qty={qty} />
                        </td>

                        {/* Alert threshold */}
                        <td className="px-4 py-3.5 text-gray-600 text-sm">
                          {row.lowStockAlert ?? "—"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge qty={qty} alert={row.lowStockAlert} />
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-gray-500 text-sm whitespace-nowrap">
                          {formatDate(row.updatedAt ?? row.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedVariant(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition"
                            >
                              <Edit3 className="h-3 w-3" />
                              Adjust
                            </button>
                            <button
                              onClick={() => handleOpenHistory(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition"
                            >
                              <History className="h-3 w-3" />
                              {logCount > 0 ? (
                                <span className="flex items-center gap-1">
                                  Logs
                                  <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">
                                    {logCount}
                                  </span>
                                </span>
                              ) : (
                                "Logs"
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Adjust Modal ── */}
      {selectedVariant && (
        <AdjustModal
          variant={selectedVariant}
          onClose={() => setSelectedVariant(null)}
          onSaved={handleSaved}
        />
      )}

      {/* ── History Drawer ── */}
      {historyVariant && (
        <HistoryDrawer
          variant={historyVariant}
          allLogs={allLogs}
          logsLoading={logsLoading}
          onClose={() => setHistoryVariant(null)}
        />
      )}
    </div>
  );
}
