import { useEffect, useState } from "react";
import { settingsApi } from "../services/api.js";
import { Save, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";

export default function Charges() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialSettings, setInitialSettings] = useState({
    shippingCharge: 0,
    platformFee: 0,
  });
  const [shippingCharge, setShippingCharge] = useState(0);
  const [platformFee, setPlatformFee] = useState(0);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.get();
      const settings = res?.settings || res?.data || res || {};
      const ship = settings.shippingCharge ?? 0;
      const plat = settings.platformFee ?? 0;
      setInitialSettings({ shippingCharge: ship, platformFee: plat });
      setShippingCharge(ship);
      setPlatformFee(plat);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const hasChanges =
    Number(shippingCharge) !== Number(initialSettings.shippingCharge) ||
    Number(platformFee) !== Number(initialSettings.platformFee);

  const handleReset = () => {
    setShippingCharge(initialSettings.shippingCharge);
    setPlatformFee(initialSettings.platformFee);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const shipVal = Number(shippingCharge);
    const platVal = Number(platformFee);

    if (isNaN(shipVal) || shipVal < 0) {
      toast.error("Please enter a valid shipping charge.");
      return;
    }
    if (isNaN(platVal) || platVal < 0) {
      toast.error("Please enter a valid platform fee.");
      return;
    }

    setSaving(true);
    try {
      const res = await settingsApi.update({
        shippingCharge: shipVal,
        platformFee: platVal,
      });

      const updated = res?.settings || res?.data || { shippingCharge: shipVal, platformFee: platVal };
      const updatedShip = updated.shippingCharge ?? shipVal;
      const updatedPlat = updated.platformFee ?? platVal;

      setInitialSettings({ shippingCharge: updatedShip, platformFee: updatedPlat });
      setShippingCharge(updatedShip);
      setPlatformFee(updatedPlat);
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Charges</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure platform shipping charges and fees.
        </p>
      </div>

      {loading ? (
        <div className="card p-6 h-64 shimmer" />
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Shipping Charge (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground text-sm font-semibold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={shippingCharge}
                onChange={(e) => setShippingCharge(e.target.value)}
                placeholder="0"
                className="input-field pl-8"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Platform Fee (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted-foreground text-sm font-semibold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={platformFee}
                onChange={(e) => setPlatformFee(e.target.value)}
                placeholder="0"
                className="input-field pl-8"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className="btn-outline text-sm inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className="btn-primary text-sm inline-flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
