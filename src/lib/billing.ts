import { api } from "./api";

export type Plan = {
  id: string;
  name: string;
  price: number;
  pricePaise: number;
  description: string;
  features: string[];
  siteLimit?: number | null;
  highlight?: string;
  gst?: number;
  total?: number;
  subtotal?: number;
  discount?: number;
  appliedCoupon?: string | null;
  months?: number;
};

export async function fetchPlans() {
  const res = await api.get("/admin/billing/plans");
  return res.data.plans as Plan[];
}

export async function createOrder(planId: string, coupon?: string, months?: number) {
  const res = await api.post("/admin/billing/order", { planId, coupon, months });
  return res.data as {
    free?: boolean;
    contact?: boolean;
    order?: { id: string; amount: number; currency: string };
    keyId?: string;
    plan: Plan;
  };
}

export async function verifyPayment(payload: {
  planId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const res = await api.post("/admin/billing/verify", payload);
  return res.data;
}
