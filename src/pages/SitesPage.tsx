import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSite } from "@/lib/site";
import { api } from "@/lib/api";

type Token = {
  id: string;
  name: string;
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

export default function SitesPage() {
  const { sites, activeSite, selectSite, createSite } = useSite();
  const [newSiteName, setNewSiteName] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenRole, setTokenRole] = useState<Token["role"]>("READ_ONLY");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [plainToken, setPlainToken] = useState("");
  const [error, setError] = useState("");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainInput, setDomainInput] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);

  async function loadTokens() {
    if (!activeSite) return;
    setTokenLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/sites/${activeSite.id}/tokens`);
      setTokens(res.data.tokens);
    } catch {
      setError("Unable to load API tokens for this site.");
    } finally {
      setTokenLoading(false);
    }
  }

  async function loadDomains() {
    if (!activeSite) return;
    setDomainLoading(true);
    setError("");
    try {
      const res = await api.get(`/admin/sites/${activeSite.id}/domains`);
      setDomains(res.data.domains);
    } catch {
      setError("Unable to load domains for this site.");
    } finally {
      setDomainLoading(false);
    }
  }

  async function handleCreateSite() {
    if (!newSiteName.trim()) return;
    await createSite({ name: newSiteName.trim() });
    setNewSiteName("");
  }

  async function handleCreateToken() {
    if (!activeSite || !tokenName.trim()) return;
    try {
      const res = await api.post(`/admin/sites/${activeSite.id}/tokens`, {
        name: tokenName.trim(),
        role: tokenRole,
      });
      setPlainToken(res.data.plainToken);
      setTokenName("");
      await loadTokens();
    } catch {
      setError("Unable to create token. Only site owners can manage tokens.");
    }
  }

  async function deleteToken(id: string) {
    if (!activeSite) return;
    try {
      await api.delete(`/admin/sites/${activeSite.id}/tokens/${id}`);
      await loadTokens();
    } catch {
      setError("Unable to delete token.");
    }
  }

  async function addDomain() {
    if (!activeSite || !domainInput.trim()) return;
    try {
      await api.post(`/admin/sites/${activeSite.id}/domains`, { domain: domainInput.trim() });
      setDomainInput("");
      await loadDomains();
    } catch {
      setError("Unable to add domain. Only site owners can manage domains.");
    }
  }

  async function verifyDomain(domainId: string) {
    if (!activeSite) return;
    try {
      await api.post(`/admin/sites/${activeSite.id}/domains/${domainId}/verify`);
      await loadDomains();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Verification failed. Check DNS TXT record.";
      setError(msg);
    }
  }

  async function refreshDomainToken(domainId: string) {
    if (!activeSite) return;
    try {
      await api.post(`/admin/sites/${activeSite.id}/domains/${domainId}/refresh-token`);
      await loadDomains();
    } catch {
      setError("Unable to refresh token.");
    }
  }

  useEffect(() => {
    loadTokens();
    loadDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite?.id]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Sites</h1>
            <p className="text-sm text-slate-500">Switch sites, create new ones, and manage API tokens.</p>
          </div>
          <div className="flex gap-2">
            <select
              className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
              value={activeSite?.id || ""}
              onChange={(e) => selectSite(e.target.value)}
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button onClick={loadTokens} variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Create a new site</CardTitle>
              <CardDescription>Spin up another site for a new domain or environment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600" htmlFor="site-name">
                  Site name
                </label>
                <Input
                  id="site-name"
                  placeholder="Marketing site"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateSite} disabled={!newSiteName.trim()}>
                Create site
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Active site details</CardTitle>
              <CardDescription>Slug and environment details for the selected site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              {activeSite ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Name</span>
                    <span className="font-medium">{activeSite.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Slug</span>
                    <code className="rounded bg-slate-100 px-2 py-1 text-xs">{activeSite.slug}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Role</span>
                    <Badge variant="secondary">{activeSite.membershipRole || "EDITOR"}</Badge>
                  </div>
                </>
              ) : (
                <p className="text-slate-500">No site selected.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Domains & verification</CardTitle>
              <CardDescription>Add your domain and verify via DNS TXT record.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  placeholder="yourdomain.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
                <Button onClick={addDomain} disabled={!domainInput.trim()}>
                  Add domain
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Create a DNS TXT record: <code className="bg-slate-100 px-1">sapphire-site-verification=&lt;token&gt;</code>
              </p>
              {domainLoading ? (
                <p className="text-sm text-slate-500">Loading domains…</p>
              ) : domains.length === 0 ? (
                <p className="text-sm text-slate-500">No domains added yet.</p>
              ) : (
                <div className="space-y-3">
                  {domains.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{d.domain}</span>
                            <Badge
                              variant={
                                d.status === "VERIFIED" ? "default" : d.status === "FAILED" ? "destructive" : "secondary"
                              }
                            >
                              {d.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500">
                            TXT: sapphire-site-verification={d.verificationToken}
                          </div>
                          {d.verifiedAt ? (
                            <div className="text-xs text-slate-500">
                              Verified {new Date(d.verifiedAt).toLocaleString()}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => refreshDomainToken(d.id)}>
                            Refresh token
                          </Button>
                          <Button size="sm" onClick={() => verifyDomain(d.id)}>
                            Verify DNS
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">API tokens</CardTitle>
            <CardDescription>Use these tokens from your websites to fetch published content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2 space-y-3">
                {tokenLoading ? (
                  <p className="text-sm text-slate-500">Loading tokens…</p>
                ) : tokens.length === 0 ? (
                  <p className="text-sm text-slate-500">No tokens yet.</p>
                ) : (
                  tokens.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{t.name}</span>
                          <Badge variant="secondary">{t.role}</Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          Created {new Date(t.createdAt).toLocaleString()}
                          {t.lastUsedAt ? ` · Last used ${new Date(t.lastUsedAt).toLocaleString()}` : ""}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => deleteToken(t.id)}>
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600" htmlFor="token-name">
                    Token name
                  </label>
                  <Input
                    id="token-name"
                    placeholder="Production site token"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                  />
                  <label className="text-xs font-medium text-slate-600" htmlFor="token-role">
                    Role
                  </label>
                  <select
                    id="token-role"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                    value={tokenRole}
                    onChange={(e) => setTokenRole(e.target.value as Token["role"])}
                  >
                    <option value="READ_ONLY">Read only</option>
                    <option value="READ_WRITE">Read & write</option>
                  </select>
                  <Button className="w-full" onClick={handleCreateToken} disabled={!tokenName.trim()}>
                    Create token
                  </Button>
                  {plainToken && (
                    <div className="rounded-md bg-white px-2 py-2 text-xs text-slate-700">
                      <div className="font-semibold">Copy your new token</div>
                      <code className="break-all">{plainToken}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
