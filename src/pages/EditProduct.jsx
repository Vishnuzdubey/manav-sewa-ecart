import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";
import { productsApi, categoriesApi } from "../services/api.js";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";

// Turn a plain string[] (e.g. p.benefits, p.tags) into the {value: string}[]
// shape useFieldArray expects. Falls back to a single empty row so the
// array always renders at least one input.
function toFieldArrayShape(arr) {
  if (Array.isArray(arr) && arr.length > 0) {
    return arr.filter(Boolean).map((value) => ({ value }));
  }
  return [{ value: "" }];
}

// Normalize a variant coming back from the API into the exact field set
// the form inputs are registered against, so uncontrolled/controlled
// mismatches don't occur and numeric fields aren't passed as undefined.
function toVariantFormShape(v = {}) {
  return {
    _id: v._id || v.id || undefined,
    name: v.name ?? "",
    sku: v.sku ?? "",
    mrp: v.mrp ?? "",
    sellingPrice: v.sellingPrice ?? "",
    costPrice: v.costPrice ?? "",
    weight: v.weight ?? "",
    volume: v.volume ?? "",
    stockQty: v.stockQty ?? "",
    lowStockAlert: v.lowStockAlert ?? "",
    isDefault: Boolean(v.isDefault),
    active:
      v.isActive !== undefined
        ? Boolean(v.isActive)
        : Boolean(v.active ?? true),
  };
}

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  // Existing images already on the product (URLs from the server).
  const [existingImages, setExistingImages] = useState([]);
  // Newly added local files to upload (File objects).
  const [newImages, setNewImages] = useState([]);
  // Featured Image states
  const [featuredImageFile, setFeaturedImageFile] = useState(null);
  const [existingFeaturedImage, setExistingFeaturedImage] = useState("");

  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      title: "",
      slug: "",
      unit: "",
      description: "",
      shortDescription: "",
      categoryId: "",
      featured: false,
      bestSeller: false,
      active: true,
      bundle: false,
      warranty: "",
      availability: "in-stock",
      howToUse: "",
      productYtLink: "",
      productHowToVidLink: "",
      benefits: [{ value: "" }],
      tags: [{ value: "" }],
      faqs: [],
      sections: [],
      variants: [
        {
          name: "",
          sku: "",
          mrp: "",
          sellingPrice: "",
          costPrice: "",
          weight: "",
          volume: "",
          stockQty: "",
          lowStockAlert: "",
          isDefault: true,
          active: true,
        },
      ],
    },
  });

  const benefits = useFieldArray({ control, name: "benefits" });
  const tags = useFieldArray({ control, name: "tags" });
  const variants = useFieldArray({ control, name: "variants" });
  const faqs = useFieldArray({ control, name: "faqs" });
  const customSections = useFieldArray({ control, name: "sections" });

  // Load categories (same as AddProduct).
  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesApi.list();
        setCategories(res?.data || res?.categories || res || []);
      } catch {}
    })();
  }, []);

  // Load the existing product and prefill the form.
  useEffect(() => {
    (async () => {
      setLoadingProduct(true);
      try {
        const res = await productsApi.get(id);
        const p = res?.item || res;
        if (!p || (!p._id && !p.id)) {
          setNotFound(true);
          return;
        }

        reset({
          title: p.title ?? "",
          slug: p.slug ?? "",
          unit: p.unit ?? "",
          description: p.description ?? "",
          shortDescription: p.shortDescription ?? "",
          categoryId: p.categoryId || p.category?._id || p.category?.id || "",
          featured: Boolean(p.isFeatured),
          bestSeller: Boolean(p.isBestSeller),
          active: p.isActive !== false,
          bundle: Boolean(p.isBundle),
          warranty: p.warranty ?? "",
          availability: p.availability || "in-stock",
          howToUse: p.howToUse ?? "",
          productYtLink: p.productYtLink ?? "",
          productHowToVidLink: p.productHowToVidLink ?? "",
          benefits: toFieldArrayShape(p.benefits),
          tags: toFieldArrayShape(p.tags),
          faqs:
            Array.isArray(p.faqs) && p.faqs.length > 0
              ? p.faqs.map((f) => ({
                  question: f.question ?? "",
                  answer: f.answer ?? "",
                }))
              : [],
          sections:
            Array.isArray(p.sections) && p.sections.length > 0
              ? p.sections.map((s) => ({
                  title: s.title ?? "",
                  description: s.description ?? "",
                  imageUrl: s.imageUrl ?? "",
                }))
              : [],
          variants:
            Array.isArray(p.variants) && p.variants.length > 0
              ? p.variants.map(toVariantFormShape)
              : [
                  {
                    name: "",
                    sku: "",
                    mrp: "",
                    sellingPrice: "",
                    costPrice: "",
                    weight: "",
                    volume: "",
                    stockQty: "",
                    lowStockAlert: "",
                    isDefault: true,
                    active: true,
                  },
                ],
        });

        setExistingImages((p.images || []).filter(Boolean));
        setExistingFeaturedImage(p.featuredImage || "");
      } catch {
        setNotFound(true);
      } finally {
        setLoadingProduct(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const removeNewImage = (idx) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (v) => {
    setSaving(true);
    try {
      const fd = new FormData();
      [
        "title",
        "slug",
        "unit",
        "description",
        "shortDescription",
        "categoryId",
        "warranty",
        "availability",
        "howToUse",
        "productYtLink",
        "productHowToVidLink",
      ].forEach((k) => fd.append(k, v[k] ?? ""));

      ["featured", "bestSeller", "active", "bundle"].forEach((k) =>
        fd.append(k, v[k] ? "true" : "false"),
      );

      fd.append(
        "benefits",
        JSON.stringify(v.benefits.map((b) => b.value).filter(Boolean)),
      );
      fd.append(
        "tags",
        JSON.stringify(v.tags.map((b) => b.value).filter(Boolean)),
      );

      fd.append("variants", JSON.stringify(v.variants));

      // Append FAQs if provided
      if (v.faqs && v.faqs.length > 0) {
        const validFaqs = v.faqs
          .filter((f) => f.question?.trim() || f.answer?.trim())
          .map((f, i) => ({
            question: f.question?.trim() || "",
            answer: f.answer?.trim() || "",
            sortOrder: i,
          }));
        fd.append("faqs", JSON.stringify(validFaqs));
      } else {
        fd.append("faqs", JSON.stringify([]));
      }

      // Append Sections if provided
      if (v.sections && v.sections.length > 0) {
        const validSections = [];
        v.sections.forEach((s, i) => {
          if (s.title?.trim() || s.description?.trim() || s.imageUrl?.trim() || s.imageFile) {
            if (s.imageFile) {
              fd.append(`sectionImage_${i}`, s.imageFile);
            }
            validSections.push({
              title: s.title?.trim() || "",
              description: s.description?.trim() || "",
              imageUrl: typeof s.imageUrl === "string" && s.imageUrl.trim() ? s.imageUrl.trim() : null,
              sortOrder: i,
            });
          }
        });
        fd.append("sections", JSON.stringify(validSections));
      } else {
        fd.append("sections", JSON.stringify([]));
      }

      // Append featured image: new uploaded file or existing URL
      if (featuredImageFile) {
        fd.append("featuredImage", featuredImageFile);
      } else if (existingFeaturedImage) {
        fd.append("featuredImage", existingFeaturedImage);
      }

      // Images: keep this as one combined list in the UI, but the API
      // still needs to know which URLs survived vs. which files are new.
      fd.append("existingImages", JSON.stringify(existingImages));
      newImages.forEach((f) => fd.append("images", f));

      // print payload for debugging
      for (let pair of fd.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }
      await productsApi.update(id, fd);
      navigate(`/products/${id}`);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) return <LoadingSkeleton rows={6} />;

  if (notFound) {
    return (
      <div className="card p-8 text-center text-muted-foreground">
        Product not found
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Product</h1>
        <p className="text-sm text-muted-foreground">
          Update this grocery or household product and its variants.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Section title="Basic Information">
          <Grid>
            <Field label="Title" required>
              <input className="input-field" {...register("title")} />
            </Field>
            <Field label="Unit" required>
              <select className="input-field" {...register("unit")}>
                <option value="">Select unit</option>
                <option value="PIECE">Piece</option>
                <option value="KG">Kg</option>
                <option value="LITRE">Litre</option>
                <option value="GRAM">Gram</option>
                <option value="PACK">Pack</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Category">
              <select className="input-field" {...register("categoryId")}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Warranty">
              <input
                className="input-field"
                placeholder="e.g. 1 Year Brand Warranty"
                {...register("warranty")}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Short Description">
                <input
                  className="input-field"
                  {...register("shortDescription")}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Description">
                <textarea
                  rows={4}
                  className="input-field"
                  {...register("description")}
                />
              </Field>
            </div>
          </Grid>
        </Section>

        <Section title="Product Settings">
          <div className="flex flex-wrap gap-5">
            <Toggle label="Featured" {...register("featured")} />
            <Toggle label="Best Seller" {...register("bestSeller")} />
            <Toggle label="Active" {...register("active")} />
            <Toggle label="Bundle" {...register("bundle")} />
          </div>
        </Section>

        <Section title="Additional Details & Videos">
          <Grid>
            <Field label="Availability" required>
              <select className="input-field" {...register("availability")}>
                <option value="in-stock">In Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </Field>
            <Field label="Product Details Video URL (YouTube)">
              <input
                className="input-field"
                placeholder="https://www.youtube.com/watch?v=..."
                {...register("productYtLink")}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="How To Use">
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="Apply evenly on cleansed face..."
                  {...register("howToUse")}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="How To Use Video URL (YouTube)">
                <input
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...register("productHowToVidLink")}
                />
              </Field>
            </div>
          </Grid>
        </Section>

        <Section title="Benefits">
          <ArrayInputs
            items={benefits}
            register={register}
            name="benefits"
            placeholder="e.g. Fresh, premium and locally sourced"
          />
        </Section>
        <Section title="Tags">
          <ArrayInputs
            items={tags}
            register={register}
            name="tags"
            placeholder="e.g. vitamin-c"
          />
        </Section>

        <Section title="Product Feature Sections">
          <div className="space-y-4">
            {customSections.fields.map((field, idx) => (
              <div
                key={field.id}
                className="border border-border rounded-xl p-4 bg-surface-2/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-foreground">
                    Section #{idx + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => customSections.remove(idx)}
                    className="text-danger p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Grid>
                  <Field label="Title">
                    <input
                      className="input-field"
                      placeholder="e.g. Moisture balance for combination skin"
                      {...register(`sections.${idx}.title`)}
                    />
                  </Field>
                  <Field label="Section Image (Upload or URL)">
                    {watch(`sections.${idx}.imageFile`) ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                        <img
                          src={URL.createObjectURL(watch(`sections.${idx}.imageFile`))}
                          alt="Section Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setValue(`sections.${idx}.imageFile`, null)}
                          className="absolute top-1 right-1 bg-danger text-white rounded-full p-1 opacity-90 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : watch(`sections.${idx}.imageUrl`) ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                        <img
                          src={watch(`sections.${idx}.imageUrl`)}
                          alt="Section Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setValue(`sections.${idx}.imageUrl`, "")}
                          className="absolute top-1 right-1 bg-danger text-white rounded-full p-1 opacity-90 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border rounded-lg p-2.5 cursor-pointer hover:bg-surface-2 text-xs text-muted-foreground">
                          <Upload className="h-4 w-4" /> Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setValue(`sections.${idx}.imageFile`, e.target.files[0], {
                                  shouldDirty: true,
                                });
                              }
                            }}
                          />
                        </label>
                        <span className="text-xs text-muted-foreground">or</span>
                        <input
                          className="input-field flex-1"
                          placeholder="https://..."
                          {...register(`sections.${idx}.imageUrl`)}
                        />
                      </div>
                    )}
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Description">
                      <textarea
                        rows={2}
                        className="input-field"
                        placeholder="Detailed section description..."
                        {...register(`sections.${idx}.description`)}
                      />
                    </Field>
                  </div>
                </Grid>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                customSections.append({ title: "", description: "", imageUrl: "" })
              }
              className="btn-outline inline-flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" /> Add Section
            </button>
          </div>
        </Section>

        <Section title="Frequently Asked Questions (FAQs)">
          <div className="space-y-4">
            {faqs.fields.map((field, idx) => (
              <div
                key={field.id}
                className="border border-border rounded-xl p-4 bg-surface-2/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-foreground">
                    FAQ #{idx + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => faqs.remove(idx)}
                    className="text-danger p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <Field label="Question">
                    <input
                      className="input-field"
                      placeholder="e.g. Is this moisturizer suitable for acne-prone skin?"
                      {...register(`faqs.${idx}.question`)}
                    />
                  </Field>
                  <Field label="Answer">
                    <textarea
                      rows={2}
                      className="input-field"
                      placeholder="e.g. Yes, its non-comedogenic formula..."
                      {...register(`faqs.${idx}.answer`)}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => faqs.append({ question: "", answer: "" })}
              className="btn-outline inline-flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" /> Add FAQ
            </button>
          </div>
        </Section>

        <Section title="Featured / Cover Image">
          <p className="text-xs text-muted-foreground mb-3">
            Primary cover image for listing cards & search results.
          </p>
          {featuredImageFile ? (
            <div className="relative w-36 h-36 border border-border rounded-xl overflow-hidden group">
              <img
                src={URL.createObjectURL(featuredImageFile)}
                alt="New Featured Cover Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setFeaturedImageFile(null)}
                className="absolute top-2 right-2 bg-danger text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : existingFeaturedImage ? (
            <div className="relative w-36 h-36 border border-border rounded-xl overflow-hidden group">
              <img
                src={existingFeaturedImage}
                alt="Existing Featured Cover"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setExistingFeaturedImage("")}
                className="absolute top-2 right-2 bg-danger text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-surface-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" /> Upload Featured Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFeaturedImageFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          )}
        </Section>

        <Section title="Product Images">
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-surface-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" /> Upload product images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                setNewImages((prev) => [
                  ...prev,
                  ...Array.from(e.target.files || []),
                ])
              }
            />
          </label>

          {(existingImages.length > 0 || newImages.length > 0) && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
              {existingImages.map((url, i) => (
                <div key={`existing-${i}`} className="relative group">
                  <img
                    src={url}
                    className="h-20 w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {newImages.map((f, i) => (
                <div key={`new-${i}`} className="relative group">
                  <img
                    src={URL.createObjectURL(f)}
                    className="h-20 w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Variants">
          <div className="space-y-4">
            {variants.fields.map((field, idx) => (
              <div
                key={field.id}
                className="border border-border rounded-xl p-4 bg-surface-2/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">
                    Variant #{idx + 1}
                  </h4>
                  {variants.fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => variants.remove(idx)}
                      className="text-danger p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Grid>
                  <Field label="Name" required>
                    <input
                      className="input-field"
                      placeholder="e.g. 50ml, 100g, Standard"
                      {...register(`variants.${idx}.name`)}
                    />
                  </Field>
                  <Field label="SKU (Must be Unique)" required>
                    <input
                      className="input-field"
                      placeholder="e.g. SKU-001"
                      {...register(`variants.${idx}.sku`)}
                    />
                  </Field>
                  <Field label="MRP" required>
                    <input
                      type="number"
                      className="input-field"
                      {...register(`variants.${idx}.mrp`)}
                    />
                  </Field>
                  <Field label="Selling Price" required>
                    <input
                      type="number"
                      className="input-field"
                      {...register(`variants.${idx}.sellingPrice`)}
                    />
                  </Field>
                  <Field label="Cost Price">
                    <input
                      type="number"
                      className="input-field"
                      {...register(`variants.${idx}.costPrice`)}
                    />
                  </Field>
                  <Field label="Weight with unit (ml, g, kg, etc.)">
                    <input
                      className="input-field"
                      {...register(`variants.${idx}.weight`)}
                    />
                  </Field>
                  {/* <Field label="Volume">
                    <input
                      className="input-field"
                      {...register(`variants.${idx}.volume`)}
                    />
                  </Field> */}
                  <Field label="Stock Qty" required>
                    <input
                      type="number"
                      className="input-field"
                      {...register(`variants.${idx}.stockQty`)}
                    />
                  </Field>
                  <Field label="Low Stock Alert">
                    <input
                      type="number"
                      className="input-field"
                      {...register(`variants.${idx}.lowStockAlert`)}
                    />
                  </Field>
                </Grid>
                <div className="flex gap-5 mt-3">
                  {(() => {
                    const variantsValues = watch("variants") || [];
                    const isDefault = variantsValues[idx]?.isDefault;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          const newVariants = (variantsValues || []).map(
                            (v, i) => ({
                              ...v,
                              isDefault: i === idx,
                            }),
                          );
                          setValue("variants", newVariants, {
                            shouldDirty: true,
                          });
                        }}
                        className={`text-sm px-3 py-2 rounded-md transition-colors ${
                          isDefault
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface border border-border"
                        }`}
                      >
                        Default Variant
                      </button>
                    );
                  })()}
                  <Toggle
                    label="Active"
                    {...register(`variants.${idx}.active`)}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                variants.append({
                  name: "",
                  sku: "",
                  mrp: "",
                  sellingPrice: "",
                  costPrice: "",
                  weight: "",
                  volume: "",
                  stockQty: "",
                  lowStockAlert: "",
                  isDefault: false,
                  active: true,
                })
              }
              className="btn-outline inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Add Variant
            </button>
          </div>
        </Section>

        <div className="flex justify-end gap-2 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-outline"
          >
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
  );
}
function Field({ label, children, required }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && (
          <span className="ml-1 text-danger" title="Required">*</span>
        )}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
const Toggle = ({ label, ...rest }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer">
    <input
      type="checkbox"
      className="h-4 w-4 accent-[color:var(--primary)]"
      {...rest}
    />
    {label}
  </label>
);

function ArrayInputs({ items, register, name, placeholder }) {
  return (
    <div className="space-y-2">
      {items.fields.map((f, idx) => (
        <div key={f.id} className="flex gap-2">
          <input
            className="input-field"
            placeholder={placeholder}
            {...register(`${name}.${idx}.value`)}
          />
          {items.fields.length > 1 && (
            <button
              type="button"
              onClick={() => items.remove(idx)}
              className="btn-outline px-3"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => items.append({ value: "" })}
        className="btn-outline inline-flex items-center gap-2 text-sm"
      >
        <Plus className="h-4 w-4" /> Add
      </button>
    </div>
  );
}
