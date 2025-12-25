import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { uploadCoverImage } from "../lib/upload";
import BlogPreview from "../components/BlogPreview";
import RichTextEditor from "../components/RichTextEditor";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildAssetUrl } from "@/lib/media";
import type { UploadResponse } from "@/lib/upload";
import { useAuth } from "../lib/auth";
import { useSite } from "@/lib/site";

type Post = {
  id: string;
  title: string;
  excerpt?: string;
  coverImageUrl?: string;
  contentHtml: string;
  status: "DRAFT" | "PUBLISHED";
  tags: { tag: { name: string } }[];
  author: { id: string; name: string };
  canEdit?: boolean;
};

export default function PostEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const { activeSite } = useSite();

  const [post, setPost] = useState<Post | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [tagsText, setTagsText] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const readOnly = !canEdit;

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (readOnly) {
      setError("You can only change the cover image on posts you created.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const { relativeUrl } = (await uploadCoverImage(file)) as UploadResponse; // "/uploads/xxx.png"
      setCoverImageUrl(relativeUrl);
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function load() {
    if (!id || !activeSite) return;
    try {
      const res = await api.get(`/admin/posts/${id}`);
      const p: Post = res.data.post;

      setPost(p);
      setTitle(p.title);
      setExcerpt(p.excerpt || "");
      setContentHtml(p.contentHtml || "<p></p>");
      setCoverImageUrl(p.coverImageUrl || "");
      setTagsText(p.tags.map((t) => t.tag.name).join(", "));
      const allowedFromApi = Boolean(p.canEdit);
      const allowedFromContext = Boolean(
        admin && (admin.role === "SUPER_ADMIN" || admin.id === p.author.id)
      );
      setCanEdit(allowedFromApi || allowedFromContext);
    } catch {
      setError("Unable to load post");
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (readOnly) {
      setError("You can only edit your own posts.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await api.put(`/admin/posts/${id}`, {
        title,
        excerpt: excerpt || undefined,
        coverImageUrl: coverImageUrl || undefined,
        contentHtml,
        tags,
      });

      await load();
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (readOnly) {
      setError("You can only publish posts you created.");
      return;
    }
    try {
      await api.post(`/admin/posts/${id}/publish`);
      await load();
    } catch {
      setError("Failed to publish this post.");
    }
  }

  async function unpublish() {
    if (readOnly) {
      setError("You can only unpublish posts you created.");
      return;
    }
    try {
      await api.post(`/admin/posts/${id}/unpublish`);
      await load();
    } catch {
      setError("Failed to unpublish this post.");
    }
  }

  async function deletePost() {
    if (readOnly) {
      setError("You can only delete posts you created.");
      return;
    }
    if (!confirm("Delete this post permanently?")) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      navigate("/posts");
    } catch {
      setError("Unable to delete this post.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, admin, activeSite?.id]);

  if (!post) {
    return (
      <AdminLayout>
        <div className="p-6 text-sm text-slate-500">Loading post…</div>
      </AdminLayout>
    );
  }

  const previewTags = tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const coverFullUrl = buildAssetUrl(coverImageUrl);
  const statusVariant: "default" | "secondary" = post.status === "PUBLISHED" ? "default" : "secondary";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-slate-400">Edit</p>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">Edit post</h1>
              <Badge variant={statusVariant}>{post.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">Update content, change the cover, and publish or unpublish instantly.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/posts">Back to posts</Link>
            </Button>
            {!readOnly ? (
              <>
                {post.status === "DRAFT" ? (
                  <Button type="button" variant="secondary" onClick={publish}>
                    Publish
                  </Button>
                ) : (
                  <Button type="button" variant="secondary" onClick={unpublish}>
                    Unpublish
                  </Button>
                )}
                <Button type="button" variant="destructive" onClick={deletePost}>
                  Delete
                </Button>
                <Button type="submit" form="edit-form" disabled={saving || readOnly}>
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </>
            ) : (
              <Badge variant="secondary">View only</Badge>
            )}
          </div>
        </div>

        {readOnly && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are viewing a post authored by {post.author?.name || "another user"}. Editing is disabled for posts you do not own.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Content & metadata</CardTitle>
              <CardDescription>Keep the SEO basics strong and content polished.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="edit-form" onSubmit={handleSave} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={readOnly} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Excerpt</label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Short description for listings and SEO"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tags</label>
                    <Input
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder="design, ui, product"
                      disabled={readOnly}
                    />
                    <p className="text-xs text-slate-500">Comma-separated. Shown as badges on the article.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Cover image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                      disabled={readOnly}
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>PNG, JPG up to 5MB.</span>
                      {uploading && <span className="text-slate-700">Uploading…</span>}
                    </div>
                    {coverImageUrl && (
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <img src={coverFullUrl} alt="cover" className="h-36 w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Content</label>
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} readOnly={readOnly} />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/posts">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={saving || readOnly}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4 xl:sticky xl:top-6">
            <BlogPreview
              title={title}
              excerpt={excerpt}
              coverImageUrl={coverImageUrl}
              contentHtml={contentHtml}
              tags={previewTags}
            />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Status & publishing</CardTitle>
                <CardDescription>Quick actions for this post.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Status</span>
                  <Badge variant={statusVariant}>{post.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!readOnly ? (
                    <>
                      {post.status === "DRAFT" ? (
                        <Button size="sm" variant="secondary" type="button" onClick={publish}>
                          Publish now
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" type="button" onClick={unpublish}>
                          Move to draft
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" type="button" onClick={deletePost}>
                        Delete
                      </Button>
                    </>
                  ) : (
                    <div className="text-xs text-amber-700">
                      This post belongs to another user. Publishing controls are disabled.
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">Save changes before publishing to keep preview in sync.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
