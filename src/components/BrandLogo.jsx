import { ShoppingBasket } from "lucide-react";

export default function BrandLogo({ className = "" }) {
  return (
    <div
      role="img"
      aria-label="Manav Sewa Ecart logo"
      className={`bg-primary text-white flex items-center justify-center ${className}`}
    >
      <ShoppingBasket className="h-1/2 w-1/2" strokeWidth={2.2} />
    </div>
  );
}
