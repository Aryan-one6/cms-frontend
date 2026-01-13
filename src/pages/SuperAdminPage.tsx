import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Trash2, ShieldCheck, UserCheck, PauseCircle, LogOut, Mail } from "lucide-react";
import { GoogleLogo, GithubLogo } from "@/components/SocialLogos";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  oauthProvider?: "GOOGLE" | "GITHUB" | null;
  role: "SUPER_ADMIN" | "EDITOR";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  _count?: { memberships: number; posts: number };
};

type SiteRow = {
  id: string;
  name: string;
  slug: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  siteDomains?: { id: string; domain: string }[];
  _count?: { posts: number; apiTokens: number; memberships: number };
};

type PostRow = {
  id: string;
  title: string;
  createdAt: string;
  site?: { id: string; name: string };
  author?: { id: string; name: string; email: string };
};

type Metrics = {
  users: number;
  sites: number;
  posts: number;
  activeSubscriptions: number;
  revenuePaise: number;
};

type SubscriptionRow = {
  id: string;
  adminId: string;
  plan: string;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
  admin?: { id: string; name: string; email: string };
};

type CouponRow = {
  id: string;
  code: string;
  amountOffPaise?: number;
  percentOff?: number;
  maxRedemptions?: number | null;
  redeemed?: number;
  expiresAt?: string | null;
  validFrom?: string | null;
  applicablePlans?: string[] | null;
  minOrderPaise?: number | null;
  minMonths?: number | null;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type TabKey = "overview" | "users" | "sites" | "posts" | "coupons";

type CouponPayload = {
  code: string;
  active: boolean;
  amountOffPaise?: number;
  percentOff?: number;
  maxRedemptions?: number;
  expiresAt?: string;
  validFrom?: string;
  applicablePlans?: string[];
  minOrderPaise?: number;
  minMonths?: number;
  notes?: string;
};

const PLAN_OPTIONS = ["STARTER", "GROWTH", "PRO", "ENTERPRISE"];

export default function SuperAdminPage() {
  const { admin, logout } = useAuth();
  const [tab, setTab] = useState<TabKey>("overview");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "EDITOR" as AdminUser["role"] });
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    amountOffPaise: "",
    percentOff: "",
    maxRedemptions: "",
    expiresAt: "",
    validFrom: "",
    minOrderPaise: "",
    minMonths: "",
    applicablePlans: [] as string[],
    notes: "",
    active: true,
  });

  const isSuper = admin?.role === "SUPER_ADMIN";

  const activeUsers = useMemo(() => users.filter((u) => u.status === "ACTIVE").length, [users]);
  const activeSites = useMemo(() => sites.filter((s) => s.status === "ACTIVE").length, [sites]);
  const activeNonSuperUsers = useMemo(
    () => users.filter((u) => u.status === "ACTIVE" && u.role !== "SUPER_ADMIN").length,
    [users]
  );

  const authMethod = (u: AdminUser) => {
    if (u.oauthProvider === "GOOGLE") return "Google";
    if (u.oauthProvider === "GITHUB") return "GitHub";
    return "Email/Password";
  };

  const authIcon = (u: AdminUser) => {
    if (u.oauthProvider === "GOOGLE") return <GoogleLogo className="h-3 w-3" />;
    if (u.oauthProvider === "GITHUB") return <GithubLogo className="h-3 w-3" />;
    return <Mail className="h-3 w-3" />;
  };

  async function loadMetrics() {
    setError("");
    try {
      const res = await api.get("/super-admin/metrics");
      setMetrics(res.data.metrics);
    } catch {
      setError("Unable to load metrics.");
    }
  }

  async function loadSubscriptions() {
    setError("");
    try {
      const res = await api.get("/super-admin/subscriptions");
      setSubs(res.data.subscriptions);
    } catch {
      setError("Unable to load subscriptions.");
    }
  }

  async function loadCoupons() {
    setError("");
    try {
      const res = await api.get("/super-admin/coupons");
      setCoupons(res.data.coupons);
    } catch {
      setError("Unable to load coupons.");
    }
  }

  async function loadUsers() {
    setError("");
    try {
      const res = await api.get("/super-admin/users");
      setUsers(res.data.users);
    } catch {
      setError("Unable to load users.");
    }
  }

  async function loadSites() {
    setError("");
    try {
      const res = await api.get("/super-admin/sites");
      setSites(res.data.sites);
    } catch {
      setError("Unable to load sites.");
    }
  }

  async function loadPosts() {
    setError("");
    try {
      const res = await api.get("/super-admin/posts");
      setPosts(res.data.posts);
    } catch {
      setError("Unable to load posts.");
    }
  }

  function handleTabChange(value: string) {
    if (["overview", "users", "sites", "posts", "coupons"].includes(value)) {
      setTab(value as TabKey);
    }
  }

  useEffect(() => {
    if (!isSuper) return;
    const run = async () => {
      if (tab === "overview") {
        await loadMetrics();
        await loadSubscriptions();
      }
      if (tab === "users") await loadUsers();
      if (tab === "sites") await loadSites();
      if (tab === "posts") await loadPosts();
    if (tab === "coupons") await loadCoupons();
  };
  void run();
  }, [tab, isSuper]);

  const parseIntField = (value: string) => {
    if (!value.trim()) return undefined;
    const n = Number(value);
    return Number.isFinite(n) ? Math.floor(n) : NaN;
  };

  const parseRupeeFieldToPaise = (value: string) => {
    if (!value.trim()) return undefined;
    const n = Number(value);
    if (!Number.isFinite(n)) return NaN;
    if (n < 0) return NaN;
    return Math.round(n * 100);
  };

  function validateCouponForm(): { error?: string; payload?: CouponPayload } {
    const code = newCoupon.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{2,40}$/.test(code)) {
      return { error: "Coupon code must be 2-40 characters and use letters, numbers, _ or -." };
    }

    const amountOffPaise = parseRupeeFieldToPaise(newCoupon.amountOffPaise);
    const percentOff = parseIntField(newCoupon.percentOff);
    if ((amountOffPaise === undefined || Number.isNaN(amountOffPaise)) && (percentOff === undefined || Number.isNaN(percentOff))) {
      return { error: "Provide either amount off (₹) or percent off." };
    }
    if (amountOffPaise !== undefined && (Number.isNaN(amountOffPaise) || amountOffPaise < 0)) {
      return { error: "Amount off must be a non-negative rupee value." };
    }
    if (percentOff !== undefined && (Number.isNaN(percentOff) || percentOff < 1 || percentOff > 100)) {
      return { error: "Percent off must be between 1 and 100." };
    }

    const maxRedemptions = parseIntField(newCoupon.maxRedemptions);
    if (maxRedemptions !== undefined && (Number.isNaN(maxRedemptions) || maxRedemptions < 1)) {
      return { error: "Max redemptions must be at least 1." };
    }

    const minOrderPaise = parseRupeeFieldToPaise(newCoupon.minOrderPaise);
    if (minOrderPaise !== undefined && (Number.isNaN(minOrderPaise) || minOrderPaise < 0)) {
      return { error: "Min order must be zero or higher (₹)." };
    }

    const minMonths = parseIntField(newCoupon.minMonths);
    if (minMonths !== undefined && (Number.isNaN(minMonths) || minMonths < 1)) {
      return { error: "Min months must be at least 1." };
    }

    const validFrom = newCoupon.validFrom ? new Date(newCoupon.validFrom) : null;
    const expiresAt = newCoupon.expiresAt ? new Date(newCoupon.expiresAt) : null;
    if (validFrom && isNaN(validFrom.getTime())) return { error: "Valid from date is invalid." };
    if (expiresAt && isNaN(expiresAt.getTime())) return { error: "Expiry date is invalid." };
    if (validFrom && expiresAt && validFrom.getTime() > expiresAt.getTime()) {
      return { error: "Valid from cannot be after expiry." };
    }

    const applicablePlans = newCoupon.applicablePlans.filter((p) => PLAN_OPTIONS.includes(p));

    const payload: CouponPayload = {
      code,
      active: newCoupon.active,
      ...(amountOffPaise !== undefined && !Number.isNaN(amountOffPaise) ? { amountOffPaise } : {}),
      ...(percentOff !== undefined && !Number.isNaN(percentOff) ? { percentOff } : {}),
      ...(maxRedemptions !== undefined && !Number.isNaN(maxRedemptions) ? { maxRedemptions } : {}),
      ...(minOrderPaise !== undefined && !Number.isNaN(minOrderPaise) ? { minOrderPaise } : {}),
      ...(minMonths !== undefined && !Number.isNaN(minMonths) ? { minMonths } : {}),
      ...(validFrom ? { validFrom: validFrom.toISOString() } : {}),
      ...(expiresAt ? { expiresAt: expiresAt.toISOString() } : {}),
      ...(applicablePlans.length ? { applicablePlans } : {}),
      ...(newCoupon.notes.trim() ? { notes: newCoupon.notes } : {}),
    };

    return { payload };
  }

  async function createUser() {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) return;
    setError("");
    try {
      await api.post("/super-admin/users", newUser);
      setNewUser({ name: "", email: "", password: "", role: "EDITOR" });
      await loadUsers();
    } catch {
      setError("Unable to create user.");
    }
  }

  async function updateUser(userId: string, data: Partial<Pick<AdminUser, "status" | "role">>) {
    setError("");
    try {
      await api.patch(`/super-admin/users/${userId}`, data);
      await loadUsers();
    } catch {
      setError("Unable to update user.");
    }
  }

  async function deleteUser(userId: string) {
    if (!window.confirm("Delete this user?")) return;
    setError("");
    try {
      await api.delete(`/super-admin/users/${userId}`);
      await loadUsers();
    } catch {
      setError("Unable to delete user.");
    }
  }

  async function updateSiteStatus(siteId: string, status: "ACTIVE" | "SUSPENDED") {
    setError("");
    try {
      await api.patch(`/super-admin/sites/${siteId}/status`, { status });
      await loadSites();
    } catch {
      setError("Unable to update site.");
    }
  }

  async function deleteSite(siteId: string) {
    if (!window.confirm("Delete this site and all its data?")) return;
    setError("");
    try {
      await api.delete(`/super-admin/sites/${siteId}`);
      await loadSites();
    } catch {
      setError("Unable to delete site.");
    }
  }

  async function deletePost(postId: string) {
    if (!window.confirm("Delete this post?")) return;
    setError("");
    try {
      await api.delete(`/super-admin/posts/${postId}`);
      await loadPosts();
    } catch {
      setError("Unable to delete post.");
    }
  }

  async function createCoupon() {
    const { error: validationError, payload } = validateCouponForm();
    if (validationError || !payload) {
      setError(validationError || "Invalid coupon details.");
      return;
    }
    setError("");
    try {
      await api.post("/super-admin/coupons", payload);
      setNewCoupon({
        code: "",
        amountOffPaise: "",
        percentOff: "",
        maxRedemptions: "",
        expiresAt: "",
        validFrom: "",
        minOrderPaise: "",
        minMonths: "",
        applicablePlans: [],
        notes: "",
        active: true,
      });
      await loadCoupons();
    } catch (err) {
      let message: string | undefined;
      if (err && typeof err === "object") {
        const maybeResponse = (err as { response?: { data?: { message?: string } } }).response;
        message = maybeResponse?.data?.message;
      }
      setError(message || "Unable to create coupon.");
    }
  }

  async function toggleCoupon(id: string, active: boolean) {
    setError("");
    try {
      await api.patch(`/super-admin/coupons/${id}`, { active });
      await loadCoupons();
    } catch {
      setError("Unable to update coupon.");
    }
  }

  async function deleteCoupon(id: string) {
    if (!window.confirm("Delete this coupon?")) return;
    setError("");
    try {
      await api.delete(`/super-admin/coupons/${id}`);
      await loadCoupons();
    } catch {
      setError("Unable to delete coupon.");
    }
  }

  if (!isSuper) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800">
            <ShieldCheck className="h-5 w-5 text-cyan-600" />
            <span className="text-sm font-semibold">Super Admin</span>
          </div>
        <Button
          variant="outline"
          className=" text-slate-950 hover:bg-cyan-400"
          onClick={() => {
            logout();
          }}
        >
          <LogOut className="h-4 w-4" />
        </Button>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            <div>You are not authorized to view the Super Admin dashboard.</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className=" top-0 z-40 flex lg:max-w-7xl mx-auto items-center justify-between gap-3  px-4 py-4  sm:px-6">
        <div className="flex items-center gap-2 text-slate-800">
          <ShieldCheck className="h-5 w-5 text-cyan-600" />
          <span className="text-sm font-semibold">Super Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 hover:bg-cyan-50"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto my-8 space-y-6 px-4 sm:px-6 lg:max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                <ShieldCheck className="h-4 w-4" />
                Super Admin Control
              </div>
              <h1 className="text-3xl font-semibold lg:text-4xl">Command center for your entire workspace</h1>
              <p className="max-w-2xl text-slate-200">
                Monitor people, sites, posts, and billing from one place. Everything is live, with guardrails for the super admin role.
              </p>
            </div>
            <div className="grid w-full max-w-xl grid-cols-2 gap-3 text-left sm:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-3 text-white shadow-inner">
                <div className="text-xs uppercase text-slate-200">Active users</div>
                <div className="text-2xl font-semibold">{activeUsers}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-white shadow-inner">
                <div className="text-xs uppercase text-slate-200">Active sites</div>
                <div className="text-2xl font-semibold">{activeSites}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-white shadow-inner">
                <div className="text-xs uppercase text-slate-200">Plans</div>
                <div className="text-2xl font-semibold">{subs.length || "–"}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 text-white shadow-inner">
                <div className="text-xs uppercase text-slate-200">Coupons</div>
                <div className="text-2xl font-semibold">{coupons.length || "–"}</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <Card className=" bg-transparent showdown-none border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Administration</CardTitle>
            <CardDescription className="text-sm">Full visibility and controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
              <div className="overflow-x-auto pb-2">
                <TabsList className="grid min-w-[520px] grid-cols-5 rounded-xl bg-slate-100 sm:min-w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="sites">Sites</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="coupons">Coupons</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700">Users</CardTitle>
                      <CardDescription className="text-2xl font-bold text-slate-900">
                        {metrics?.users ?? activeNonSuperUsers ?? "–"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700">Sites</CardTitle>
                      <CardDescription className="text-2xl font-bold text-slate-900">
                        {metrics?.sites ?? "–"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700">Posts</CardTitle>
                      <CardDescription className="text-2xl font-bold text-slate-900">
                        {metrics?.posts ?? "–"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700">Active subscriptions</CardTitle>
                      <CardDescription className="text-2xl font-bold text-slate-900">
                        {metrics?.activeSubscriptions ?? "–"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="border-slate-200 md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-slate-700">Monthly revenue (est)</CardTitle>
                      <CardDescription className="text-2xl font-bold text-slate-900">
                        ₹{metrics ? (metrics.revenuePaise / 100).toLocaleString("en-IN") : "–"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">Recent subscriptions</CardTitle>
                    <CardDescription className="text-sm">Latest account subscriptions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(subs || []).slice(0, 6).map((s) => (
                      <div
                        key={s.id}
                        className="flex flex-col rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-slate-900">{s.plan}</div>
                          <div className="text-xs text-slate-600">
                            {s.admin?.name} · {s.admin?.email}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                    {!subs.length && <div className="text-sm text-slate-500">No subscriptions yet.</div>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="coupons" className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-3">
                    {coupons.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">{c.code}</div>
                            <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Active" : "Inactive"}</Badge>
                            {c.expiresAt && <Badge variant="outline">Expires {new Date(c.expiresAt).toLocaleDateString()}</Badge>}
                          </div>
                          <div className="text-xs text-slate-600">
                            {c.amountOffPaise ? `₹${(c.amountOffPaise / 100).toLocaleString("en-IN")} off` : ""}
                            {c.percentOff ? `${c.amountOffPaise ? " · " : ""}${c.percentOff}% off` : ""}
                            {c.maxRedemptions ? ` · ${c.redeemed || 0}/${c.maxRedemptions} used` : ""}
                            {c.minOrderPaise ? ` · Min spend ₹${(c.minOrderPaise / 100).toLocaleString("en-IN")}` : ""}
                            {c.minMonths ? ` · Min ${c.minMonths} month${c.minMonths > 1 ? "s" : ""}` : ""}
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                            {c.validFrom ? <Badge variant="outline">From {new Date(c.validFrom).toLocaleDateString()}</Badge> : null}
                            {c.expiresAt ? <Badge variant="outline">Until {new Date(c.expiresAt).toLocaleDateString()}</Badge> : null}
                            {c.applicablePlans?.length ? (
                              <Badge variant="secondary">Plans: {c.applicablePlans.join(", ")}</Badge>
                            ) : (
                              <Badge variant="secondary">Plans: All</Badge>
                            )}
                          </div>
                          {c.notes && <div className="text-xs text-slate-500">{c.notes}</div>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => toggleCoupon(c.id, !c.active)}>
                            {c.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button variant="destructive" size="sm" className="w-full sm:w-auto" onClick={() => deleteCoupon(c.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!coupons.length && <div className="text-sm text-slate-500">No coupons created yet.</div>}
                  </div>
                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-slate-900">Create coupon</div>
                      <p className="text-xs text-slate-600">Set discount, eligibility, and plan applicability.</p>
                    </div>
                    <div className="space-y-2">
                      <Input placeholder="CODE" value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} />
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        placeholder="Amount off (₹)"
                        value={newCoupon.amountOffPaise}
                        onChange={(e) => setNewCoupon({ ...newCoupon, amountOffPaise: e.target.value })}
                      />
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        placeholder="Percent off"
                        value={newCoupon.percentOff}
                        onChange={(e) => setNewCoupon({ ...newCoupon, percentOff: e.target.value })}
                      />
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Max redemptions"
                        value={newCoupon.maxRedemptions}
                        onChange={(e) => setNewCoupon({ ...newCoupon, maxRedemptions: e.target.value })}
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          type="date"
                          placeholder="Valid from"
                          value={newCoupon.validFrom}
                          onChange={(e) => setNewCoupon({ ...newCoupon, validFrom: e.target.value })}
                        />
                        <Input
                          type="date"
                          placeholder="Expires at"
                          value={newCoupon.expiresAt}
                          onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="Min order (₹)"
                          value={newCoupon.minOrderPaise}
                          onChange={(e) => setNewCoupon({ ...newCoupon, minOrderPaise: e.target.value })}
                        />
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="Min months (subscription)"
                          value={newCoupon.minMonths}
                          onChange={(e) => setNewCoupon({ ...newCoupon, minMonths: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                        <div className="text-xs font-semibold text-slate-700">Applicable plans</div>
                        <div className="flex flex-wrap gap-2">
                          {PLAN_OPTIONS.map((plan) => {
                            const checked = newCoupon.applicablePlans.includes(plan);
                            return (
                              <label key={plan} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setNewCoupon((prev) => {
                                      const next = new Set(prev.applicablePlans);
                                      if (e.target.checked) next.add(plan);
                                      else next.delete(plan);
                                      return { ...prev, applicablePlans: Array.from(next) };
                                    });
                                  }}
                                />
                                {plan}
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-slate-500">Leave empty to allow all plans.</p>
                      </div>
                      <Textarea
                        placeholder="Notes"
                        value={newCoupon.notes}
                        onChange={(e) => setNewCoupon({ ...newCoupon, notes: e.target.value })}
                      />
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-slate-700 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newCoupon.active}
                            onChange={(e) => setNewCoupon({ ...newCoupon, active: e.target.checked })}
                          />
                          Active
                        </label>
                        <Button size="sm" onClick={createCoupon}>
                          Save coupon
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              className="flex items-center gap-3"
                              onClick={() => setSelectedUser(u)}
                              title="View user details"
                            >
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-200"
                                />
                              ) : (
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                  {u.name
                                    .split(" ")
                                    .map((p) => p[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                              )}
                              <div className="text-left">
                                <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                                <div className="text-xs text-slate-500">{u.email}</div>
                              </div>
                            </button>
                            <Badge className={u.role === "SUPER_ADMIN" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-800"}>
                              {u.role === "SUPER_ADMIN" ? "Super admin" : "Editor"}
                            </Badge>
                            <Badge variant={u.status === "ACTIVE" ? "default" : "destructive"}>{u.status}</Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {authIcon(u)}
                              {authMethod(u)}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                            <span>Sites: {u._count?.memberships ?? 0}</span>
                            <span className="text-slate-300">•</span>
                            <span>Posts: {u._count?.posts ?? 0}</span>
                            <span className="text-slate-300">•</span>
                            <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg sm:w-auto"
                            disabled={u.role === "SUPER_ADMIN"}
                            onClick={() => updateUser(u.id, { status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })}
                          >
                            <PauseCircle className="mr-2 h-4 w-4" />
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg sm:w-auto"
                            disabled={u.role === "SUPER_ADMIN"}
                            onClick={() => updateUser(u.id, { role: u.role === "EDITOR" ? "SUPER_ADMIN" : "EDITOR" })}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Role: {u.role === "EDITOR" ? "Make super" : "Make editor"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full rounded-lg sm:w-auto"
                            disabled={u.role === "SUPER_ADMIN"}
                            onClick={() => deleteUser(u.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white via-white to-slate-50 p-5 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">Create user</div>
                    <div className="mt-3 space-y-2">
                      <Input
                        placeholder="Name"
                        value={newUser.name}
                        onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                        className="rounded-lg"
                      />
                      <Input
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                        className="rounded-lg"
                      />
                      <Input
                        placeholder="Password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                        className="rounded-lg"
                      />
                      <select
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={newUser.role}
                        onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as AdminUser["role"] }))}
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="SUPER_ADMIN">Super admin</option>
                      </select>
                      <Button className="w-full rounded-lg bg-cyan-600 hover:bg-cyan-700" onClick={createUser}>
                        Create user
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sites" className="mt-4 space-y-3">
                {sites.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1 my-6 md:my-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900 truncate">{s.name}</div>
                        <Badge variant="secondary">{s.slug}</Badge>
                        <Badge variant={s.status === "ACTIVE" ? "default" : "destructive"}>{s.status}</Badge>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                        <span>Domains: {s.siteDomains?.length ?? 0}</span>
                        <span className="text-slate-300">•</span>
                        <span>Posts: {s._count?.posts ?? 0}</span>
                        <span className="text-slate-300">•</span>
                        <span>Tokens: {s._count?.apiTokens ?? 0}</span>
                        <span className="text-slate-300">•</span>
                        <span>Members: {s._count?.memberships ?? 0}</span>
                      </div>
                      {s.siteDomains?.[0]?.domain ? (
                        <div className="text-xs text-slate-500">Domain: {s.siteDomains[0].domain}</div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-lg sm:w-auto"
                        onClick={() => updateSiteStatus(s.id, s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        {s.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </Button>
                      <Button variant="destructive" size="sm" className="w-full rounded-lg sm:w-auto" onClick={() => deleteSite(s.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="posts" className="mt-4 space-y-3">
                {posts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 truncate">{p.title}</div>
                      <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                        <span>Site: {p.site?.name ?? "—"}</span>
                        <span className="text-slate-300">•</span>
                        <span>Author: {p.author?.name ?? "—"}</span>
                        <span className="text-slate-300">•</span>
                        <span>Created {new Date(p.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" className="w-full rounded-lg sm:w-auto" onClick={() => deletePost(p.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <div className="flex items-center gap-2">
                {selectedUser.avatarUrl ? (
                  <img
                    src={selectedUser.avatarUrl}
                    alt={selectedUser.name}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-200"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {selectedUser.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-900">{selectedUser.name}</div>
                  <div className="text-xs text-slate-500">{selectedUser.email}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm text-slate-700">
              <div className="flex gap-2">
                <span className="font-semibold">Role:</span> {selectedUser.role}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Status:</span> {selectedUser.status}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Signup:</span>
                <span className="inline-flex items-center gap-1">
                  {authIcon(selectedUser)}
                  {authMethod(selectedUser)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Created:</span> {new Date(selectedUser.createdAt).toLocaleString()}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Memberships:</span> {selectedUser._count?.memberships ?? 0}
              </div>
              <div className="flex gap-2">
                <span className="font-semibold">Posts:</span> {selectedUser._count?.posts ?? 0}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
