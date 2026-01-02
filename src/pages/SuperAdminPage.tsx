import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
// import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Trash2, ShieldCheck, UserCheck, PauseCircle } from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
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

export default function SuperAdminPage() {
  const { admin } = useAuth();
  const [tab, setTab] = useState<"users" | "sites" | "posts">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [error, setError] = useState("");

  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "EDITOR" as "EDITOR" | "SUPER_ADMIN" });

  const isSuper = admin?.role === "SUPER_ADMIN";

  const activeUsers = useMemo(() => users.filter((u) => u.status === "ACTIVE").length, [users]);
  const activeSites = useMemo(() => sites.filter((s) => s.status === "ACTIVE").length, [sites]);

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

  useEffect(() => {
    if (!isSuper) return;
    if (tab === "users") loadUsers();
    if (tab === "sites") loadSites();
    if (tab === "posts") loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isSuper]);

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

  if (!isSuper) {
    return (
      <AdminLayout>
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="h-5 w-5" />
          <div>You are not authorized to view the Super Admin dashboard.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Control center"
          description="Manage users, sites, and posts with full access."
          meta={
            <>
              <Badge className="bg-cyan-600 text-white">
                <ShieldCheck className="mr-1 h-4 w-4" />
                Active users: {activeUsers}
              </Badge>
              <Badge variant="secondary">Active sites: {activeSites}</Badge>
            </>
          }
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <Card className="border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Administration</CardTitle>
            <CardDescription className="text-sm">Full visibility and controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-slate-100">
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="sites">Sites</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-3">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900 truncate">{u.name}</div>
                            <Badge variant="secondary">{u.email}</Badge>
                            <Badge className={u.role === "SUPER_ADMIN" ? "bg-cyan-600 text-white" : ""}>{u.role}</Badge>
                            <Badge variant={u.status === "ACTIVE" ? "default" : "destructive"}>{u.status}</Badge>
                          </div>
                          <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                            <span>Sites: {u._count?.memberships ?? 0}</span>
                            <span className="text-slate-300">•</span>
                            <span>Posts: {u._count?.posts ?? 0}</span>
                            <span className="text-slate-300">•</span>
                            <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() =>
                              updateUser(u.id, { status: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })
                            }
                          >
                            <PauseCircle className="mr-2 h-4 w-4" />
                            {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => updateUser(u.id, { role: u.role === "EDITOR" ? "SUPER_ADMIN" : "EDITOR" })}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Role: {u.role === "EDITOR" ? "Make super" : "Make editor"}
                          </Button>
                          <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => deleteUser(u.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                        onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as any }))}
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
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => updateSiteStatus(s.id, s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                      >
                        <PauseCircle className="mr-2 h-4 w-4" />
                        {s.status === "ACTIVE" ? "Suspend" : "Activate"}
                      </Button>
                      <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => deleteSite(s.id)}>
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
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
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
                    <Button variant="destructive" size="sm" className="rounded-lg" onClick={() => deletePost(p.id)}>
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
    </AdminLayout>
  );
}
