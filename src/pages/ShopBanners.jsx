import { useEffect, useState } from "react";
import { bannersApi } from "../services/api.js";
import { Upload, Trash2 } from "lucide-react";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";

export default function ShopBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  console.log("Banners:", banners);

  const load = async () => {
    setLoading(true);
    try {
      const res = await bannersApi.list();
      setBanners(res?.data || res?.images || res || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await bannersApi.upload(fd);
      setFile(null);
      await load();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Shop Banners</h1>
        <p className="text-sm text-muted-foreground">
          Manage homepage banners and promotional images.
        </p>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Upload New Banner</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-surface-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            {file ? file.name : "Click to choose an image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </label>
          <button
            onClick={upload}
            disabled={!file || uploading}
            className="btn-primary"
          >
            {uploading ? "Uploading..." : "Upload Banner"}
          </button>
        </div>
        {file && (
          <img
            src={URL.createObjectURL(file)}
            className="mt-3 h-32 rounded-lg object-cover"
          />
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Banner Gallery</h3>
        {loading ? (
          <LoadingSkeleton rows={3} />
        ) : banners.length === 0 ? (
          <div className="card p-12 text-center text-muted-foreground">
            No banners yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banners.map((b, i) => (
              <div
                key={b._id || i}
                className="card overflow-hidden group relative"
              >
                <img
                  src={b.imageurl || b.image}
                  className="w-full h-44 object-cover"
                />
                <button className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg text-danger opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
                {b.title && (
                  <div className="p-3 text-sm font-medium">{b.title}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
