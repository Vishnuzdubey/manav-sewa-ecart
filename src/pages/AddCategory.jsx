import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { categoriesApi } from "../services/api.js";

export default function AddCategory() {
  const { register, handleSubmit } = useForm();
  const [image, setImage] = useState(null);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (image) fd.append("image", image);
      if (banner) fd.append("banner", banner);
      await categoriesApi.create(fd);
      navigate("/categories");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Add Category</h1>
        <p className="text-sm text-muted-foreground">Create a new product category.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Title" required><input className="input-field" placeholder="e.g. Moisturisers" {...register("title")} /></Field>
          <Field label="Sort Order"><input type="number" className="input-field" placeholder="0" {...register("sortOrder")} /></Field>
          <Field label="Meta Title"><input className="input-field" {...register("metaTitle")} /></Field>
          <Field label="Meta Description"><input className="input-field" {...register("metaDesc")} /></Field>
          <div className="sm:col-span-2">
            <Field label="Description"><textarea rows={3} className="input-field" {...register("description")} /></Field>
          </div>
          <UploadBox label="Image" file={image} onChange={setImage} />
          {/* <UploadBox label="Banner" file={banner} onChange={setBanner} /> */}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Create Category"}
          </button>
        </div>
      </form>
    </div>
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

export function UploadBox({ label, file, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <label className="mt-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-surface-2 text-sm text-muted-foreground">
        <Upload className="h-4 w-4" />
        {file ? file.name : "Click to upload"}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e.target.files?.[0])} />
      </label>
      {file && (
        <img src={URL.createObjectURL(file)} alt="preview" className="mt-2 h-20 rounded-lg object-cover" />
      )}
    </div>
  );
}
