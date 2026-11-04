import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { authApi } from "../services/api.js";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import BrandLogo from "../components/BrandLogo.jsx";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../services/api.js";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const res = await authApi.signin({
        email: data.email,
        password: data.password,
      });

      const token =
        res?.token ||
        res?.data?.token ||
        res?.accessToken ||
        res?.data?.accessToken;

      const user =
        res?.user || res?.data?.user || res?.owner || res?.data?.owner;

      if (!token) {
        throw new Error("Authentication token not received");
      }

      // Store token exactly as before
      localStorage.setItem(AUTH_TOKEN_KEY, token);

      // Store user details if backend returns them
      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/30 via-primary/10 to-background relative items-center justify-center p-12">
        <div className="max-w-md">
          <BrandLogo className="h-14 w-14 rounded-2xl mb-6" />
          <h1 className="text-4xl font-semibold text-foreground tracking-tight">
            Manav Sewa Ecart Admin
          </h1>
          <p className="mt-3 text-muted-foreground">
            Manage your grocery catalogue, orders, inventory, and customers — all
            in one simple workspace.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 text-sm text-primary-dark">
            <Sparkles className="h-4 w-4" /> Built for fresh, everyday shopping
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="card w-full max-w-md p-8">
          <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back. Please enter your details.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                className="input-field mt-1"
                placeholder="admin@manavsawaecart.com"
                {...register("email")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPwd ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
