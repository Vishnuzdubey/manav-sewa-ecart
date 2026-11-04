import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardCard from "../components/DashboardCard.jsx";
import DataTable from "../components/DataTable.jsx";
import {
  Package,
  FolderTree,
  Star,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import {
  productsApi,
  categoriesApi,
  ordersApi,
  inventoryApi,
} from "../services/api.js";

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    featured: 0,
    bestSellers: 0,
    lowStock: 0,
    orders: 0,
  });
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, cRes, oRes, lowRes] = await Promise.allSettled([
          productsApi.list(),
          categoriesApi.list(),
          ordersApi.list(),
          inventoryApi.variantsByStatus("low"),
        ]);
        const products =
          (pRes.status === "fulfilled" &&
            (pRes.value.data || pRes.value.items || pRes.value)) ||
          [];
        const categories =
          (cRes.status === "fulfilled" &&
            (cRes.value.data || cRes.value.categories || cRes.value)) ||
          [];
        const ordersList =
          (oRes.status === "fulfilled" &&
            (oRes.value.data || oRes.value.orders || oRes.value)) ||
          [];
        const low =
          (lowRes.status === "fulfilled" &&
            (lowRes.value.data || lowRes.value)) ||
          [];
        const productsArr = Array.isArray(products) ? products : [];
        const catArr = Array.isArray(categories) ? categories : [];
        const ordersArr = Array.isArray(ordersList) ? ordersList : [];
        const lowArr = Array.isArray(low) ? low : [];
        setStats({
          products: productsArr.length,
          categories: catArr.length,
          featured: productsArr.filter((p) => p.featured).length,
          bestSellers: productsArr.filter((p) => p.bestSeller).length,
          lowStock: lowArr.length,
          orders: ordersArr.length,
        });
        setOrders(ordersArr.slice(0, 5));
        setLowStock(lowArr.slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Here's how your store is performing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Products → /products */}
        <Link to="/products" className="block group">
          <DashboardCard
            title="Total Products"
            value={stats.products}
            icon={Package}
            accent="primary"
            linkable
          />
        </Link>

        {/* Categories → /categories */}
        <Link to="/categories" className="block group">
          <DashboardCard
            title="Total Categories"
            value={stats.categories}
            icon={FolderTree}
            accent="info"
            linkable
          />
        </Link>

        {/* Featured → /products (no dedicated route) */}
        <Link to="/products" className="block group">
          <DashboardCard
            title="Featured Products"
            value={stats.featured}
            icon={Star}
            accent="warning"
            linkable
          />
        </Link>

        {/* Best sellers → /products (no dedicated route) */}
        <Link to="/products" className="block group">
          <DashboardCard
            title="Best Sellers"
            value={stats.bestSellers}
            icon={TrendingUp}
            accent="success"
            linkable
          />
        </Link>

        {/* Low stock → /inventory */}
        <Link to="/inventory" className="block group">
          <DashboardCard
            title="Low Stock"
            value={stats.lowStock}
            icon={AlertTriangle}
            accent="danger"
            linkable
          />
        </Link>

        {/* Orders → /orders */}
        <Link to="/orders" className="block group">
          <DashboardCard
            title="Recent Orders"
            value={stats.orders}
            icon={ShoppingCart}
            accent="primary"
            linkable
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Latest Orders
            </h2>
            <Link
              to="/orders"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <DataTable
            loading={loading}
            data={orders}
            columns={[
              {
                key: "id",
                title: "Order ID",
                render: (r) => (
                  <Link
                    to="/orders"
                    className="font-medium hover:text-primary-dark"
                  >
                    #{r.id?.slice(-6)}
                  </Link>
                ),
              },
              {
                key: "customer",
                title: "Customer",
                render: (r) => r.customer?.user?.name || r.customerName || "—",
              },
              {
                key: "items",
                title: "Items",
                render: (r) => r.orderItems?.length ?? 0,
              },
              {
                key: "total",
                title: "Total",
                render: (r) => `₹${r.grandTotal ?? r.amount ?? 0}`,
              },
              {
                key: "status",
                title: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "payment",
                title: "Payment",
                render: (r) => (
                  <div className="text-[11px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {r.paymentType || "—"}
                  </div>
                ),
              },
              {
                key: "date",
                title: "Date",
                render: (r) =>
                  new Date(r.createdAt || Date.now()).toLocaleDateString(),
              },
            ]}
            rowKey="_id"
            emptyText="No recent orders"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Low Stock Alert
            </h2>
            <Link
              to="/inventory"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card p-4 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All stocks healthy ✨
              </p>
            ) : (
              lowStock.map((v, i) => (
                <Link
                  key={i}
                  to="/inventory"
                  className="flex items-center justify-between text-sm hover:bg-surface-2 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <div>
                    <div className="font-medium text-foreground">
                      {v.name || v.sku || "Variant"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.productTitle || v.product?.title}
                    </div>
                  </div>
                  <span className="text-danger font-semibold">
                    {v.stockQty ?? v.stock ?? 0}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pending: "bg-warning/15 text-warning",
    confirmed: "bg-info/15 text-info",
    shipped: "bg-primary/15 text-primary-dark",
    "out-for-delivery": "bg-primary/15 text-primary-dark",
    delivered: "bg-success/15 text-success",
    cancelled: "bg-danger/15 text-danger",
    rejected: "bg-danger/15 text-danger",
  };
  const k = (status || "pending").toLowerCase();
  return (
    <span
      className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full capitalize ${map[k] || "bg-surface-2 text-muted-foreground"}`}
    >
      {k.replace(/-/g, " ")}
    </span>
  );
}
