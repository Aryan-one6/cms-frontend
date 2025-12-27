import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { api } from "../lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSite } from "@/lib/site";

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

function PostList({
  title,
  posts,
  emptyText,
}: {
  title: string;
  posts: PostSummary[];
  emptyText: string;
}) {
  return (
    <Card className="border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        <CardDescription>Latest updates in this list.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Link to={`/posts/${p.id}/edit`} className="text-sm font-semibold text-slate-900 hover:text-cyan-700">
                    {p.title}
                  </Link>
                  <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>{p.status}</Badge>
                  {p.isMine ? <Badge variant="outline">Yours</Badge> : null}
                </div>
                <div className="text-xs text-slate-500">
                  Updated {new Date(p.updatedAt).toLocaleString()} · by {p.author?.name ?? "Unknown"}
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to={`/posts/${p.id}/edit`}>{p.isMine ? "Edit" : "View"}</Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-8">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                Dashboard
              </Badge>
              <h1 className="text-3xl font-semibold leading-tight">Sapphire CMS Portal</h1>
              <p className="max-w-2xl text-sm text-white/90">
                Welcome{data?.admin?.name ? `, ${data.admin.name}` : ""}. Manage your sites, verify ownership,
                and publish content that stays yours.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="bg-white text-cyan-700 hover:bg-white/90">
                  <Link to="/posts/new">Create post</Link>
                </Button>
                <Button asChild className="bg-transparent outline-1 border-1 text-white-700 hover:bg-cyan-500">
                  <Link to="/posts">View posts</Link>
                </Button>
              </div>
            </div>
            {stats && (
              <div className="rounded-xl bg-white px-4 py-3 text-sm text-primary shadow-sm">
                <div className="text-xs uppercase tracking-[0.2em] ">Your activity</div>
                <div className="mt-1 font-medium">
                  {stats.myPublished} published · {stats.myDrafts} drafts
                </div>
                <div className="text-xs text-gray-600">Team posts: {stats.teamPosts}</div>
                <div className="text-xs text-gray-600">
                  Domains verified: {domainPulse.verified}/{domainPulse.total}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!activeSite && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="py-4 text-sm text-orange-800">
              No active site yet. Create one from Sites to start posting and issuing tokens.
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600">Total posts</CardTitle>
              <CardDescription>Across your workspace</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-slate-900">
              {loading ? "…" : stats?.totalPosts ?? 0}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600">Posts you created</CardTitle>
              <CardDescription>Published + drafts</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-slate-900">
              {loading ? "…" : stats?.myPosts ?? 0}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600">Published by you</CardTitle>
              <CardDescription>Live articles</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-slate-900">
              {loading ? "…" : stats?.myPublished ?? 0}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-600">Team posts</CardTitle>
              <CardDescription>Created by others</CardDescription>
            </CardHeader>
            <CardContent className="text-3xl font-semibold text-slate-900">
              {loading ? "…" : stats?.teamPosts ?? 0}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <PostList
            title="Your recent posts"
            posts={data?.myRecentPosts ?? []}
            emptyText="You haven't created any posts yet."
          />
          <PostList
            title="Teammates' posts"
            posts={data?.teamRecentPosts ?? []}
            emptyText="No posts from teammates yet."
          />
        </div>

        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Recent activity</CardTitle>
            <CardDescription>Latest updates from everyone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.recentActivity ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">{loading ? "Loading activity…" : "No recent updates yet."}</p>
            ) : (
              (data?.recentActivity ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link to={`/posts/${item.id}/edit`} className="text-sm font-semibold text-slate-900 hover:text-cyan-700">
                        {item.title}
                      </Link>
                      <Badge variant={item.status === "PUBLISHED" ? "default" : "secondary"}>{item.status}</Badge>
                      {item.isMine ? <Badge variant="outline">Yours</Badge> : <Badge variant="secondary">Team</Badge>}
                    </div>
                    <div className="text-xs text-slate-500">
                      Updated {new Date(item.updatedAt).toLocaleString()} · by {item.author?.name ?? "Unknown"}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={`/posts/${item.id}/edit`}>{item.isMine ? "Edit" : "View"}</Link>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
