import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";
import { productsApi, categoriesApi } from "../services/api.js";

export default function AddProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, control, handleSubmit, watch, setValue } = useForm({
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
      faqs: [{ question: "", answer: "" }],
      sections: [{ title: "", description: "", imageUrl: "" }],
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

  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesApi.list();
        setCategories(res?.data || res?.categories || res || []);
      } catch {}
    })();
  }, []);

  const onSubmit = async (v) => {
    setLoading(true);
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
        if (validFaqs.length > 0) {
          fd.append("faqs", JSON.stringify(validFaqs));
        }
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
        if (validSections.length > 0) {
          fd.append("sections", JSON.stringify(validSections));
        }
      }

      if (featuredImage) {
        fd.append("featuredImage", featuredImage);
      }

      images.forEach((f) => fd.append("images", f));

      // print payload for debugging
      for (let pair of fd.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      await productsApi.create(fd);
      navigate("/products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Add Product</h1>
        <p className="text-sm text-muted-foreground">
          Create a new grocery or household product with variants.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Section title="Basic Information">
          <Grid>
            <Field label="Title" required>
              <input className="input-field" {...register("title")} placeholder="Enter product title" />
            </Field>
            <Field label="Unit" required>
              <select className="input-field" {...register("unit")}>
                <option value="">Select unit</option>
                <option value="PIECE">Piece</option>
                {/* <option value="KG">Kg</option>
                <option value="LITRE">Litre</option>
                <option value="GRAM">Gram</option> */}
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
              <Field label="Short Description (Will be shown on product listing page)">
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
            {/* <Toggle label="Best Seller" {...register("bestSeller")} /> */}
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
                  {customSections.fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => customSections.remove(idx)}
                      className="text-danger p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
                  {faqs.fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => faqs.remove(idx)}
                      className="text-danger p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
          {!featuredImage ? (
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-surface-2 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" /> Upload Featured Image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFeaturedImage(e.target.files[0]);
                  }
                }}
              />
            </label>
          ) : (
            <div className="relative w-36 h-36 border border-border rounded-xl overflow-hidden group">
              <img
                src={URL.createObjectURL(featuredImage)}
                alt="Featured Cover Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setFeaturedImage(null)}
                className="absolute top-2 right-2 bg-danger text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </Section>

        <Section title="Product Images">
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-surface-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" /> Upload product gallery images (1-5)
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => setImages(Array.from(e.target.files || []))}
            />
          </label>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
              {images.map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  className="h-20 w-full object-cover rounded-lg"
                />
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
                      placeholder="0.00"
                      {...register(`variants.${idx}.mrp`)}
                    />
                  </Field>
                  <Field label="Selling Price" required>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.00"
                      {...register(`variants.${idx}.sellingPrice`)}
                    />
                  </Field>
                  <Field label="Cost Price">
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.00"
                      {...register(`variants.${idx}.costPrice`)}
                    />
                  </Field>
                  <Field label="Weight with unit (ml, g, kg, etc.)">
                    <input
                      className="input-field"
                      placeholder="e.g. 100ml"
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
                      placeholder="0"
                      {...register(`variants.${idx}.stockQty`)}
                    />
                  </Field>
                  <Field label="Low Stock Alert">
                    <input
                      type="number"
                      className="input-field"
                      placeholder="10"
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
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Create Product"}
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
