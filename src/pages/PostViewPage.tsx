import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { buildAssetUrl } from "@/lib/media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/PageHeader";

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
        <PageHeader
          eyebrow="Post viewer"
          title={loading ? "Loading..." : post?.title || "Untitled post"}
          description="Preview the published content as your readers will see it."
          actions={
            <>
              {id ? (
                <Button asChild variant="outline">
                  <Link to={`/posts/${id}/edit`}>Edit post</Link>
                </Button>
              ) : null}
              <Button asChild variant="secondary">
                <Link to="/posts">Back to posts</Link>
              </Button>
            </>
          }
          meta={
            post ? (
              <>
                <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>{post.status}</Badge>
                <span className="rounded-full bg-white/80 px-3 py-1">
                  Updated: {new Date(post.updatedAt).toLocaleString()}
                </span>
                {post.author?.name ? (
                  <span className="rounded-full bg-white/80 px-3 py-1">Author: {post.author.name}</span>
                ) : null}
              </>
            ) : null
          }
        />

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
