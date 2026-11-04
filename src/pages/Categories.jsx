import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit } from "lucide-react";
import DataTable from "../components/DataTable.jsx";
import { categoriesApi } from "../services/api.js";

export default function Categories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesApi.list();
      const arr = res?.data || res?.categories || res || [];
      setData(Array.isArray(arr) ? arr : []);
    } catch (err) {
      console.error("Error loading categories:", err);
      setError("Failed to load categories. Please try again later.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = data.filter((c) =>
    (c.title || "").toLowerCase().includes(search.toLowerCase()),
  );
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize your grocery and household product catalogue.
          </p>
        </div>
        <Link
          to="/categories/add"
          className="btn-primary inline-flex items-center gap-2 w-fit"
        >
          <Plus className="h-4 w-4" /> Add Category
        </Link>
      </div>

      <div className="card p-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      <DataTable
        loading={loading}
        data={pageData}
        rowKey="id"
        emptyText="No categories yet"
        columns={[
          {
            key: "image",
            title: "Image",
            render: (r) => (
              <img
                src={r.imageUrl || "https://placehold.co/56"}
                alt={r.title || "Category"}
                className="h-12 w-12 rounded-lg object-cover bg-surface-2"
              />
            ),
          },
          {
            key: "title",
            title: "Title",
            render: (r) => <span className="font-medium">{r.title}</span>,
          },
          {
            key: "description",
            title: "Description",
            render: (r) => (
              <span className="text-muted-foreground line-clamp-1">
                {r.description || "—"}
              </span>
            ),
          },
          {
            key: "status",
            title: "Status",
            render: (r) => (
              <span
                className={`text-[11px] font-medium px-2 py-1 rounded-full ${
                  r.isActive
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {r.isActive ? "Active" : "Inactive"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "Actions",
            render: (r) => (
              <div className="flex items-center gap-2">
                <Link
                  to={`/categories/edit/${r.id}`}
                  className="p-2 rounded-lg hover:bg-surface-2 text-muted-foreground inline-flex items-center justify-center"
                  title="Edit Category"
                >
                  <Edit className="h-4 w-4" />
                </Link>
              </div>
            ),
          },
        ]}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline"
          >
            Previous
          </button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-outline"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
