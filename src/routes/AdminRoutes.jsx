import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout.jsx";
import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Categories from "../pages/Categories.jsx";
import AddCategory from "../pages/AddCategory.jsx";
import EditCategory from "../pages/EditCategory.jsx";
import Products from "../pages/Products.jsx";
import AddProduct from "../pages/AddProduct.jsx";
import ProductDetails from "../pages/ProductDetails.jsx";
import Inventory from "../pages/Inventory.jsx";
import Orders from "../pages/Orders.jsx";
import Coupons from "../pages/Coupons.jsx";
import ShopBanners from "../pages/ShopBanners.jsx";
import EditProduct from "../pages/EditProduct.jsx";
import Charges from "../pages/Charges.jsx";
import { AUTH_TOKEN_KEY } from "../services/api.js";

function RequireAuth({ children }) {
  const token =
    typeof window !== "undefined" && localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/add" element={<AddCategory />} />
        <Route path="/categories/edit/:id" element={<EditCategory />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/products/edit/:id" element={<EditProduct />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/charges" element={<Charges />} />
        <Route path="/settings" element={<Navigate to="/charges" replace />} />
        {/* <Route path="/shop-banners" element={<ShopBanners />} /> */}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
