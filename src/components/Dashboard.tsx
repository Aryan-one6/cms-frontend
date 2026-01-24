import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { admin } = useAuth();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-8">
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-white/20 text-white">
                Home
              </Badge>
              <h1 className="text-3xl font-semibold leading-tight">
                Welcome back{admin?.name ? `, ${admin.name}` : ""}.
              </h1>
              <p className="max-w-2xl text-sm text-white/90">
                Plan, publish, and manage content with live previews and streamlined workflows in one place.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild className="bg-white text-cyan-700 hover:bg-white/90">
                  <Link to="/posts/new">Create post</Link>
                </Button>
                <Button asChild className="bg-white text-cyan-700 hover:bg-white/90">
                  <Link to="/posts">View posts</Link>
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="rounded-xl bg-white/15 px-4 py-3 text-sm text-white/90 shadow-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-white/70">Workspace</div>
                <div className="mt-1 font-medium">Triad CMS · Content Ops</div>
                <div className="text-xs text-white/80">Aligned to cyan theme</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className="border-cyan-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                🚀 Start writing
              </CardTitle>
              <CardDescription>Open the composer with live preview.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Draft your next article and polish it before publishing.</div>
              <Button asChild size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                <Link to="/posts/new">New post</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-cyan-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                📚 Manage posts
              </CardTitle>
              <CardDescription>Keep drafts and published articles organized.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Edit, publish, or unpublish in one place.</div>
              <Button asChild size="sm" variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                <Link to="/posts">Open list</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 xl:col-span-1 border-cyan-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                💡 Tips
              </CardTitle>
              <CardDescription>Use tags and excerpts for better discovery.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>• Keep titles under 70 characters for clean previews.</p>
              <p>• Add a strong cover image to lift click-throughs.</p>
              <p>• Save often, then publish or unpublish with one click.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
