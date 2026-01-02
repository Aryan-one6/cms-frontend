import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { useSite } from "@/lib/site";
import { api } from "@/lib/api";
import { Copy } from "lucide-react";

export default function NewSitePage() {
  const { createSite } = useSite();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showToken, setShowToken] = useState("");

  async function handleCreate() {
    if (!name.trim() || !domain.trim()) {
      setError("Enter a site name and primary domain.");
      return;
    }
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const newId = await createSite({ name: name.trim(), domain: domain.trim() });
      let token = "";
      if (newId) {
        const res = await api.get(`/admin/sites/${newId}/domains`);
        const dom = (res.data.domains as Array<{ domain: string; verificationToken: string }> | undefined)?.find(
          (d) => d.domain === domain.trim().toLowerCase()
        );
        token = dom?.verificationToken ?? "";
      }
      setShowToken(token ? `sapphire-site-verification=${token}` : "sapphire-site-verification=<your-token>");
      setNotice("Site created. TXT record generated for this domain — verify it next.");
      setName("");
      setDomain("");
      navigate("/sites");
    } catch (err) {
      console.error(err);
      const msg = (err as any)?.response?.data?.message;
      setError(msg || "Unable to create site. Only authorized admins can create sites.");
    } finally {
      setLoading(false);
    }
  }

  function copy(val: string) {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(val);
    setNotice("Copied");
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <PageHeader
          eyebrow={<Badge className="bg-cyan-600 text-white">New</Badge>}
          title="Create a site"
          description="Add your primary domain now so verification can begin immediately."
        />
      </div>

      {(error || notice) && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle>Site details</CardTitle>
            <CardDescription>Attach the primary domain now so verification can start immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600" htmlFor="new-site-name">
                Site name
              </label>
              <Input
                id="new-site-name"
                placeholder="Marketing site"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600" htmlFor="new-site-domain">
                Primary domain
              </label>
              <Input
                id="new-site-domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-[12px] text-slate-500">
                We will generate a TXT token for this domain right after creation.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="rounded-xl bg-cyan-600 hover:bg-cyan-700"
            >
              {loading ? "Creating…" : "Create site"}
            </Button>
            <p className="text-xs text-slate-500">
              After creation you'll be redirected to the Sites page to verify DNS/HTML and issue tokens.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Why a separate page?</CardTitle>
              <CardDescription>Keep site creation isolated to avoid mixing domains and tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                - Add a site and its primary domain in one step.
                <br />
                - We attach the domain immediately and generate a DNS TXT token.
                <br />
                - Then manage verification and tokens per-site on the Sites page.
              </div>
              <Separator />
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Sample TXT format</div>
                <code className="block rounded-xl bg-slate-50 p-2 text-xs text-slate-800 border border-slate-100 break-all">
                  sapphire-site-verification=&lt;your-token&gt;
                </code>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => copy(showToken || "sapphire-site-verification=<your-token>")}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy format
                  </Button>
                  <Link to="/sites" className="text-sm text-cyan-700 underline">
                    Back to Sites
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
