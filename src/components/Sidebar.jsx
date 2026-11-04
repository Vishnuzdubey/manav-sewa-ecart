import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Boxes,
  ShoppingCart,
  TicketPercent,
  Receipt,
  Image as ImageIcon,
  LogOut,
  X,
} from "lucide-react";
import BrandLogo from "./BrandLogo.jsx";
import { AUTH_TOKEN_KEY } from "../services/api.js";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/categories", label: "Categories", icon: FolderTree },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/coupons", label: "Coupons", icon: TicketPercent },
  { to: "/charges", label: "Charges", icon: Receipt },
  // { to: "/shop-banners", label: "Shop Banners", icon: ImageIcon },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    navigate("/login");
  };
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-9 w-9 rounded-xl" />
            <div>
              <div className="font-semibold text-foreground leading-tight">
                Manav Sewa Ecart
              </div>
              <div className="text-[11px] text-muted-foreground">
                Admin Panel
              </div>
            </div>
          </div>
          <button className="lg:hidden p-1" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-foreground border border-primary/30"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-danger"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
