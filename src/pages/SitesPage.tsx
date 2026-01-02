import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSite } from "@/lib/site";
import { api } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import {
  CheckCircle2,
  Globe,
  KeyRound,
  ShieldCheck,
  Copy,
  Trash2,
  Plus,
  AlertTriangle,
  Link as LinkIcon,
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

type Domain = {
  id: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  verificationToken: string;
  verifiedAt?: string | null;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function StatPill({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "default" | "cyan" | "success" | "warn";
}) {
  const toneClass =
    tone === "cyan"
      ? "border-cyan-200 bg-cyan-50 text-cyan-800"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : tone === "warn"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={cx("flex items-center gap-2 rounded-xl border px-3 py-2", toneClass)}>
      <div className="shrink-0">{icon}</div>
      <div className="leading-tight">
        <div className="text-[11px] font-medium opacity-80">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Domain["status"] }) {
  if (status === "VERIFIED") {
    return (
      <Badge className="bg-cyan-600 hover:bg-cyan-600 text-white">
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
        VERIFIED
      </Badge>
    );
  }
  if (status === "FAILED") {
    return (
      <Badge variant="destructive">
        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
        FAILED
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-slate-700">
      PENDING
    </Badge>
  );
}

export default function SitesPage() {
  const { sites, activeSite, selectSite, deleteSite } = useSite();


  const [tokenName, setTokenName] = useState("");
  const [tokenRole, setTokenRole] = useState<Token["role"]>("READ_ONLY");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [plainToken, setPlainToken] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);
  const [deleteDomainTarget, setDeleteDomainTarget] = useState<Domain | null>(null);
  const [deleteSiteOpen, setDeleteSiteOpen] = useState(false);

  const [domainChecks, setDomainChecks] = useState<
    Record<
      string,
      { checkedAt: number; status: "success" | "failed"; method: "dns" | "html"; message?: string }
    >
  >({});
  const [verifyingDomain, setVerifyingDomain] = useState<{ id: string; method: "dns" | "html" } | null>(
    null
  );

  async function loadTokens(targetSiteId?: string | null) {
    const siteId = targetSiteId ?? activeSite?.id;
    if (!siteId) {
      setTokens([]);
      setPlainToken("");
      return;
    }
    setTokenLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/sites/${siteId}/tokens`);
      setTokens(res.data.tokens);
    } catch {
      setError("Unable to load API tokens for this site.");
      setTokens([]);
      setPlainToken("");
    } finally {
      setTokenLoading(false);
    }
  }

  async function loadDomains(targetSiteId?: string | null) {
    const siteId = targetSiteId ?? activeSite?.id;
    if (!siteId) {
      setDomains([]);
      return;
    }
    setDomainLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/sites/${siteId}/domains`);
      setDomains(res.data.domains);
    } catch {
      setError("Unable to load domains for this site.");
    } finally {
      setDomainLoading(false);
    }
  }


  async function handleDeleteSiteConfirmed() {
    if (!activeSite) return;
    setError("");
    setNotice("");
    try {
      await deleteSite(activeSite.id);
      await loadTokens(null);
      await loadDomains(null);
      setNotice("Site deleted.");
    } catch {
      setError("Unable to delete site. Only site owners can delete a site.");
    } finally {
      setDeleteSiteOpen(false);
    }
  }

  async function handleCreateToken() {
    if (!activeSite || !tokenName.trim()) return;
    if (tokens.length >= 1) {
      setError("This site already has a token. Delete it before creating another.");
      return;
    }
    try {
      const res = await api.post(`/admin/sites/${activeSite.id}/tokens`, {
        name: tokenName.trim(),
        role: tokenRole,
      });
      setPlainToken(res.data.plainToken);
      setTokenName("");
      await loadTokens();
      setNotice("Token created. Copy it now — it will not be shown again.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Unable to create token. Only site owners can manage tokens.";
      setError(msg);
    }
  }

  async function deleteToken(id: string) {
    if (!activeSite) return;
    try {
      await api.delete(`/admin/sites/${activeSite.id}/tokens/${id}`);
      await loadTokens();
      setNotice("Token deleted.");
      setPlainToken("");
    } catch {
      setError("Unable to delete token.");
    }
  }

  async function addDomain() {
    if (!activeSite || !domainInput.trim()) return;
    try {
      const res = await api.post(`/admin/sites/${activeSite.id}/domains`, { domain: domainInput.trim() });
      const newDomain = res.data.domain as Domain | undefined;

      setDomains((prev) => {
        if (!newDomain) return prev;
        const filtered = prev.filter((d) => d.id !== newDomain.id);
        return [newDomain, ...filtered];
      });

      setDomainInput("");
      setNotice("Domain added. TXT record generated—verify ownership next.");
      // Also refresh from server to include any server-side ordering/fields.
      await loadDomains();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Unable to add domain. Only site owners can manage domains.";
      setError(msg);
    }
  }

  async function verifyDomain(domainId: string) {
    if (!activeSite) return;
    setVerifyingDomain({ id: domainId, method: "dns" });
    setNotice("");
    setError("");
    try {
      await api.post(`/admin/sites/${activeSite.id}/domains/${domainId}/verify`);
      setDomainChecks((prev) => ({
        ...prev,
        [domainId]: { checkedAt: Date.now(), status: "success", method: "dns" },
      }));
      await loadDomains();
      setNotice("DNS verification succeeded.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Verification failed. Check DNS TXT record.";
      setError(msg);
      setDomainChecks((prev) => ({
        ...prev,
        [domainId]: { checkedAt: Date.now(), status: "failed", method: "dns", message: msg },
      }));
    } finally {
      setVerifyingDomain(null);
    }
  }

  async function verifyDomainHtml(domainId: string) {
    if (!activeSite) return;
    setVerifyingDomain({ id: domainId, method: "html" });
    setNotice("");
    setError("");
    try {
      await api.post(`/admin/sites/${activeSite.id}/domains/${domainId}/verify-html`);
      setDomainChecks((prev) => ({
        ...prev,
        [domainId]: { checkedAt: Date.now(), status: "success", method: "html" },
      }));
      await loadDomains();
      setNotice("HTML verification succeeded.");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "HTML verification failed. Ensure the file is accessible at /.well-known/sapphire-site-verification.txt";
      setError(msg);
      setDomainChecks((prev) => ({
        ...prev,
        [domainId]: { checkedAt: Date.now(), status: "failed", method: "html", message: msg },
      }));
    } finally {
      setVerifyingDomain(null);
    }
  }



  async function handleDeleteDomainConfirmed(domainId: string) {
    if (!activeSite) return;
    const isOwner = (activeSite as any)?.membershipRole === "OWNER";
    if (!isOwner) {
      setError("Only site owners can delete domains.");
      setDeleteDomainTarget(null);
      return;
    }
    setError("");
    setNotice("");
    try {
      await api.delete(`/admin/sites/${activeSite.id}/domains/${domainId}`);
      await loadDomains();
      setNotice("Domain deleted.");
    } catch {
      setError("Unable to delete domain. Only site owners can manage domains.");
    } finally {
      setDeleteDomainTarget(null);
    }
  }

  useEffect(() => {
    loadTokens();
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite?.id]);

  const activeSiteDomains = useMemo(() => domains ?? [], [domains]);
  const verifiedCount = useMemo(
    () => activeSiteDomains.filter((d) => d.status === "VERIFIED").length,
    [activeSiteDomains]
  );
  const hasToken = useMemo(() => tokens.length > 0, [tokens]);
  const tokenLimitReached = tokens.length >= 1 && !tokenLoading;
  const lastUsedAt = useMemo(() => {
    const t = tokens.find((tok) => tok.lastUsedAt);
    return t?.lastUsedAt ? new Date(t.lastUsedAt) : null;
  }, [tokens]);
  const isOwner = (activeSite as any)?.membershipRole === "OWNER";

  function copyToClipboard(text: string, message = "Copied to clipboard") {
    if (!navigator?.clipboard) return;
    setError("");
    navigator.clipboard.writeText(text).then(() => setNotice(message));
  }

  function formatCheckedAt(domainId: string) {
    const check = domainChecks[domainId];
    if (!check) return "";
    return `Last checked ${new Date(check.checkedAt).toLocaleTimeString()} via ${check.method.toUpperCase()}`;
  }

  const primaryDomain = activeSiteDomains[0];
  const txtRecord = primaryDomain ? `sapphire-site-verification=${primaryDomain.verificationToken}` : "";

  const steps = [
    { done: Boolean(activeSite), title: "Create site", desc: "Holds domains, tokens, and posts." },
    { done: activeSiteDomains.length > 0, title: "Add domain", desc: "Add a primary domain to verify." },
    { done: verifiedCount > 0, title: "Verify ownership", desc: "Use DNS TXT or HTML file." },
    { done: hasToken, title: "Issue token", desc: "Use it in your website integration." },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow={
            <>
              <Badge className="bg-slate-900 text-white">Sites</Badge>
              {activeSite?.membershipRole ? (
                <Badge variant="secondary">{activeSite.membershipRole}</Badge>
              ) : null}
            </>
          }
          title={activeSite ? activeSite.name : "Manage your sites"}
          description="Connect your domain, verify ownership, and issue tokens to publish and fetch content."
          actions={
            <>
              <select
                className="w-full min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-slate-300 sm:w-auto"
                value={activeSite?.id || ""}
                onChange={(e) => selectSite(e.target.value)}
              >
                <option value="" disabled>
                  Choose a site
                </option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                className="rounded-xl border-red-200 text-red-700 hover:text-red-800"
                disabled={!activeSite}
                onClick={() => setDeleteSiteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete site
              </Button>
            </>
          }
          meta={
            <div className="w-full space-y-2">
              <div className="grid gap-2 sm:grid-cols-3">
                <StatPill
                  icon={<Globe className="h-4 w-4" />}
                  label="Domains verified"
                  value={`${verifiedCount}/${activeSiteDomains.length || 0}`}
                  tone="cyan"
                />
                <StatPill
                  icon={<KeyRound className="h-4 w-4" />}
                  label="Tokens issued"
                  value={tokens.length}
                  tone="default"
                />
                <StatPill
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Last token used"
                  value={lastUsedAt ? lastUsedAt.toLocaleString() : "—"}
                  tone={lastUsedAt ? "success" : "warn"}
                />
              </div>
              <div className="text-xs text-slate-500">
                {activeSite ? (
                  <>
                    <span>Slug: {activeSite.slug ?? "—"}</span>
                    <span className="mx-2">|</span>
                    <span>Site ID: {activeSite.id}</span>
                  </>
                ) : (
                  "Select or create a site to continue"
                )}
              </div>
            </div>
          }
        />

        {/* ALERTS */}
        {(error || notice) && (
          <div
            className={cx(
              "rounded-xl border px-4 py-3 text-sm",
              error
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            )}
          >
            {error || notice}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          {/* MAIN */}
          <div className="space-y-6 xl:col-span-2">
            {/* ONBOARDING STEPS */}
            <Card className="border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-slate-900">Go live checklist</CardTitle>
                <CardDescription className="text-xs">Everything you need, in the right order.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 md:grid-cols-2">
                {steps.map((s, idx) => (
                  <div
                    key={s.title}
                    className={cx(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                      s.done ? "border-cyan-200 bg-cyan-50" : "border-slate-100 bg-slate-50"
                    )}
                  >
                    <div>
                      {s.done ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-white">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-semibold">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                        {s.done ? (
                          <Badge className="bg-cyan-600 hover:bg-cyan-600 text-white">Done</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* TABS: DOMAINS / TOKENS */}
            <Card className="border-slate-100 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">Site settings</CardTitle>
                <CardDescription>Domains, verification, and API access.</CardDescription>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="domains" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-xl bg-slate-100">
                    <TabsTrigger value="domains" className="rounded-xl">
                      <Globe className="mr-2 h-4 w-4" />
                      Domains
                    </TabsTrigger>
                    <TabsTrigger value="tokens" className="rounded-xl">
                      <KeyRound className="mr-2 h-4 w-4" />
                      API Tokens
                    </TabsTrigger>
                  </TabsList>

                  {/* DOMAINS */}
                  <TabsContent value="domains" className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-cyan-200 bg-gray-100 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-cyan-900">Add your domain</div>
                          <div className="text-xs text-cyan-800/80">
                            Verify with DNS TXT (recommended) or HTML fallback.
                          </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                          <Input
                            placeholder="yourdomain.com"
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value)}
                            className="rounded-xl border-cyan-200 bg-white"
                          />
                          <Button
                            onClick={addDomain}
                            disabled={!domainInput.trim() || !activeSite}
                            className="rounded-xl bg-cyan-600 hover:bg-cyan-700"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add domain
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4 bg-cyan-200/60" />

                      <div className="grid gap-3 md:grid-cols-1">
                        <div className="rounded-xl bg-white p-3 border border-cyan-200/70">
                          <div className="text-xs font-semibold text-slate-700">DNS TXT record</div>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
                        <code className="flex-1 rounded-lg bg-slate-50 p-2 text-xs text-slate-800 break-all border border-slate-100">
                          {primaryDomain ? txtRecord : "Add a domain to generate a TXT token."}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-lg sm:w-auto"
                          disabled={!primaryDomain}
                          onClick={() => primaryDomain && copyToClipboard(txtRecord, "TXT record copied")}
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Copy
                        </Button>
                      </div>
                          <div className="mt-2 text-[12px] text-slate-600">
                            Add this TXT record at your DNS provider for the domain.
                          </div>
                        </div>


                      </div>
                    </div>

                    {domainLoading ? (
                      <p className="text-sm text-slate-500">Loading domains…</p>
                    ) : domains.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <Globe className="mx-auto h-6 w-6 text-slate-400" />
                        <div className="mt-2 font-semibold text-slate-900">No domains yet</div>
                        <div className="mt-1 text-sm text-slate-600">
                          Add your primary domain to start verification.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {domains.map((d) => {
                          const dnsBusy = verifyingDomain?.id === d.id && verifyingDomain.method === "dns";
                          const htmlBusy = verifyingDomain?.id === d.id && verifyingDomain.method === "html";
                          const check = domainChecks[d.id];

                          return (
                            <div
                              key={d.id}
                              className={cx(
                                "rounded-2xl border bg-white p-4 shadow-sm",
                                d.status === "VERIFIED"
                                  ? "border-cyan-200"
                                  : d.status === "FAILED"
                                    ? "border-red-200"
                                    : "border-slate-200"
                              )}
                            >
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 border border-cyan-200">
                                        <LinkIcon className="h-4 w-4 text-cyan-700" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="truncate font-semibold text-slate-900">{d.domain}</div>
                                        <div className="text-xs text-slate-500">
                                          {check ? formatCheckedAt(d.id) : "Not checked yet"}
                                        </div>
                                      </div>
                                    </div>
                                    <StatusBadge status={d.status} />
                                  </div>

                                  {d.verifiedAt ? (
                                    <div className="text-xs text-slate-500">
                                      Verified {new Date(d.verifiedAt).toLocaleString()}
                                    </div>
                                  ) : null}

                                  {check?.status === "failed" && check?.message ? (
                                    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                                      {check.message}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap gap-2">




                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full rounded-xl sm:w-auto"
                                    disabled={dnsBusy}
                                    onClick={() => verifyDomain(d.id)}
                                  >
                                    {dnsBusy ? "Verifying…" : "Verify DNS"}
                                  </Button>

                                  <Button
                                    size="sm"
                                    className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700 sm:w-auto"
                                    disabled={htmlBusy}
                                    onClick={() => verifyDomainHtml(d.id)}
                                  >
                                    {htmlBusy ? "Verifying…" : "Verify HTML"}
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full rounded-xl sm:w-auto"
                                    disabled={!isOwner}
                                    onClick={() => setDeleteDomainTarget(d)}
                                    title={!isOwner ? "Only owners can delete domains" : undefined}
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-3 text-xs text-slate-600">
                                HTML fallback path:{" "}
                                <code className="rounded bg-slate-100 px-1.5 py-0.5">
                                  /.well-known/sapphire-site-verification.txt
                                </code>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* TOKENS */}
                  <TabsContent value="tokens" className="mt-4">
                    <div className="grid gap-4 ">
                      {/* CREATE */}
                      <div className="rounded-2xl border border-cyan-200 bg-linear-to-b from-cyan-50 to-white p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white">
                            <KeyRound className="h-4 w-4" />
                          </div>
                          <div className="leading-tight">
                            <div className="text-sm font-semibold text-slate-900">Create token</div>
                            <div className="text-xs text-slate-600">Use on your website integration.</div>
                          </div>
                        </div>

                        <Separator className="my-4 bg-cyan-200/70" />

                        <div className="space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="text-xs font-medium text-slate-700" htmlFor="token-name">
                                Token name
                              </label>
                              <Input
                                id="token-name"
                                placeholder="Production site token"
                                value={tokenName}
                                onChange={(e) => setTokenName(e.target.value)}
                                className="rounded-xl border-cyan-200 bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-xs font-medium text-slate-700" htmlFor="token-role">
                                Role
                              </label>
                              <select
                                id="token-role"
                                className="w-full rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm"
                                value={tokenRole}
                                onChange={(e) => setTokenRole(e.target.value as Token["role"])}
                              >
                                <option value="READ_ONLY">Read only</option>
                                <option value="READ_WRITE">Read & write</option>
                              </select>

                            </div>

                          </div>
                          <div className="text-[12px] text-slate-600">
                            Use <b>Read only</b> for public fetch. Use <b>Read & write</b> only for trusted servers.
                          </div>
                          <Button
                            className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700"
                            onClick={handleCreateToken}
                            disabled={!tokenName.trim() || !activeSite}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {tokenLimitReached ? "Limit reached" : "Create token"}
                          </Button>

                          {tokenLimitReached ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                              One token per site is allowed. Delete the existing token to issue a new one.
                            </div>
                          ) : null}

                          {plainToken ? (
                            <div className="rounded-2xl border border-green-200 bg-green-50 p-3 text-xs text-green-900">
                              <div className="font-semibold text-green-800">Plain token (copy now)</div>
                              <div className="mt-1 break-all rounded-md bg-white px-3 py-2 font-mono text-[11px] text-slate-900 border border-green-200">
                                {plainToken}
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-lg"
                                  onClick={() => copyToClipboard(plainToken, "Plain token copied")}
                                >
                                  <Copy className="mr-2 h-3.5 w-3.5" />
                                  Copy plain token
                                </Button>
                                <span className="text-[11px] text-green-800/80">
                                  Shown only at creation. Store it securely.
                                </span>
                              </div>
                            </div>
                          ) : null}


                        </div>
                      </div>
                      {/* LIST */}
                      <div className="space-y-3">
                        {tokenLoading ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                            Loading tokens…
                          </div>
                        ) : tokens.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                            <KeyRound className="mx-auto h-6 w-6 text-slate-400" />
                            <div className="mt-2 font-semibold text-slate-900">No tokens yet</div>
                            <div className="mt-1 text-sm text-slate-600">
                              Create a token to fetch posts on your website.
                            </div>
                          </div>
                        ) : (
                          tokens.map((t) => {
                            const expires = t.expiresAt ? new Date(t.expiresAt).toLocaleString() : "No expiry";
                            const lastUsed = t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleString() : "Never used";

                            return (
                              <div
                                key={t.id}
                                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0 space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="truncate text-base font-semibold text-slate-900">{t.name}</div>
                                    <Badge
                                      className={cx(
                                        "text-white",
                                        t.role === "READ_WRITE"
                                          ? "bg-cyan-600 hover:bg-cyan-600"
                                          : "bg-slate-600 hover:bg-slate-600"
                                      )}
                                    >
                                      {t.role === "READ_WRITE" ? "READ + WRITE" : "READ ONLY"}
                                    </Badge>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                    <span>Created {new Date(t.createdAt).toLocaleString()}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>Last used {lastUsed}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>Expires {expires}</span>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="text-slate-600">Plain token:</span>
                                    <code className="rounded-lg bg-slate-100 px-2 py-1 text-slate-800 break-all">
                                      {t.plain}
                                    </code>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg"
                                      onClick={() => copyToClipboard(t.plain, "Plain token copied")}
                                    >
                                      <Copy className="mr-2 h-3.5 w-3.5" />
                                      Copy token
                                    </Button>
                                  </div>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full rounded-xl sm:w-auto"
                                  onClick={() => deleteToken(t.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                            );
                          })
                        )}
                      </div>


                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* CREATE SITE */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">Create a site</CardTitle>
                <CardDescription>Use separate sites for prod/staging or brands.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">
                  Use the dedicated creation flow to avoid mixing domains and sites.
                </p>
                <Button asChild className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-700">
                  <Link to="/sites/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Go to create site
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* ESSENTIALS */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">Essentials</CardTitle>
                <CardDescription>Copy IDs and records quickly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!activeSite ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Select a site to view essentials.
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold text-slate-500">Site ID</div>
                      <code className="mt-2 block rounded-xl bg-slate-50 p-2 text-xs text-slate-800 border border-slate-100 break-all">
                        {activeSite.id}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full rounded-xl"
                        onClick={() => copyToClipboard(activeSite.id, "Site ID copied")}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copy site ID
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold text-slate-500">TXT record</div>
                      <code className="mt-2 block rounded-xl bg-slate-50 p-2 text-xs text-slate-800 border border-slate-100 break-all">
                        {primaryDomain ? txtRecord : "Add a domain to see TXT token."}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full rounded-xl"
                        disabled={!primaryDomain}
                        onClick={() => primaryDomain && copyToClipboard(txtRecord, "TXT record copied")}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Copy TXT
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* EMBED GUIDE */}

          </div>

        </div>
        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Embed & API guide</CardTitle>
            <CardDescription>Minimal, copy-paste examples.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase text-slate-500">Fetch posts</div>
              <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-100">
                {`const res = await fetch("${import.meta.env.VITE_API_BASE || "https://your-api.com/api"}/public/posts?siteId=${activeSite?.id ?? "<site-id>"}", {
  headers: { "X-Site-Token": "${plainToken || "<your-site-token>"}" }
});
const { posts } = await res.json();`}
              </pre>
              <div className="mt-2 text-xs text-slate-600">
                Replace <code className="rounded bg-slate-100 px-1.5 py-0.5">&lt;your-site-token&gt;</code>{" "}
                with the plain token shown at creation (not the Token ID). Keep it secret.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase text-slate-500">Single post by slug</div>
              <pre className="mt-2 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-800 border border-slate-100">
                {`await fetch("${import.meta.env.VITE_API_BASE || "https://your-api.com/api"}/public/posts/my-slug?siteId=${activeSite?.id ?? "<site-id>"}", {
  headers: { "X-Site-Token": "${plainToken || "<your-site-token>"}" }
});`}
              </pre>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <div className="text-xs font-semibold uppercase text-cyan-900">Setup checklist</div>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-cyan-900/90">
                <li>Create a site and add your domain.</li>
                <li>Add DNS TXT (or host the HTML file) and click Verify.</li>
                <li>Create a token and store it securely.</li>
                <li>Use <code className="rounded bg-white/70 px-1.5 py-0.5">siteId</code> +{" "}
                  <code className="rounded bg-white/70 px-1.5 py-0.5">X-Site-Token</code> in your requests.</li>
              </ol>
            </div>

            {!isOwner && activeSite ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-semibold">Limited permissions</div>
                    <div className="mt-1 opacity-90">
                      You’re not an OWNER on this site. Some actions like delete/refresh may be disabled.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* CONFIRM: DELETE DOMAIN */}
        <AlertDialog
          open={Boolean(deleteDomainTarget)}
          onOpenChange={(open) => !open && setDeleteDomainTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete domain?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the TXT token and verification for{" "}
                <strong>{deleteDomainTarget?.domain}</strong>. You will need to re-verify if you add it again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteDomainTarget && handleDeleteDomainConfirmed(deleteDomainTarget.id)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CONFIRM: DELETE SITE */}
        <AlertDialog open={deleteSiteOpen} onOpenChange={setDeleteSiteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete site?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the site {activeSite?.name ?? ""}, its domains, tokens, and posts. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteSiteConfirmed}
              >
                Delete site
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
