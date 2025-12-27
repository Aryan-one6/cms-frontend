import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { buildAssetUrl } from "@/lib/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Post = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  coverImageUrl?: string | null;
  excerpt?: string | null;
  contentHtml?: string | null;
  updatedAt: string;
  author?: { name?: string | null };
};

export default function PostViewPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/admin/posts/${id}`);
        setPost(res.data.post);
      } catch {
        setError("Unable to load this post.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-slate-500">Post viewer</div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {loading ? "Loading…" : post?.title || "Untitled post"}
            </h1>
            {post && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>{post.status}</Badge>
                <span>Updated {new Date(post.updatedAt).toLocaleString()}</span>
                {post.author?.name ? <span>• Author: {post.author.name}</span> : null}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {id ? (
              <Link to={`/posts/${id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit post
                </Button>
              </Link>
            ) : null}
            <Link to="/posts">
              <Button size="sm" variant="secondary">
                Back to posts
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Loading post…</div>
        ) : !post ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Post not found.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {post.coverImageUrl ? (
              <img
                src={buildAssetUrl(post.coverImageUrl)}
                alt="cover"
                className="h-64 w-full object-cover"
              />
            ) : null}

            <div className="space-y-4 p-6">
              {post.excerpt ? (
                <p className="text-sm text-slate-600 leading-relaxed">{post.excerpt}</p>
              ) : null}

              <Separator />

              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>No content.</p>" }}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
