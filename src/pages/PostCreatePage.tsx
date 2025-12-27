import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import RichTextEditor from "../components/RichTextEditor";
import { uploadCoverImage } from "../lib/upload";
import BlogPreview from "../components/BlogPreview";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAssetUrl } from "@/lib/media";
import type { UploadResponse } from "@/lib/upload";
import { generateSeoDraft } from "@/lib/ai";

export default function PostCreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugDirty, setSlugDirty] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("<p></p>");
  const [tagsText, setTagsText] = useState(""); // comma separated
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { relativeUrl } = (await uploadCoverImage(file)) as UploadResponse; // returns both relative & absolute
      setCoverImageUrl(relativeUrl); // store relative for API/DB
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function toSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.post("/admin/posts", {
        title,
        slug: slug || toSlug(title),
        excerpt: excerpt || undefined,
        coverImageUrl: coverImageUrl || undefined,
        contentHtml,
        tags,
      });

      navigate(`/posts/${res.data.post.id}/edit`);
    } catch (err: any) {
      setError("Failed to create post");
    } finally {
      setSaving(false);
    }
  }

  const tagList = tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const coverFullUrl = buildAssetUrl(coverImageUrl);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-wide text-slate-400">Compose</p>
            <h1 className="text-2xl font-semibold text-slate-900">Create new post</h1>
            <p className="text-sm text-slate-500">Draft your article, add metadata, and preview it live.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/posts">Back to posts</Link>
            </Button>
            <Button type="submit" form="post-form" disabled={saving}>
              {saving ? "Creating..." : "Publish draft"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Post details</CardTitle>
              <CardDescription>Title, summary, tags, cover image, and the main content.</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="post-form" onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Title</label>
                  <Input
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTitle(val);
                      if (!slugDirty) setSlug(toSlug(val));
                    }}
                    placeholder="A captivating title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugDirty(true);
                    }}
                    placeholder="my-awesome-post"
                  />
                  <p className="text-xs text-slate-500">Used in URLs. Leave blank to auto-generate from the title.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Excerpt</label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Short description for listings and SEO"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tags</label>
                    <Input
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder="design, ui, product"
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
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/posts">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Creating..." : "Create post"}
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
              tags={tagList}
            />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Publishing tips</CardTitle>
                <CardDescription>Use tags for discovery and keep the excerpt concise.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-500">
                <div>
                  Preview updates automatically while you type. Publish as a draft now and finalize later.
                </div>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-semibold text-slate-700">AI helper</div>
                  <Input
                    placeholder="Topic for SEO draft"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    disabled={aiLoading}
                    className="rounded-lg"
                  />
                  <Button
                    size="sm"
                    className="w-full rounded-lg"
                    onClick={handleGenerate}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "Generating…" : "Generate SEO draft"}
                  </Button>
                  <div className="text-[11px] text-slate-500">
                    Fills title, slug, excerpt, tags, and content automatically.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
