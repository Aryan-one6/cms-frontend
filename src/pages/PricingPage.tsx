import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPlans, createOrder, verifyPayment, type Plan } from "@/lib/billing";
import { useSite } from "@/lib/site";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";

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
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [checkoutCoupon, setCheckoutCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [billingMonths, setBillingMonths] = useState(1);
  const termOptions = [
    { label: "Monthly", value: 1 },
    { label: "Quarterly (3 mo)", value: 3 },
    { label: "6 months", value: 6 },
    { label: "Annual (12 mo)", value: 12 },
  ];

  useEffect(() => {
    fetchPlans()
      .then((p) => setPlans(p))
      .catch(() => setError("Unable to load plans"));
  }, []);

  const displayPlans = useMemo<Plan[]>(() => {
    const free: Plan = {
      id: "FREE",
      name: "Free",
      price: 0,
      pricePaise: 0,
      description: "For trying things out",
      features: ["1 website", "Up to 2 posts", "Basic SEO fields", "Email support"],
      siteLimit: 1,
      highlight: "Stay free as long as you like",
    };
    const ordered = ["STARTER", "GROWTH", "PRO", "ENTERPRISE"];
    const sorted = ordered
      .map((id) => plans.find((p) => p.id === id))
      .filter(Boolean) as Plan[];
    return [free, ...sorted];
  }, [plans]);

  function openCheckout(plan: Plan) {
    setCheckoutPlan(plan);
    const code = coupon.trim().toUpperCase();
    setCheckoutCoupon(code);
    setAppliedCoupon(code);
    setBillingMonths(1);
    setCheckoutError("");
    setError("");
    setSuccess("");
  }

  function handleApplyCoupon() {
    const code = (checkoutCoupon || coupon).trim().toUpperCase();
    if (!code) {
      setCheckoutError("Enter a coupon code.");
      setSuccess("");
      return;
    }
    setCheckoutError("");
    setCheckoutCoupon(code);
    setCoupon(code);
    setAppliedCoupon(code);
    setSuccess(`Coupon "${code}" applied for checkout.`);
  }

  function estimatedTotalPaise(plan: Plan, months: number, code?: string) {
    if (!plan) return 0;
    const upper = (code || "").toUpperCase();
    if (upper === "FREE100") return 0;
    if (upper === "ONEINR") {
      const gst = Math.round(100 * 0.18);
      return 100 + gst;
    }
    const base = plan.pricePaise * months;
    const discount = 0; // estimation only; exact discount handled server-side
    const taxedBase = Math.max(0, base - discount);
    const taxes = Math.round(taxedBase * 0.18);
    return taxedBase + taxes;
  }

  async function startCheckout(plan: Plan, appliedCoupon?: string) {
    setError("");
    setSuccess("");
    setCheckoutError("");
    setLoading(true);
    try {
      if (plan.id === "ENTERPRISE" || plan.pricePaise === 0) {
        setSuccess("Thanks for your interest! Contacting sales...");
        window.location.href = "mailto:hello@sapphirecms.com?subject=Enterprise%20plan%20enquiry";
        return;
      }

      const sdkLoaded = await loadRazorpay();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error("Payment window failed to load. Please retry.");
      }
      const orderRes = await createOrder(plan.id, appliedCoupon || undefined, billingMonths);
      if (orderRes.contact) {
        setSuccess("We’ll contact you shortly to finalize your Enterprise plan.");
        setCheckoutPlan(null);
        return;
      }
      if (orderRes.free) {
        setSuccess("Plan activated via coupon.");
        await Promise.allSettled([refresh(), refreshSites()]);
        setCheckoutPlan(null);
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
              planId: plan.id,
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
      rzp.on("payment.failed", (resp: any) => {
        setCheckoutError(resp?.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Checkout failed";
      setError(msg);
      setCheckoutError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 px-6 py-10 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 text-white">
              <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                AI-powered publishing suite
              </div>
              <h1 className="text-3xl font-semibold lg:text-4xl">
                Publish faster. Ship smarter. Grow consistently.
              </h1>
              <p className="max-w-2xl text-slate-200">
                Design, generate, and launch content with built-in AI writing, images, and SEO intelligence. Choose the workspace setup
                that matches your team size and velocity, with search-ready guidance in every plan.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-slate-200 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <div>
                  <p className="font-semibold text-white">No setup needed</p>
                  <p className="text-xs text-slate-200/80">Start publishing in under 5 minutes.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-indigo-300" />
                <div>
                  <p className="font-semibold text-white">AI-first workflow</p>
                  <p className="text-xs text-slate-200/80">Content + images with built-in limits per plan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>}
        {success && <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{success}</div>}

   

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {displayPlans
            .filter((p) => p.id !== "FREE")
            .map((p) => {
              const isEnterprise = p.id === "ENTERPRISE" || p.pricePaise === 0;
              const isPopular = p.id === "GROWTH";
              return (
                <Card
                  key={p.id}
                  className={`relative h-full border-slate-200 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    isPopular ? "border-2 border-indigo-500 shadow-lg" : ""
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 right-4 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
                      Most Popular
                    </span>
                  )}
                  <CardHeader className="space-y-2">
                    <CardTitle className="flex items-center justify-between text-xl">
                      <span>{p.name}</span>
                      {!isEnterprise ? (
                        <span className="text-lg font-semibold text-slate-800">
                          ₹{(p.pricePaise / 100).toLocaleString("en-IN")}
                          <span className="text-xs text-slate-500"> /mo + taxes</span>
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-500">Contact sales</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-slate-600">{p.description}</p>
                    <p className="text-xs font-semibold text-cyan-700">
                      Built-in SEO intelligence: real-time guidance and SERP-aware benchmarks inside the editor.
                    </p>
                    {p.highlight && <p className="text-xs font-medium text-indigo-600">{p.highlight}</p>}
                  </CardHeader>
                  <CardContent className="flex h-full flex-col gap-4">
                    <ul className="space-y-2 text-sm text-slate-700">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${isPopular ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"}`}
                      disabled={loading}
                      onClick={() => openCheckout(p)}
                    >
                      {isEnterprise ? "Contact Sales" : loading ? "Processing..." : "Choose plan"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                Stay Free
              </div>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">For testing</h3>
              <p className="text-sm text-slate-600">
                Test-drive the product with 1 site, 2 posts, SEO fields, and email support. Upgrade only when you’re ready.
              </p>
            </div>
            <div className="flex items-center gap-6 rounded-xl bg-slate-50 px-4 py-3 text-slate-800">
              <div className="text-2xl font-semibold">₹0</div>
              <div className="text-sm leading-tight text-slate-600">
                1 site • 2 posts • SEO basics <br />
                Email support
              </div>
              <Button
                variant="outline"
                className="ml-2"
                onClick={() => setSuccess("You are on the Free plan. Explore features anytime.")}
              >
                Stay on Free
              </Button>
            </div>
          </div>
        </div>

        {checkoutPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Checkout</p>
                  <h3 className="text-lg font-semibold text-slate-900">{checkoutPlan.name}</h3>
                </div>
                <Button variant="ghost" onClick={() => setCheckoutPlan(null)}>
                  Close
                </Button>
              </div>
              <div className="space-y-4 px-5 py-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{checkoutPlan.description}</p>
                  {checkoutPlan.highlight && <p className="text-xs text-indigo-600">{checkoutPlan.highlight}</p>}
                </div>
                {checkoutPlan.pricePaise > 0 ? (
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-800">
                      ₹{(estimatedTotalPaise(checkoutPlan, billingMonths, appliedCoupon) / 100).toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-slate-500">
                      {appliedCoupon ? `Est. with coupon ${appliedCoupon}` : `for ${billingMonths} month(s) incl. taxes`}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-slate-600">Contact sales</div>
                )}
              </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Billing term</p>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={billingMonths}
                    onChange={(e) => setBillingMonths(Number(e.target.value))}
                    disabled={loading}
                  >
                    {termOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Apply coupon</p>
                  <div className="flex gap-2">
                    <Input
                      value={checkoutCoupon}
                      onChange={(e) => setCheckoutCoupon(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button variant="outline" onClick={() => handleApplyCoupon()} disabled={loading}>
                      Apply
                    </Button>
                  </div>
                  {checkoutError && <p className="text-xs text-rose-600">{checkoutError}</p>}
                  {!checkoutError && checkoutCoupon && (
                    <p className="text-xs text-green-600">Coupon "{checkoutCoupon}" will be applied at checkout.</p>
                  )}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <p className="font-semibold">What you get:</p>
                  <ul className="mt-2 space-y-1">
                    {checkoutPlan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <Button variant="ghost" onClick={() => setCheckoutPlan(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                  onClick={() => startCheckout(checkoutPlan, appliedCoupon.trim() || undefined)}
                >
                  {checkoutPlan.pricePaise === 0
                    ? "Contact Sales"
                    : loading
                    ? "Processing..."
                    : `Proceed to pay ₹${(estimatedTotalPaise(checkoutPlan, billingMonths, appliedCoupon) / 100).toLocaleString("en-IN")}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
