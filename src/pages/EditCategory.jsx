import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, X } from "lucide-react";
import { categoriesApi } from "../services/api.js";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";

export default function EditCategory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [image, setImage] = useState(null);
  const [banner, setBanner] = useState(null);
  const [existingImage, setExistingImage] = useState("");
  const [existingBanner, setExistingBanner] = useState("");

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      title: "",
      description: "",
      sortOrder: "",
      metaTitle: "",
      metaDesc: "",
      isActive: true,
    },
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await categoriesApi.get(id);
        const cat = res?.category || res?.data || res;
        if (!cat || (!cat.id && !cat._id)) {
          setNotFound(true);
          return;
        }

        reset({
          title: cat.title ?? "",
          description: cat.description ?? "",
          sortOrder: cat.sortOrder !== undefined ? String(cat.sortOrder) : "",
          metaTitle: cat.metaTitle ?? "",
          metaDesc: cat.metaDesc ?? "",
          isActive: cat.isActive !== false,
        });

        setExistingImage(cat.imageUrl || "");
        setExistingBanner(cat.bannerUrl || "");
      } catch (err) {
        console.error("Failed to load category details", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, reset]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (k === "isActive") {
          fd.append(k, v ? "true" : "false");
        } else {
          fd.append(k, v ?? "");
        }
      });

      if (image) fd.append("image", image);
      if (banner) fd.append("banner", banner);

      await categoriesApi.update(id, fd);
      navigate("/categories");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  if (notFound) {
    return (
      <div className="card p-8 text-center text-muted-foreground">
        Category not found
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Edit Category</h1>
        <p className="text-sm text-muted-foreground">
          Update category details and media.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title">
            <input className="input-field" {...register("title")} />
          </Field>
          <Field label="Sort Order">
            <input
              type="number"
              className="input-field"
              {...register("sortOrder")}
            />
          </Field>
          <Field label="Meta Title">
            <input className="input-field" {...register("metaTitle")} />
          </Field>
          <Field label="Meta Description">
            <input className="input-field" {...register("metaDesc")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea
                rows={3}
                className="input-field"
                {...register("description")}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[color:var(--primary)]"
                {...register("isActive")}
              />
              Active
            </label>
          </div>

          <UploadBox
            label="Image"
            file={image}
            existingUrl={existingImage}
            onChange={setImage}
            onClearExisting={() => setExistingImage("")}
          />
          {/* <UploadBox
            label="Banner"
            file={banner}
            existingUrl={existingBanner}
            onChange={setBanner}
            onClearExisting={() => setExistingBanner("")}
          /> */}
        </div>

        <div className="flex justify-end gap-2">
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

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function UploadBox({ label, file, existingUrl, onChange, onClearExisting }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <label className="mt-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-surface-2 text-sm text-muted-foreground">
        <Upload className="h-4 w-4" />
        {file ? file.name : "Click to upload new image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0])}
        />
      </label>
      {file ? (
        <div className="relative mt-2 h-20 w-32 rounded-lg overflow-hidden border border-border group">
          <img
            src={URL.createObjectURL(file)}
            alt="New Preview"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 bg-danger text-white rounded-full p-1 opacity-90 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : existingUrl ? (
        <div className="relative mt-2 h-20 w-32 rounded-lg overflow-hidden border border-border group">
          <img
            src={existingUrl}
            alt="Existing Preview"
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={onClearExisting}
            className="absolute top-1 right-1 bg-danger text-white rounded-full p-1 opacity-90 hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
