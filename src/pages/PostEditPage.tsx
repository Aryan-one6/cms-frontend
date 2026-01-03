import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { uploadCoverImage, generateCoverImage } from "../lib/upload";
import BlogPreview from "../components/BlogPreview";
import RichTextEditor from "../components/RichTextEditor";
import AdminLayout from "@/components/AdminLayout";
import PageHeader from "@/components/PageHeader";
import AuthLoader from "@/components/AuthLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildAssetUrl } from "@/lib/media";
import type { UploadResponse } from "@/lib/upload";
import { useAuth } from "../lib/auth";
import { useSite } from "@/lib/site";
import { generateSeoDraft } from "@/lib/ai";
import { } from "lucide-react";
import { Sparkles, Wand2, Upload, Trash2, Image as ImageIcon, UploadCloud } from "lucide-react";


type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImageUrl?: string;
  contentHtml: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
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
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [tagsText, setTagsText] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const readOnly = !canEdit;
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  function toSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  async function handleGenerate() {
    if (!aiTopic.trim()) {
      setError("Enter a topic to generate a draft.");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const draft = await generateSeoDraft(aiTopic.trim());
      if (draft.title) setTitle(draft.title);
      if (draft.slug && !slugDirty) setSlug(draft.slug);
      if (draft.excerpt) setExcerpt(draft.excerpt);
      if (draft.contentHtml) setContentHtml(draft.contentHtml);
      if (draft.tags?.length) setTagsText(draft.tags.join(", "));
    } catch (err: any) {
      setError(err?.message || "Failed to generate draft");
    } finally {
      setAiLoading(false);
    }
  }

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

  async function handleGenerateImage(customPrompt?: string) {
    if (readOnly) {
      setError("You can only change the cover image on posts you created.");
      return;
    }
    const prompt = (customPrompt || aiTopic || title || excerpt || "blog cover").trim();
    if (!prompt) {
      setError("Enter a prompt to generate a cover image.");
      return;
    }
    setGeneratingImage(true);
    setError("");
    try {
      const { relativeUrl } = await generateCoverImage(prompt, id);
      setCoverImageUrl(relativeUrl);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || "Failed to generate image";
      setError(msg);
    } finally {
      setGeneratingImage(false);
    }
  }

  async function load() {
    if (!id || !activeSite) return;
    try {
      const res = await api.get(`/admin/posts/${id}`);
      const p: Post = res.data.post;

      setPost(p);
      setTitle(p.title);
      setSlug(p.slug || "");
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
        slug: slug || toSlug(title),
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
        <AuthLoader />
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
        <PageHeader
          eyebrow="Edit"
          title="Edit post"
          description="Update content, change the cover, and publish or unpublish instantly."
          actions={
            <>
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
              ) : null}
            </>
          }
          meta={
            <>
              <Badge variant={statusVariant}>{post.status}</Badge>
              {readOnly ? <Badge variant="secondary">View only</Badge> : null}
              <span className="rounded-full bg-white/80 px-3 py-1">
                Updated: {new Date(post.updatedAt).toLocaleString()}
              </span>
            </>
          }
        />

        {readOnly && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are viewing a post authored by {post.author?.name || "another user"}. Editing is disabled for posts you do not own.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <Card className="xl:col-span-1 bg-transparent shadow-none border-0 px-0 w-full">
            <CardHeader>
              <CardTitle>Content & metadata</CardTitle>
              <CardDescription>Keep the SEO basics strong and content polished.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="edit-form" onSubmit={handleSave} className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-5 shadow-sm">

                  {/* background neural glow */}
                  <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

                  {/* header */}
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-cyan-700">
                        AI powered
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        Content generation
                      </div>
                    </div>
                  </div>

                  {/* input + action */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Topic, keywords, or intent…"
                      disabled={aiLoading}
                      className="min-w-[240px] flex-1 rounded-xl border-slate-200 bg-white/90
                 shadow-inner focus-visible:ring-2 focus-visible:ring-cyan-500"
                    />

                    <Button
                      type="button"
                      onClick={handleGenerate}
                      disabled={aiLoading}
                      className="group relative w-full sm:w-auto overflow-hidden rounded-xl
                 bg-gradient-to-br from-cyan-600 via-indigo-600 to-violet-600
                 px-5 py-2.5 text-white shadow-lg transition-all
                 hover:scale-[1.02] hover:shadow-xl
                 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2
                 disabled:scale-100 disabled:opacity-70"
                    >
                      {/* animated glow */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-sm transition-opacity group-hover:opacity-100" />

                      <span className="relative z-10 flex items-center gap-2">
                        <Wand2 className={`h-4 w-4 ${aiLoading ? "animate-pulse" : ""}`} />
                        {aiLoading ? "Generating…" : "Generate with AI"}
                      </span>
                    </Button>
                  </div>

                  {/* helper text */}
                  <p className="mt-3 text-[11px] text-slate-500">
                    AI drafts title, excerpt, and tags instantly. Everything remains fully editable.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!slugDirty) setSlug(toSlug(e.target.value));
                    }}
                    required
                    disabled={readOnly}
                                        className="border-1 border-slate-300 bg-white/50"

                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <Input
                    value={slug}
                                        className="border-1 border-slate-300 bg-white/50"

                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugDirty(true);
                      
                    }}
                    placeholder="my-awesome-post"
                    disabled={readOnly}
                  />
                  <p className="text-xs text-slate-500">Leave blank to auto-generate from the title.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Excerpt</label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                                        className="border-1 border-slate-300 bg-white/50"

                    placeholder="Short description for listings and SEO"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tags</label>
                    <Input
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                                          className="border-1 border-slate-300 bg-white/50"

                      placeholder="design, ui, product"
                      disabled={readOnly}
                    />
                    <p className="text-xs text-slate-500">Comma-separated. Shown as badges on the article.</p>
                  </div>


                </div>

                <div className="relative space-y-2.5 overflow-hidden rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-4 shadow-sm">
                  {/* soft neural glow */}
                  <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />

                  {/* header */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow">
                      <ImageIcon className="h-4 w-4" />
                    </div>

                    <div className="flex-1">
                      <div className="text-[10px] uppercase tracking-widest text-cyan-700">
                        AI powered
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-slate-900">Cover image</div>

                        {/* optional lock badge when readOnly */}
                        {readOnly && (
                          <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            Read-only
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* prompt */}
                  <Input
                    placeholder="Image prompt (optional, used for AI cover)"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={readOnly}
                    className="rounded-xl border-slate-200 bg-white/90 shadow-inner focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-70"
                  />

                  {/* actions */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={readOnly}
                      className="block w-full text-sm text-slate-600 sm:flex-1
        file:mr-3 file:rounded-lg file:border-0
        file:bg-gradient-to-br file:from-slate-900 file:to-slate-800
        file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white
        hover:file:from-slate-800 hover:file:to-slate-700
        disabled:cursor-not-allowed disabled:opacity-70"
                    />

                    <Button
                      type="button"
                      onClick={() => handleGenerateImage(aiTopic)}
                      disabled={generatingImage || readOnly}
                      className="group relative w-full sm:w-auto overflow-hidden rounded-xl
        bg-gradient-to-br from-cyan-600 via-indigo-600 to-violet-600
        px-4 py-2 text-white shadow-lg transition-all
        hover:scale-[1.02] hover:shadow-xl
        focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2
        disabled:scale-100 disabled:opacity-70"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
                      <span className="relative z-10 flex items-center gap-2">
                        <Wand2 className={`h-4 w-4 ${generatingImage ? "animate-pulse" : ""}`} />
                        {generatingImage ? "Generating…" : "AI cover image"}
                      </span>
                    </Button>

                    {coverImageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => !readOnly && setCoverImageUrl("")}
                        disabled={readOnly}
                        className="w-full sm:w-auto rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-70"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>

                  {/* meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span>PNG, JPG up to 5MB</span>
                    {uploading && <span className="text-slate-700">Uploading…</span>}
                    {generatingImage && <span className="text-slate-700">Creating image…</span>}
                  </div>

                  {/* preview */}
                  {coverImageUrl && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                      <img
                        src={coverFullUrl}
                        alt="cover"
                        className="h-36 w-full object-contain bg-slate-50"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Content</label>
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} readOnly={readOnly} />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link to="/posts">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={saving || readOnly} className="w-full sm:w-auto">
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
