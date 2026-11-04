import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DataTable from "../components/DataTable.jsx";
import DeleteModal from "../components/DeleteModal.jsx";
import { couponsApi } from "../services/api.js";
import { Plus, Trash2, X, Edit, Truck, Tag, Save } from "lucide-react";
import { toast } from "react-toastify";

// Helper to check if a coupon is active based on backend `status` or `active`
const isCouponActive = (c) => (c?.status ? c.status === "ACTIVE" : c?.active !== false);

export default function Coupons() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {} for create, coupon for edit
  const [freeShipModalOpen, setFreeShipModalOpen] = useState(false);
  const [del, setDel] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await couponsApi.list();
      setData(res?.data || res?.coupons || res || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Separate Free Shipping rule from regular promo coupons
  const freeShippingCoupon = data.find((c) => c.discountType === "FREE_SHIPPING");
  const regularCoupons = data.filter((c) => c.discountType !== "FREE_SHIPPING");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons & Discounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage promotional codes and free shipping thresholds.
          </p>
        </div>
      </div>

      {/* Free Shipping Rule Section */}
      <div className="card p-5 border-l-4 border-l-emerald-500 bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl shrink-0">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  Free Shipping Rule
                </h2>
                {freeShippingCoupon ? (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isCouponActive(freeShippingCoupon)
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCouponActive(freeShippingCoupon) ? "Active" : "Inactive"}
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                    Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {freeShippingCoupon ? (
                  <>
                    Automatically applies free shipping on orders of{" "}
                    <strong className="text-foreground font-semibold">
                      ₹{freeShippingCoupon.minOrderAmount ?? 0}
                    </strong>{" "}
                    or more (
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {freeShippingCoupon.usageLimitPerUser === 1 || freeShippingCoupon.usageLimitPerUser === "1"
                        ? "Only 1 Order Per User"
                        : "Infinite Usage"}
                    </span>
                    ).
                  </>
                ) : (
                  "Set a minimum order threshold to offer free shipping to customers."
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setFreeShipModalOpen(true)}
            className="btn-outline text-sm inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Edit className="h-4 w-4 text-emerald-600" />
            {freeShippingCoupon ? "Configure Threshold" : "Set Free Shipping"}
          </button>
        </div>
      </div>

      {/* Regular Promo Coupons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Promo Coupons</h2>
            <p className="text-xs text-muted-foreground">
              Discount promo codes applied manually by buyers at checkout.
            </p>
          </div>
          <button
            onClick={() => setModal({})}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Coupon
          </button>
        </div>

        <DataTable
          loading={loading}
          data={regularCoupons}
          rowKey="_id"
          emptyText="No promo coupons yet"
          columns={[
            {
              key: "code",
              title: "Code",
              render: (r) => (
                <span className="font-mono font-semibold text-primary-dark flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                  {r.code ? r.code.toUpperCase() : "—"}
                </span>
              ),
            },
            {
              key: "discount",
              title: "Discount",
              render: (r) => {
                switch (r.discountType) {
                  case "PERCENTAGE":
                    return <span className="font-medium text-foreground">{r.discountValue}%</span>;
                  case "FLAT":
                    return <span className="font-medium text-foreground">₹{r.discountValue}</span>;
                  case "BUNDLE":
                    return <span className="font-medium text-foreground">Bundle (₹{r.discountValue || 0})</span>;
                  default:
                    return r.discountValue ?? "—";
                }
              },
            },
            {
              key: "min",
              title: "Min Order",
              render: (r) => `₹${r.minOrderAmount ?? 0}`,
            },
            {
              key: "max",
              title: "Max Discount",
              render: (r) =>
                r.discountType === "PERCENTAGE" && r.maxDiscountAmount
                  ? `₹${r.maxDiscountAmount}`
                  : "—",
            },
            { key: "usage", title: "Limit", render: (r) => r.usageLimit ?? "∞" },
            {
              key: "flags",
              title: "Applicable",
              render: (r) => (
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {r.isFirstOrder && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                      First Order
                    </span>
                  )}
                  {r.isAppOnly && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
                      App Only
                    </span>
                  )}
                  {!r.isFirstOrder && !r.isAppOnly && (
                    <span className="text-muted-foreground">All Orders</span>
                  )}
                </div>
              ),
            },
            {
              key: "status",
              title: "Status",
              render: (r) => {
                const active = isCouponActive(r);
                return (
                  <span
                    className={`text-[11px] px-2 py-1 rounded-full font-medium ${
                      active
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {active ? "Active" : "Inactive"}
                  </span>
                );
              },
            },
            {
              key: "actions",
              title: "Actions",
              render: (r) => (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setModal(r)}
                    className="p-2 rounded-lg hover:bg-surface-2 text-muted-foreground hover:text-foreground"
                    title="Edit Coupon"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDel(r)}
                    className="p-2 rounded-lg hover:bg-danger/10 text-danger"
                    title="Delete Coupon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modal for Regular Coupons */}
      {modal && (
        <CouponModal
          coupon={modal._id || modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await load();
          }}
        />
      )}

      {/* Modal for Free Shipping Rule */}
      {freeShipModalOpen && (
        <FreeShippingModal
          coupon={freeShippingCoupon}
          onClose={() => setFreeShipModalOpen(false)}
          onSaved={async () => {
            setFreeShipModalOpen(false);
            await load();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        open={!!del}
        onClose={() => setDel(null)}
        loading={delLoading}
        title="Delete coupon?"
        description={`Code "${del?.code}" will be removed.`}
        onConfirm={async () => {
          setDelLoading(true);
          try {
            await couponsApi.remove(del.id || del._id);
            setDel(null);
            await load();
          } finally {
            setDelLoading(false);
          }
        }}
      />
    </div>
  );
}

/* Dedicated Free Shipping Threshold Modal */
function FreeShippingModal({ coupon, onClose, onSaved }) {
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.minOrderAmount ?? 0);
  const [usageLimitPerUser, setUsageLimitPerUser] = useState(
    coupon?.usageLimitPerUser === 1 || coupon?.usageLimitPerUser === "1" ? "1" : "infinite"
  );
  const [active, setActive] = useState(isCouponActive(coupon));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const minVal = Number(minOrderAmount);
    if (isNaN(minVal) || minVal < 0) {
      toast.error("Please enter a valid minimum order amount.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: coupon?.code || "FREE_SHIPPING",
        discountType: "FREE_SHIPPING",
        discountValue: 0,
        minOrderAmount: minVal,
        usageLimitPerUser: usageLimitPerUser === "1" ? 1 : null,
        status: active ? "ACTIVE" : "INACTIVE",
        active: active,
        isFirstOrder: false,
        isAppOnly: false,
      };

      if (coupon && (coupon.id || coupon._id)) {
        await couponsApi.update(coupon.id || coupon._id, payload);
      } else {
        await couponsApi.create(payload);
      }
      toast.success("Free shipping rule updated");
      onSaved();
    } catch (err) {
      console.error("Failed to save free shipping rule:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Truck className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-foreground">Free Shipping Rule</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Specify the minimum order total and user usage limits for free shipping.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Minimum Order Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground text-sm font-semibold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                className="input-field pl-8"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="e.g. 500"
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Orders with subtotal ₹{minOrderAmount || 0} will get free shipping.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Usage Limit Per User
            </label>
            <select
              className="input-field"
              value={usageLimitPerUser}
              onChange={(e) => setUsageLimitPerUser(e.target.value)}
            >
              <option value="infinite">Infinite (Unlimited usage per user)</option>
              <option value="1">Only 1 Order Per User</option>
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              {usageLimitPerUser === "1"
                ? "Each customer can only claim free shipping on 1 order."
                : "Customers can claim free shipping on unlimited orders."}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="accent-[color:var(--primary)] h-4 w-4"
            />
            <span>Active</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
            <button type="button" onClick={onClose} className="btn-outline text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-sm inline-flex items-center gap-1.5">
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Modal for Standard Promo Coupons (PERCENTAGE, FLAT, BUNDLE) */
function CouponModal({ coupon, onClose, onSaved }) {
  const isEdit = !!coupon;

  const defaultValues = coupon
    ? {
        ...coupon,
        isFirstOrder: Boolean(coupon.isFirstOrder || coupon.firstOrderOnly),
        isAppOnly: Boolean(coupon.isAppOnly || coupon.appOnly),
        active: isCouponActive(coupon),
      }
    : {
        discountType: "PERCENTAGE",
        isFirstOrder: false,
        isAppOnly: false,
        active: true, // Auto-selected on creation
      };

  const { register, handleSubmit, watch } = useForm({
    defaultValues,
  });
  const [loading, setLoading] = useState(false);

  const selectedType = watch("discountType");

  const submit = async (v) => {
    setLoading(true);
    try {
      const isActive = Boolean(v.active);
      const payload = {
        ...v,
        code: (v.code || "").toString().toUpperCase(),
        maxDiscountAmount:
          v.discountType === "PERCENTAGE" && v.maxDiscountAmount !== "" && v.maxDiscountAmount !== null
            ? Number(v.maxDiscountAmount)
            : null,
        discountValue: v.discountValue !== "" ? Number(v.discountValue) : 0,
        minOrderAmount: v.minOrderAmount ? Number(v.minOrderAmount) : 0,
        usageLimit: v.usageLimit ? Number(v.usageLimit) : null,
        isFirstOrder: Boolean(v.isFirstOrder),
        isAppOnly: Boolean(v.isAppOnly),
        status: isActive ? "ACTIVE" : "INACTIVE",
        active: isActive,
      };

      if (isEdit) {
        await couponsApi.update(coupon.id || coupon._id, payload);
      } else {
        await couponsApi.create(payload);
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {isEdit ? "Edit Coupon" : "New Coupon"}
        </h3>
        <form
          onSubmit={handleSubmit(submit)}
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <F label="Code">
            <input
              className="input-field uppercase font-mono"
              placeholder="e.g. SAVE20"
              {...register("code")}
              required
            />
          </F>
          <F label="Discount Type">
            <select className="input-field" {...register("discountType")}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat Amount</option>
              <option value="BUNDLE">Bundle</option>
            </select>
          </F>

          <F label={selectedType === "PERCENTAGE" ? "Discount (%)" : "Discount Value (₹)"}>
            <input
              type="number"
              min="0"
              step="any"
              className="input-field"
              placeholder="0"
              {...register("discountValue")}
              required
            />
          </F>

          <F label="Min Order Amount (₹)">
            <input
              type="number"
              min="0"
              className="input-field"
              placeholder="0"
              {...register("minOrderAmount")}
            />
          </F>

          {/* Max Discount Amount ONLY shown for PERCENTAGE */}
          {selectedType === "PERCENTAGE" && (
            <F label="Max Discount Amount (₹)">
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="Optional cap"
                {...register("maxDiscountAmount")}
              />
            </F>
          )}

          <F label="Usage Limit">
            <input
              type="number"
              min="1"
              className="input-field"
              placeholder="Unlimited if left empty"
              {...register("usageLimit")}
            />
          </F>

          <div className="sm:col-span-2">
            <F label="Description">
              <textarea
                rows={2}
                className="input-field"
                placeholder="Optional description for users"
                {...register("description")}
              />
            </F>
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("isFirstOrder")}
                className="accent-[color:var(--primary)] h-4 w-4"
              />{" "}
              First Order Only
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("isAppOnly")}
                className="accent-[color:var(--primary)] h-4 w-4"
              />{" "}
              App Only
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                {...register("active")}
                className="accent-[color:var(--primary)] h-4 w-4"
              />{" "}
              Active
            </label>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-border mt-2">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving..." : "Save Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const F = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);
