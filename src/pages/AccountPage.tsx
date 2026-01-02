import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/lib/auth";
import { useSite } from "@/lib/site";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import {
  Calendar,
  Copy,
  Globe,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";

type Token = {
  id: string;
  name: string;
  plain: string;
  role: "READ_ONLY" | "READ_WRITE";
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  createdAt: string;
};

function formatPlan(plan?: string | null) {
  if (!plan) return "Free";
  return plan
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AccountPage() {
  const { admin } = useAuth();
  const { activeSite, sites } = useSite();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  const accountSub = admin?.accountSubscription;

  useEffect(() => {
    if (!activeSite) {
      setTokens([]);
      return;
    }
    let active = true;
    setLoadingTokens(true);
    setTokenError("");
    api
      .get(`/admin/sites/${activeSite.id}/tokens`)
      .then((res) => {
        if (!active) return;
        setTokens(res.data.tokens || []);
      })
      .catch((err) => {
        if (!active) return;
        const message =
          err?.response?.data?.message ||
          "Only site owners can view tokens for this site.";
        setTokenError(message);
      })
      .finally(() => {
        if (!active) return;
        setLoadingTokens(false);
      });
    return () => {
      active = false;
    };
  }, [activeSite?.id]);

  const planLabel = useMemo(
    () => formatPlan(accountSub?.plan ?? activeSite?.subscription?.plan),
    [accountSub?.plan, activeSite?.subscription?.plan]
  );
  const planStatus = accountSub?.status ?? activeSite?.subscription?.status ?? "active";
  const planExpiry = accountSub?.expiresAt
    ? new Date(accountSub.expiresAt).toLocaleDateString()
    : activeSite?.subscription?.expiresAt
    ? new Date(activeSite.subscription.expiresAt).toLocaleDateString()
    : "No expiry";

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMsg("Token copied to clipboard.");
      setTimeout(() => setCopyMsg(""), 1500);
    } catch {
      setCopyMsg("Unable to copy token.");
      setTimeout(() => setCopyMsg(""), 1500);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <PageHeader
          eyebrow={
            <Badge className="w-fit gap-2 bg-slate-900 text-white">
              <UserCircle2 className="h-3 w-3" /> Account hub
            </Badge>
          }
          title="Account intelligence"
          description="Centralize personal details, plan status, tokens, and verified domains. Everything your AI-powered CMS needs to stay secure and scalable."
          aside={
            <>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Active plan</div>
              <div className="mt-1 flex items-center gap-2 text-base font-semibold text-slate-900">
                {planLabel}
                <Badge className="bg-emerald-100 text-emerald-700">{planStatus}</Badge>
              </div>
              <div className="mt-1 text-xs text-slate-500">Expiry: {planExpiry}</div>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold text-slate-900">Personal profile</CardTitle>
              <CardDescription>Account identity and security context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {admin?.avatarUrl ? (
                  <img
                    src={admin.avatarUrl}
                    alt={admin?.name ?? "User"}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
                    {admin?.name?.[0]?.toUpperCase() ?? "A"}
                  </div>
                )}
                <div>
                  <div className="text-lg font-semibold text-slate-900">{admin?.name ?? "User"}</div>
                  <div className="text-sm text-slate-500">{admin?.role ?? "EDITOR"}</div>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {admin?.email ?? "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Member since {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : "—"}
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  Role access: {admin?.role ?? "EDITOR"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold text-slate-900">Plan & limits</CardTitle>
              <CardDescription>Subscription status for your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current plan</div>
                  <div className="text-lg font-semibold text-slate-900">{planLabel}</div>
                </div>
                <Badge className="bg-cyan-100 text-cyan-700">{planStatus}</Badge>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
                  AI services active
                </div>
                <span>Expiry: {planExpiry}</span>
              </div>
              <Button asChild className="w-full bg-slate-900 text-white hover:bg-slate-800">
                <Link to="/pricing">Manage plan</Link>
              </Button>
              {!activeSite ? (
                <p className="text-xs text-amber-600">Select a site to view tokens and domains.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base font-semibold text-slate-900">Sites & domains</CardTitle>
            <CardDescription>Connected properties and verification status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {sites.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                No sites yet. Create one to activate tokens and plans.
              </div>
            ) : (
              sites.map((site) => {
                const sitePlan = formatPlan(accountSub?.plan ?? site.subscription?.plan);
                const expiry = accountSub?.expiresAt
                  ? new Date(accountSub.expiresAt).toLocaleDateString()
                  : site.subscription?.expiresAt
                  ? new Date(site.subscription.expiresAt).toLocaleDateString()
                  : "No expiry";
                return (
                  <div
                    key={site.id}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{site.name}</div>
                        <div className="text-xs text-slate-500">Role: {site.membershipRole ?? "OWNER"}</div>
                      </div>
                      <Badge className="bg-slate-900 text-white">{sitePlan}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Globe className="h-3.5 w-3.5" />
                      Expiry: {expiry}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(site.siteDomains ?? []).length === 0 ? (
                        <span className="text-xs text-slate-400">No domains added.</span>
                      ) : (
                        site.siteDomains?.map((domain) => (
                          <span
                            key={domain.id}
                            className={`rounded-full px-3 py-1 text-xs ${
                              domain.status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-700"
                                : domain.status === "FAILED"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {domain.domain}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base font-semibold text-slate-900">
              API tokens (active site)
            </CardTitle>
            <CardDescription>Use tokens to fetch posts and secure public endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {copyMsg ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                {copyMsg}
              </div>
            ) : null}
            {tokenError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {tokenError}
              </div>
            ) : null}
            {!activeSite ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Select a site to view its tokens.
              </div>
            ) : null}
            {loadingTokens ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading tokens…
              </div>
            ) : tokens.length === 0 && activeSite ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                <KeyRound className="mx-auto h-6 w-6 text-slate-400" />
                <div className="mt-2 font-semibold text-slate-900">No tokens found</div>
                <div className="mt-1 text-xs text-slate-500">
                  Create tokens from the Sites page to connect your public website.
                </div>
              </div>
            ) : tokens.length > 0 ? (
              <div className="grid gap-3">
                {tokens.map((token) => {
                  const expires = token.expiresAt ? new Date(token.expiresAt).toLocaleDateString() : "No expiry";
                  const lastUsed = token.lastUsedAt ? new Date(token.lastUsedAt).toLocaleDateString() : "Never";
                  return (
                    <div
                      key={token.id}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-slate-900">{token.name}</div>
                          <div className="text-xs text-slate-500">Created {new Date(token.createdAt).toLocaleDateString()}</div>
                        </div>
                        <Badge className={token.role === "READ_WRITE" ? "bg-cyan-600 text-white" : "bg-slate-200 text-slate-700"}>
                          {token.role === "READ_WRITE" ? "READ + WRITE" : "READ ONLY"}
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 md:grid-cols-3">
                        <div>Last used: {lastUsed}</div>
                        <div>Expires: {expires}</div>
                        <div>Role: {token.role}</div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-500">Plain token:</span>
                        <code className="rounded-lg bg-slate-100 px-2 py-1 text-slate-800 break-all">{token.plain}</code>
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleCopy(token.plain)}>
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
