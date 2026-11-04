import { Menu, Bell, Search, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../services/api.js";

export default function Navbar({ onMenu }) {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.clear();
    navigate("/login");
  };
  return (
    <header className="h-16 bg-white border-b border-border flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-20">
      <button className="lg:hidden p-2 -ml-2" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </button>
      Welcome to Manav Sewa Ecart Admin Dashboard
      <div className="ml-auto flex items-center gap-4">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-danger"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </header>
  );
}
