import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildAssetUrl } from "@/lib/media";
import { useSite } from "@/lib/site";

type Post = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  coverImageUrl?: string;
  author: { id: string; name: string };
  isMine: boolean;
  canEdit: boolean;
};

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { activeSite } = useSite();

  async function loadPosts() {
    if (!activeSite) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/posts");
      setPosts(res.data.posts);
    } catch {
      setError("Unable to load posts right now.");
    } finally {
      setLoading(false);
    }
  }

  async function publish(id: string) {
    const target = posts.find((p) => p.id === id);
    if (target && !target.canEdit) {
      alert("You can only publish posts you created.");
      return;
    }

    try {
      await api.post(`/admin/posts/${id}/publish`);
      loadPosts();
    } catch {
      alert("Unable to publish this post.");
    }
  }

  async function unpublish(id: string) {
    const target = posts.find((p) => p.id === id);
    if (target && !target.canEdit) {
      alert("You can only unpublish posts you created.");
      return;
    }

    try {
      await api.post(`/admin/posts/${id}/unpublish`);
      loadPosts();
    } catch {
      alert("Unable to unpublish this post.");
    }
  }

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite?.id]);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Blog Posts</h2>
          <p className="text-sm text-slate-500">
            See which posts are yours and which were created by teammates for {activeSite?.name ?? "this site"}.
          </p>
        </div>

        <Link to="/posts/new">
          <Button>Create Post</Button>
        </Link>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[150px]">Owner</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[180px]">Updated</TableHead>
              <TableHead className="w-[260px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                  No posts yet.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.coverImageUrl ? (
                      <img src={buildAssetUrl(p.coverImageUrl)} alt="cover" className="h-12 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-12 w-20 rounded-md bg-slate-100" />
                    )}
                  </TableCell>

                  <TableCell className="font-medium">{p.title}</TableCell>

                  <TableCell className="text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>{p.isMine ? "You" : p.author?.name || "Unknown"}</span>
                      {p.isMine ? (
                        <Badge variant="outline">Yours</Badge>
                      ) : (
                        <Badge variant="secondary">Team</Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-slate-600">
                    {new Date(p.updatedAt).toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Link to={`/posts/${p.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          title={p.canEdit ? "Edit your post" : "View only — owned by someone else"}
                        >
                          {p.canEdit ? "Edit" : "View"}
                        </Button>
                      </Link>

                      {p.canEdit && (
                        <>
                          {p.status === "DRAFT" ? (
                            <Button size="sm" onClick={() => publish(p.id)}>
                              Publish
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => unpublish(p.id)}>
                              Unpublish
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
