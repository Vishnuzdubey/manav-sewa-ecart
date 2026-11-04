import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import { productsApi } from "../services/api.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 20, 50];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Build page-number array with ellipsis markers (null = ellipsis) */
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  const addPage = (n) => {
    if (!pages.includes(n)) pages.push(n);
  };
  const addDot = () => {
    if (pages[pages.length - 1] !== null) pages.push(null);
  };

  addPage(1);
  if (current > 4) addDot();
  for (
    let i = Math.max(2, current - 2);
    i <= Math.min(total - 1, current + 2);
    i++
  )
    addPage(i);
  if (current < total - 3) addDot();
  addPage(total);
  return pages;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusPill({ on, labels = ["Active", "Inactive"] }) {
  return on ? (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 999,
        background: "#D1FAE5",
        color: "#065F46",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#10B981",
        }}
      />
      {labels[0]}
    </span>
  ) : (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 999,
        background: "#F3F4F6",
        color: "#6B7280",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "#D1D5DB",
        }}
      />
      {labels[1]}
    </span>
  );
}

function AvailabilityPill({ value }) {
  const ok =
    (value || "").toLowerCase().replace(/[\s-]/g, "") === "instock" ||
    (value || "").toLowerCase().startsWith("in");
  return ok ? (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 999,
        background: "#DBEAFE",
        color: "#1E40AF",
      }}
    >
      In Stock
    </span>
  ) : (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 9px",
        borderRadius: 999,
        background: "#FEE2E2",
        color: "#991B1B",
      }}
    >
      Out of Stock
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Products() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [toggleTarget, setToggleTarget] = useState(null); // { product, nextActive }
  const [toggleLoading, setToggleLoading] = useState(false);

  // ── pagination state ──
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // debounce ref
  const searchTimer = useRef(null);
  const [q, setQ] = useState(""); // debounced query sent to API

  // ── debounce search → reset to page 1 ──
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setQ(val);
      setPage(1);
    }, 350);
  };

  // ── core fetch — always uses explicit args so there's one source of truth ──
  const fetchPage = async (p, l, query) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: p, limit: l };
      if (query) params.search = query;

      const res = await productsApi.list(params);

      const items =
        res?.items ||
        res?.data?.items ||
        res?.data?.products ||
        res?.products ||
        (Array.isArray(res?.data) ? res.data : []);

      if (!Array.isArray(items))
        throw new Error("Unexpected response shape from server.");

      const pg = res?.pagination || res?.data?.pagination || {};
      setData(items);
      setTotal(pg.total ?? items.length);
      setTotalPages(
        pg.totalPages ?? Math.max(1, Math.ceil((pg.total ?? items.length) / l)),
      );
    } catch (e) {
      setError(e?.message || "Failed to load products.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // ── run fetch whenever page / limit / debounced-query changes ──
  useEffect(() => {
    fetchPage(page, limit, q);
  }, [page, limit, q]);

  // ── limit changed → jump back to page 1 ──
  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // ── list / unlist toggle handler ──
  const onConfirmToggle = async () => {
    if (!toggleTarget) return;
    const { product, nextActive } = toggleTarget;
    setToggleLoading(true);
    try {
      const fd = new FormData();
      fd.append("active", String(nextActive));
      fd.append("isActive", String(nextActive));
      await productsApi.update(product.id || product._id, fd);
      setToggleTarget(null);
      await fetchPage(page, limit, q);
    } catch (err) {
      console.error("Failed to update product status:", err);
    } finally {
      setToggleLoading(false);
    }
  };

  const pageRange = buildPageRange(page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="space-y-5">
      <style>{`
        .pg-wrap   { display:flex; align-items:center; gap:4px; flex-wrap:wrap; }
        .pg-btn    { display:inline-flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:0.5px solid var(--color-border-tertiary); background:var(--color-background-primary); color:var(--color-text-primary); font-size:13px; font-weight:500; cursor:pointer; transition:background 0.12s, border-color 0.12s; white-space:nowrap; }
        .pg-btn:hover:not(:disabled) { background:var(--color-background-secondary); }
        .pg-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .pg-num    { display:inline-flex; align-items:center; justify-content:center; min-width:34px; height:34px; padding:0 6px; border-radius:8px; border:0.5px solid transparent; background:transparent; color:var(--color-text-secondary); font-size:13px; font-weight:500; cursor:pointer; transition:all 0.12s; }
        .pg-num:hover  { background:var(--color-background-secondary); color:var(--color-text-primary); border-color:var(--color-border-tertiary); }
        .pg-num.on { background:#6366F1; color:#fff; border-color:#6366F1; font-weight:600; pointer-events:none; }
        .pg-dot    { display:inline-flex; align-items:center; justify-content:center; min-width:28px; font-size:14px; color:var(--color-text-tertiary); user-select:none; }
        .prod-img  { width:44px; height:44px; border-radius:10px; overflow:hidden; background:var(--color-background-secondary); flex-shrink:0; display:flex; align-items:center; justify-content:center; border:0.5px solid var(--color-border-tertiary); }
        .prod-img img { width:100%; height:100%; object-fit:cover; }
        .tag       { display:inline-flex; font-size:10px; font-weight:500; padding:2px 7px; border-radius:999px; background:var(--color-background-secondary); color:var(--color-text-secondary); border:0.5px solid var(--color-border-tertiary); }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `${total} product${total !== 1 ? "s" : ""} in your catalogue`
              : "Manage your grocery and household catalogue."}
          </p>
        </div>
        <Link
          to="/products/add"
          className="btn-primary inline-flex items-center gap-2 w-fit"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>

      {/* ── Toolbar ── */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search products…"
            className="input-field pl-9 w-full"
          />
        </div>
        <select
          value={limit}
          onChange={(e) => handleLimitChange(Number(e.target.value))}
          className="input-field sm:w-36"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} per page
            </option>
          ))}
        </select>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 15px",
            borderRadius: 10,
            background: "var(--color-background-danger)",
            border: "0.5px solid var(--color-border-danger)",
            color: "var(--color-text-danger)",
            fontSize: 13,
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button
            onClick={() => fetchPage(page, limit, q)}
            style={{
              marginLeft: "auto",
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              border: "0.5px solid var(--color-border-danger)",
              borderRadius: 6,
              padding: "3px 10px",
              cursor: "pointer",
              color: "var(--color-text-danger)",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <DataTable
        loading={loading}
        data={data}
        rowKey="id"
        emptyText={q ? `No products matching "${q}"` : "No products yet"}
        columns={[
          {
            key: "img",
            title: "",
            render: (r) => {
              const src =
                (r.images || []).find((u) => u && !u.includes("...")) || null;
              return (
                <div className="prod-img">
                  {src ? (
                    <img src={src} alt={r.title} />
                  ) : (
                    <Package
                      size={18}
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  )}
                </div>
              );
            },
          },
          {
            key: "title",
            title: "Product",
            render: (r) => (
              <div style={{ minWidth: 160 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 500,
                    fontSize: 13,
                    color: "var(--color-text-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  {r.title}
                </p>
                {r.shortDescription && (
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: 11,
                      color: "var(--color-text-tertiary)",
                      lineHeight: 1.4,
                      maxWidth: 240,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {r.shortDescription}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "category",
            title: "Category",
            render: (r) => (
              <span
                style={{
                  fontSize: 12,
                  color: "var(--color-text-secondary)",
                  fontWeight: 500,
                }}
              >
                {r.category?.title || "—"}
              </span>
            ),
          },
          {
            key: "availability",
            title: "Stock",
            render: (r) => <AvailabilityPill value={r.availability} />,
          },
          {
            key: "active",
            title: "Status",
            render: (r) => <StatusPill on={r.isActive !== false && r.active !== false} />,
          },
          {
            key: "featured",
            title: "Featured",
            render: (r) => (
              <StatusPill on={!!r.isFeatured} labels={["Yes", "No"]} />
            ),
          },
          {
            key: "variants",
            title: "Variants",
            render: (r) => (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                }}
              >
                {r._count?.variants ?? 0}
              </span>
            ),
          },
          {
            key: "actions",
            title: "",
            render: (r) => {
              const isActive = r.isActive !== false && r.active !== false;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Link
                    to={`/products/${r.id || r._id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "0.5px solid var(--color-border-tertiary)",
                      color: "var(--color-text-secondary)",
                      background: "transparent",
                    }}
                    title="View Details"
                  >
                    <Eye size={15} />
                  </Link>

                  <button
                    onClick={() =>
                      setToggleTarget({
                        product: r,
                        nextActive: !isActive,
                      })
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 10px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: isActive
                        ? "0.5px solid #FDE68A"
                        : "0.5px solid #A7F3D0",
                      color: isActive ? "#92400E" : "#065F46",
                      background: isActive ? "#FEF3C7" : "#D1FAE5",
                      transition: "all 0.12s",
                    }}
                    title={isActive ? "Unlist Product" : "List Product"}
                  >
                    {isActive ? (
                      <>
                        <EyeOff size={14} /> Unlist
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} /> List
                      </>
                    )}
                  </button>
                </div>
              );
            },
          },
        ]}
      />

      {/* ── Pagination bar ── */}
      {total > 0 && (
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
          {/* Left: count */}
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Showing{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {from}–{to}
            </strong>{" "}
            of{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>
              {total}
            </strong>{" "}
            products
          </span>

          {/* Right: page buttons */}
          {totalPages > 1 && (
            <div className="pg-wrap">
              {/* First + Prev */}
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

              {/* Numbered pages with ellipsis */}
              {pageRange.map((p, i) =>
                p === null ? (
                  <span key={`dot-${i}`} className="pg-dot">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`pg-num${page === p ? " on" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}

              {/* Next + Last */}
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

      {/* Confirmation Modal for List/Unlist */}
      {toggleTarget && (
        <ToggleStatusModal
          target={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onConfirm={onConfirmToggle}
          loading={toggleLoading}
        />
      )}
    </div>
  );
}

function ToggleStatusModal({ target, onClose, onConfirm, loading }) {
  if (!target) return null;
  const { product, nextActive } = target;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <h3 className="text-lg font-semibold text-foreground">
          {nextActive ? "List Product?" : "Unlist Product?"}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {nextActive
            ? `Are you sure you want to list "${product?.title}"? This product will become visible to customers in your store.`
            : `Are you sure you want to unlist "${product?.title}"? This product will be hidden from customers in your store.`}
        </p>

        <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-outline text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={nextActive ? "btn-primary text-sm" : "btn-danger text-sm"}
          >
            {loading
              ? nextActive
                ? "Listing..."
                : "Unlisting..."
              : nextActive
              ? "Yes, List Product"
              : "Yes, Unlist Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
