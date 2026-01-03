import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import { api } from "../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSite } from "@/lib/site";
import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Globe,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

type PostSummary = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  publishedAt?: string | null;
  author: { id: string; name: string };
  isMine?: boolean;
};

type DashboardData = {
  admin: { id: string; name: string; email: string; role: string; createdAt: string };
  stats: { totalPosts: number; myPosts: number; myPublished: number; myDrafts: number; teamPosts: number };
  myRecentPosts: PostSummary[];
  teamRecentPosts: PostSummary[];
  recentActivity: PostSummary[];
};

type DomainPulse = {
  total: number;
  verified: number;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { activeSite } = useSite();
  const [domainPulse, setDomainPulse] = useState<DomainPulse>({ total: 0, verified: 0 });

  useEffect(() => {
    async function load() {
      if (!activeSite) {
        setLoading(false);
        setData(null);
        setDomainPulse({ total: 0, verified: 0 });
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/admin/dashboard");
        setData(res.data);
        const domRes = await api.get(`/admin/sites/${activeSite.id}/domains`);
        const domains = (domRes.data?.domains as any[]) ?? [];
        setDomainPulse({
          total: domains.length,
          verified: domains.filter((d) => d.status === "VERIFIED").length,
        });
      } catch {
        setError("Unable to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeSite?.id]);

  const stats = data?.stats;
  const totalPosts = stats?.totalPosts ?? 0;
  const myPosts = stats?.myPosts ?? 0;
  const myPublished = stats?.myPublished ?? 0;
  const myDrafts = stats?.myDrafts ?? 0;
  const publishRate = myPosts ? Math.round((myPublished / myPosts) * 100) : 0;
  const draftRate = myPosts ? Math.round((myDrafts / myPosts) * 100) : 0;
  const domainRate = domainPulse.total ? Math.round((domainPulse.verified / domainPulse.total) * 100) : 0;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <PageHeader
          eyebrow={
            <Badge variant="secondary" className="w-fit gap-2 bg-slate-900 text-white">
              <Sparkles className="h-3 w-3" /> AI-powered CMS
            </Badge>
          }
          title="Sapphire AI Command Center"
          description={
            <>
              Welcome{data?.admin?.name ? `, ${data.admin.name}` : ""}. Orchestrate content, automate
              cover art, and publish with verified trust signals across {activeSite?.name ?? "your sites"}.
            </>
          }
          actions={
            <>
              <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                <Link to="/posts/new">Generate a new post</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/posts">Review drafts</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/sites">Verify domains</Link>
              </Button>
              <Button asChild variant="ghost" className="text-slate-700 hover:text-slate-900">
                <Link to="/pricing">Upgrade AI limits</Link>
              </Button>
            </>
          }
          meta={
            <>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Active site: {activeSite?.name ?? "Select a site"}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">
                Domains verified: {domainPulse.verified}/{domainPulse.total}
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1">Publish rate: {publishRate}%</span>
              <span className="rounded-full bg-white/80 px-3 py-1">Draft velocity: {draftRate}%</span>
            </>
          }
          aside={
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    AI signal board
                  </div>
                  <div className="font-display text-base font-semibold text-slate-900">
                    Workspace intelligence
                  </div>
                </div>
                <div className="rounded-full bg-cyan-50 p-1.5 text-cyan-700">
                  <BarChart3 className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="mt-3 space-y-3 text-sm">
                {/* Content readiness */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Content readiness</span>
                    <span>{publishRate}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-cyan-600"
                      style={{ width: `${publishRate}%` }}
                    />
                  </div>
                </div>

                {/* Domain coverage */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Domain coverage</span>
                    <span>{domainRate}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${domainRate}%` }}
                    />
                  </div>
                </div>

                {/* AI stack */}
                <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500">
                    AI stack
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    Draft + Cover + SEO
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Automation modules active
                  </div>
                </div>
              </div>
            </>

          }
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!activeSite && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-orange-800">
              <div>
                <div className="font-semibold">No active site yet.</div>
                <div className="text-xs text-orange-700">Create your first site to start posting and issuing tokens.</div>
              </div>
              <Button asChild size="sm" className="bg-orange-600 text-white hover:bg-orange-700">
                <Link to="/sites">Create a site</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {activeSite && domainPulse.verified === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm text-yellow-800">
              Your domain is not verified yet. Go to Sites, copy the TXT record, and click Verify. Content
              delivery and tokens are scoped per verified site.
              <Button asChild size="sm" variant="outline">
                <Link to="/sites">Go to Sites</Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
          <Card>
            <CardContent className="space-y-1.5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                  Total posts
                </span>
                <span className="rounded-full bg-gradient-to-br from-cyan-400/40 to-indigo-500/30 p-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-900" />
                </span>
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {loading ? "…" : totalPosts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1.5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                  Published
                </span>
                <span className="rounded-full bg-gradient-to-br from-emerald-400/40 to-cyan-500/30 p-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-900" />
                </span>
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {loading ? "…" : myPublished}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1.5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                  Drafts
                </span>
                <span className="rounded-full bg-gradient-to-br from-sky-400/40 to-indigo-400/30 p-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-slate-900" />
                </span>
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {loading ? "…" : myDrafts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-1.5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                  Domains
                </span>
                <span className="rounded-full bg-gradient-to-br from-slate-200/40 to-slate-500/30 p-1.5">
                  <Globe className="h-3.5 w-3.5 text-slate-900" />
                </span>
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {loading ? "…" : `${domainPulse.verified}/${domainPulse.total}`}
              </div>
            </CardContent>
          </Card>
        </div>


        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <Card className="border-slate-100 bg-slate-50/60">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold text-slate-900">AI launchpad</CardTitle>
              <CardDescription>High-impact moves your copilot recommends.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Generate a draft with AI",
                  description: "Outline, title, excerpt, and tags in one pass.",
                  link: "/posts/new",
                  icon: Wand2,
                },
                {
                  title: "Create on-brand cover art",
                  description: "Use a prompt to build consistent visuals.",
                  link: "/posts/new",
                  icon: Sparkles,
                },
                {
                  title: "Verify delivery domains",
                  description: "Keep public endpoints secure and validated.",
                  link: "/sites",
                  icon: Globe,
                },
                {
                  title: "Upgrade AI throughput",
                  description: "Unlock unlimited posts and sites.",
                  link: "/pricing",
                  icon: Zap,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.link}
                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-cyan-100 hover:bg-cyan-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-700 group-hover:bg-cyan-100 group-hover:text-cyan-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.description}</div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-cyan-700" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base font-semibold text-slate-900">Automation pipeline</CardTitle>
              <CardDescription>Keep every step AI-assisted and verified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-cyan-600" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">AI draft + metadata</div>
                  <div className="text-xs text-slate-500">Generate titles, excerpts, and tags in one go.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-slate-900" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Image generation</div>
                  <div className="text-xs text-slate-500">Create 16:9 covers to match your publishing format.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 rounded-full bg-sky-500" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">Tokenized delivery</div>
                  <div className="text-xs text-slate-500">Secure public fetch with site tokens and domains.</div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-cyan-600" />
                  <span>AI cadence: {myPublished} published · {myDrafts} drafts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>




      </div>
    </AdminLayout>
  );
}
