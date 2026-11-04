import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const img =
    product?.images?.[0]?.url || product?.image || "https://placehold.co/300x300?text=No+Image";
  return (
    <Link
      to={`/products/${product._id || product.id}`}
      className="card p-3 hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square rounded-xl overflow-hidden bg-surface-2 mb-3">
        <img src={img} alt={product.title} className="w-full h-full object-cover" />
      </div>
      <h3 className="font-medium text-sm text-foreground line-clamp-1">{product.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
        {product.category?.title || product.categoryName || "Uncategorized"}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-primary-dark">
          ₹{product?.variants?.[0]?.sellingPrice ?? "—"}
        </span>
        {product.featured && (
          <span className="text-[10px] uppercase tracking-wide bg-primary/15 text-primary-dark px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>
    </Link>
  );
}
