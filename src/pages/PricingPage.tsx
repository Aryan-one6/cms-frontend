import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPlans, createOrder, verifyPayment, type Plan } from "@/lib/billing";
import { useSite } from "@/lib/site";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

async function loadRazorpay() {
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const { refreshSites } = useSite();
  const { admin, refresh } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coupon, setCoupon] = useState("");

  function handleApplyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setError("Enter a coupon code.");
      return;
    }
    setError("");
    setSuccess(`Coupon ${code} will be applied at checkout.`);
    setCoupon(code);
  }

  useEffect(() => {
    fetchPlans()
      .then((p) => setPlans(p))
      .catch(() => setError("Unable to load plans"));
  }, []);

  async function startCheckout(planId: string) {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await loadRazorpay();
      const orderRes = await createOrder(planId, coupon || undefined);
      if (orderRes.free) {
        setSuccess("Plan activated via coupon.");
        await Promise.allSettled([refresh(), refreshSites()]);
        return;
      }
      if (!orderRes.order) {
        throw new Error("Unable to create payment order.");
      }
      const opts = {
        key: orderRes.keyId,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: "Sapphire CMS",
        description: `${orderRes.plan.name} plan`,
        order_id: orderRes.order.id,
        prefill: {
          name: admin?.name,
          email: admin?.email,
        },
        handler: async (resp: any) => {
          try {
            await verifyPayment({
              planId,
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            });
            setSuccess("Payment successful. Plan activated.");
            await Promise.allSettled([refresh(), refreshSites()]);
          } catch (err: any) {
            setError(err?.response?.data?.message || "Payment verification failed");
          }
        },
        theme: { color: "#0891b2" },
      };
      const rzp = new window.Razorpay(opts);
      rzp.open();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Pricing"
          title="Pricing"
          description="Upgrade to unlock more sites and unlimited posts."
          actions={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                placeholder="Coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                className="w-full sm:w-48"
              />
              <Button variant="outline" onClick={handleApplyCoupon} disabled={loading}>
                Apply
              </Button>
            </div>
          }
        />
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}
        {success && <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{success}</div>}

        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const gst = Math.round(p.pricePaise * 0.18);
            const total = p.pricePaise + gst;
            return (
              <Card key={p.id} className="border-cyan-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{p.name}</span>
                    <span className="text-lg font-semibold text-cyan-700">
                      ₹{(total / 100).toFixed(2)} <span className="text-xs text-slate-500">(incl. GST)</span>
                    </span>
                  </CardTitle>
                  <p className="text-sm text-slate-500">{p.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-sm text-slate-700">
                    {p.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading} onClick={() => startCheckout(p.id)}>
                    {loading ? "Processing..." : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
