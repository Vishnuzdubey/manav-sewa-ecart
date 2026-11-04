import axios from "axios";
import { toast } from "react-toastify";

export const BASE_URL =
  // (typeof import.meta !== "undefined" && (import.meta.env?.VITE_BASE_URL || import.meta.env?.BASE_URL)) ||
  // (typeof process !== "undefined" && process.env?.BASE_URL) ||
  "https://ecom.manavsewa.tech/api/v1";
export const AUTH_TOKEN_KEY = "manav_sewa_ecart_token";
export const AUTH_USER_KEY = "manav_sewa_ecart_user";


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error.message ||
      "Something went wrong";
    if (status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject({ ...error, message: msg });
  },
);

// Generic request wrapper with toast on error
export const request = async (config, { silent = false, successMsg } = {}) => {
  try {
    const res = await api(config);
    if (successMsg) toast.success(successMsg);
    return res.data;
  } catch (err) {
    if (!silent) toast.error(err.message || "Request failed");
    throw err;
  }
};

// ---------------- AUTH ----------------

export const authApi = {
  signin: async (data) => {
    const response = await axios.post(
      `${BASE_URL}/owner/auth/signin`,
      data
    );

    return response.data;
  },
};

// ---------------- CATEGORIES ----------------
export const categoriesApi = {
  list: (params) => request({ method: "GET", url: "/owner/inventory/categories", params }),
  get: (id) => request({ method: "GET", url: `/owner/inventory/category/${id}` }),
  create: (formData) =>
    request(
      {
        method: "POST",
        url: "/owner/inventory/category",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
      { successMsg: "Category created" },
    ),
  update: (id, formData) =>
    request(
      {
        method: "PUT",
        url: `/owner/inventory/category/${id}`,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
      { successMsg: "Category updated" },
    ),
  remove: (id) =>
    request({ method: "DELETE", url: `/owner/inventory/category/${id}` }, { successMsg: "Deleted" }),
  subcategories: (id) =>
    request({ method: "GET", url: `/owner/inventory/category/${id}/subcategories` }),
  createSubcategory: (id, formData) =>
    request(
      {
        method: "POST",
        url: `/owner/inventory/category/${id}/subcategory`,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
      { successMsg: "Subcategory created" },
    ),
};

// ---------------- PRODUCTS ----------------
export const productsApi = {
  list: (params) => request({ method: "GET", url: "/owner/inventory/items", params }),
  get: (id) => request({ method: "GET", url: `/owner/inventory/item/${id}` }),
  create: (formData) =>
    request(
      {
        method: "POST",
        url: "/owner/inventory/item",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
      { successMsg: "Product created" },
    ),
  update: (id, formData) =>
    console.log("Updating product with ID:", id, "and formData:", formData) ||
    request(
      {
        method: "PUT",
        url: `/owner/inventory/admin/products/${id}`,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
      { successMsg: "Product updated" }
    ),
  remove: (id) =>
    request({ method: "DELETE", url: `/owner/inventory/item/${id}` }, { successMsg: "Deleted" }),
};

// ─── REPLACE the existing inventoryApi block in api.js with this ──────────────

export const inventoryApi = {
  // Legacy — kept for backward compatibility (used by old Inventory page)
  variantsByStatus: (status) =>
    request({ method: "GET", url: `/owner/inventory/inventory/variants/?status=${status}` }),

  // NEW — used by the new Inventory.tsx page
  getVariantsByFilter: (filter) =>
    request({
      method: "GET",
      url: `/owner/inventory/inventory/variants?filter=${filter}`,
    }),

  // NEW — used by the new Inventory.tsx stock adjustment modal
  updateStock: (productId, variantId, data) =>
    request(
      {
        method: "PATCH",
        url: `/owner/inventory/admin/products/${productId}/variants/${variantId}/stock`,
        data,
      },
      {
        successMsg: "Stock updated successfully",
      }
    ),

  // Legacy — kept for backward compatibility
  adjustStock: (productId, variantId, data) =>
    request(
      {
        method: "PATCH",
        url: `/owner/inventory/admin/products/${productId}/variants/${variantId}/stock`,
        data,
      },
      { successMsg: "Stock updated" },
    ),

  stockMovements: (params) =>
    request({ method: "GET", url: "/owner/inventory/inventory/stock-movements", params }),

  variantMovements: (productId, variantId) =>
    request({
      method: "GET",
      url: `/owner/inventory/admin/products/${productId}/variants/${variantId}/stock-movements`,
    }),
};

// ---------------- ORDERS ----------------
export const ordersApi = {
  list: (params) => request({ method: "GET", url: "/owner/orders", params }),
  confirm: (id) =>
    request({ method: "PATCH", url: `/owner/orders/${id}/confirm` }, { successMsg: "Order confirmed" }),
  ship: (id) =>
    request({ method: "PATCH", url: `/owner/orders/${id}/ship` }, { successMsg: "Order shipped" }),
  cancel: (id) =>
    request({ method: "PATCH", url: `/owner/orders/${id}/cancel` }, { successMsg: "Order cancelled" }),
  reject: (id) =>
    request({ method: "PATCH", url: `/owner/orders/${id}/reject` }, { successMsg: "Order rejected" }),
  outForDelivery: (id) =>
    request({ method: "PATCH", url: `/owner/orders/${id}/out-for-delivery` }, { successMsg: "Order marked as out for delivery" }),
  deliver: (id) =>
    request({ method: "PATCH", url: `/owner/orders/${id}/delivered` }, { successMsg: "Order marked as delivered" }),
};

// ---------------- COUPONS ----------------
export const couponsApi = {
  list: () => request({ method: "GET", url: "/owner/coupons" }),
  get: (id) => request({ method: "GET", url: `/owner/coupons/${id}` }),
  create: (data) => request({ method: "POST", url: "/owner/coupons", data }, { successMsg: "Coupon created" }),
  update: (id, data) =>
    request({ method: "PUT", url: `/owner/coupons/${id}`, data }, { successMsg: "Coupon updated" }),
  remove: (id) =>
    request({ method: "DELETE", url: `/owner/coupons/${id}` }, { successMsg: "Coupon deleted" }),
};

// ---------------- SHOP BANNERS ----------------
export const bannersApi = {
  list: () => request({ method: "GET", url: "/owner/inventory/shop-images" }),
  upload: (formData) =>
    request(
      {
        method: "POST",
        url: "/owner/inventory/shop-image",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
      { successMsg: "Banner uploaded" },
    ),
  createOffer: (formData) =>
    request(
      {
        method: "POST",
        url: "/owner/inventory/offer",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      },
      { successMsg: "Offer created" },
    ),
};

// ---------------- SETTINGS & CHARGES ----------------
export const settingsApi = {
  get: () => request({ method: "GET", url: "/owner/settings" }),
  update: (data) =>
    request(
      { method: "PUT", url: "/owner/settings", data },
      { successMsg: "Platform settings updated successfully" }
    ),
};

export default api;
