import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import DeleteModal from "../components/DeleteModal.jsx";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import { productsApi } from "../services/api.js";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [del, setDel] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await productsApi.get(id);
        setP(res?.item || res);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onDelete = async () => {
    setDelLoading(true);
    try {
      await productsApi.remove(id);
      navigate("/products");
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;
  if (!p)
    return (
      <div className="card p-8 text-center text-muted-foreground">
        Product not found
      </div>
    );

  // images is string[], resolve to display-friendly form with featuredImage priority
  const images = (p.images || []).filter(Boolean);
  const primaryImage = p.featuredImage || images[0] || "https://placehold.co/500";
  const thumbImages = p.featuredImage
    ? images.filter((img) => img !== p.featuredImage).slice(0, 4)
    : images.slice(1, 5);

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{p.title}</h1>
          {/* category is not returned by this endpoint — show slug as fallback */}
          {/* {p.slug && <p className="text-sm text-muted-foreground">/{p.slug}</p>} */}
        </div>
        <div className="flex gap-2">
          <button className="btn-outline inline-flex items-center gap-2">
            <Link
              to={`/products/edit/${id}`}
              className="inline-flex items-center gap-2"
            >
              <Edit className="h-4 w-4" /> Edit
            </Link>
          </button>
          <button
            onClick={() => setDel(true)}
            className="btn-danger inline-flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Image panel ── */}
        <div className="card p-4 lg:col-span-1">
          <div className="aspect-square rounded-xl overflow-hidden bg-surface-2 mb-3">
            <img
              src={primaryImage}
              alt={p.title}
              className="w-full h-full object-cover"
            />
          </div>
          {thumbImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {thumbImages.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`${p.title} ${i + 2}`}
                  className="aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Detail panels ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <Section title="Description">
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {p.description || p.shortDescription || "—"}
            </p>
          </Section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Section title="Benefits">
              <Pills items={p.benefits} />
            </Section>
            <Section title="Tags">
              <Pills items={p.tags} />
            </Section>
            <Section title="Inventory">
              <Row k="Availability" v={p.availability} />
              <Row k="Unit" v={p.unit} />
              <Row k="Min. Purchase" v={p.minimumpurchase} />
              <Row k="Featured" v={p.isFeatured ? "Yes" : "No"} />
              <Row k="Best Seller" v={p.isBestSeller ? "Yes" : "No"} />
              <Row k="Active" v={p.isActive !== false ? "Yes" : "No"} />
              <Row k="Bundle" v={p.isBundle ? "Yes" : "No"} />
            </Section>

            <Section title="Ratings">
              <Row k="Avg. Rating" v={p.averageRating ?? "—"} />
              <Row k="Total Reviews" v={p.totalReviews ?? "—"} />
            </Section>

            {p.warranty && (
              <Section title="Warranty">
                <p className="text-sm text-muted-foreground">{p.warranty}</p>
              </Section>
            )}
          </div>

          {/* Variants table */}
          <Section title="Variants">
            {p.variants && p.variants.length > 0 ? (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface-2 text-muted-foreground">
                    <tr>
                      {[
                        "Name",
                        "SKU",
                        "MRP",
                        "Selling",
                        "Stock",
                        "Low Stock",
                        "Default",
                        "Active",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left font-medium px-3 py-2 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.variants.map((v, i) => (
                      <tr key={v.id || i} className="border-t border-border">
                        <td className="px-3 py-2 font-medium whitespace-nowrap">
                          {v.name}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {v.sku}
                        </td>
                        <td className="px-3 py-2">₹{v.mrp}</td>
                        <td className="px-3 py-2">₹{v.sellingPrice}</td>
                        <td className="px-3 py-2">{v.stockQty}</td>
                        <td className="px-3 py-2">{v.lowStockAlert}</td>
                        <td className="px-3 py-2">
                          {v.isDefault ? (
                            <span className="text-xs bg-surface-2 text-foreground px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {v.isActive ? (
                            <span className="text-xs text-green-600 font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No variants found.
              </p>
            )}
          </Section>

          {/* SEO meta — only render if data exists */}
          {(p.metaTitle || p.metaDesc) && (
            <Section title="SEO / Meta">
              {p.metaTitle && <Row k="Meta Title" v={p.metaTitle} />}
              {p.metaDesc && <Row k="Meta Description" v={p.metaDesc} />}
            </Section>
          )}

          {/* How to use & Video Links */}
          {(p.howToUse || p.productYtLink || p.productHowToVidLink) && (
            <Section title="How to Use & Media">
              {p.howToUse && (
                <p className="text-sm text-muted-foreground whitespace-pre-line mb-3">
                  {p.howToUse}
                </p>
              )}
              {p.productYtLink && (
                <div className="text-sm py-1">
                  <span className="text-muted-foreground font-medium">Product Video: </span>
                  <a
                    href={p.productYtLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline hover:opacity-80"
                  >
                    {p.productYtLink}
                  </a>
                </div>
              )}
              {p.productHowToVidLink && (
                <div className="text-sm py-1">
                  <span className="text-muted-foreground font-medium">How To Use Video: </span>
                  <a
                    href={p.productHowToVidLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline hover:opacity-80"
                  >
                    {p.productHowToVidLink}
                  </a>
                </div>
              )}
            </Section>
          )}

          {/* Product Feature Sections */}
          {Array.isArray(p.sections) && p.sections.length > 0 && (
            <Section title="Product Highlights & Sections">
              <div className="space-y-4">
                {p.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="border border-border rounded-xl p-4 bg-surface-2/40 flex flex-col sm:flex-row gap-4 items-start"
                  >
                    {sec.imageUrl && (
                      <img
                        src={sec.imageUrl}
                        alt={sec.title || `Section ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-semibold text-foreground text-sm">
                        {sec.title || `Section #${idx + 1}`}
                      </h4>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {sec.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* FAQs */}
          {Array.isArray(p.faqs) && p.faqs.length > 0 && (
            <Section title="Frequently Asked Questions (FAQs)">
              <div className="space-y-3">
                {p.faqs.map((faq, idx) => (
                  <div
                    key={faq.id || idx}
                    className="border border-border rounded-xl p-4 bg-surface-2/40 space-y-1"
                  >
                    <h4 className="font-semibold text-foreground text-sm flex items-start gap-2">
                      <span className="text-primary">Q:</span> {faq.question}
                    </h4>
                    <p className="text-xs text-muted-foreground pl-5 whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      <DeleteModal
        open={del}
        onClose={() => setDel(false)}
        onConfirm={onDelete}
        loading={delLoading}
        title="Delete product?"
      />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="flex justify-between text-sm py-1 gap-4">
    <span className="text-muted-foreground shrink-0">{k}</span>
    <span className="font-medium text-foreground text-right">{v ?? "—"}</span>
  </div>
);

const Pills = ({ items }) => {
  let list = items;
  if (typeof items === "string") {
    try {
      list = JSON.parse(items);
    } catch {
      list = [items];
    }
  }
  if (!Array.isArray(list) || list.length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((t, i) => (
        <span
          key={i}
          className="text-xs bg-surface-2 text-foreground px-2.5 py-1 rounded-full capitalize"
        >
          {t}
        </span>
      ))}
    </div>
  );
};
