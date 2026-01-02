import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import RichTextEditor from "../components/RichTextEditor";
import { uploadCoverImage, generateCoverImage } from "../lib/upload";
import BlogPreview from "../components/BlogPreview";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [generatingImage, setGeneratingImage] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

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
      const msg = err?.response?.data?.message || err?.response?.data?.detail || "Failed to create post";
      setError(msg);
      if (typeof msg === "string" && msg.toLowerCase().includes("free plan limit")) {
        setShowPaywall(true);
      }
    } finally {
      setSaving(false);
    }
  }

  const tagList = tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const coverFullUrl = buildAssetUrl(coverImageUrl);

  async function handleGenerateImage(customPrompt?: string) {
    const prompt = (customPrompt || aiTopic || title || excerpt || "blog cover").trim();
    if (!prompt) {
      setError("Enter a prompt to generate a cover image.");
      return;
    }
    setGeneratingImage(true);
    setError("");
    try {
      const { relativeUrl } = await generateCoverImage(prompt);
      setCoverImageUrl(relativeUrl);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || "Failed to generate image";
      setError(msg);
    } finally {
      setGeneratingImage(false);
    }
  }

  async function handleGenerate() {
    const topic = (aiTopic || title).trim();
    if (!topic) {
      setError("Enter a topic or starter title to generate a draft.");
      return;
    }
    if (!aiTopic.trim()) setAiTopic(topic);
    setAiLoading(true);
    setError("");
    try {
      const draft = await generateSeoDraft(topic);
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
        <PageHeader
          eyebrow="Compose"
          title="Create new post"
          description="Draft your article, add metadata, and preview it live."
          actions={
            <>
              <Button variant="outline" asChild>
                <Link to="/posts">Back to posts</Link>
              </Button>
              <Button type="submit" form="post-form" disabled={saving}>
                {saving ? "Creating..." : "Publish draft"}
              </Button>
            </>
          }
          aside={
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Publishing tips</div>
              <div className="text-sm font-semibold text-slate-900">Keep the excerpt focused</div>
              <div className="text-xs text-slate-500">
                Use tags for discovery and preview updates automatically while you type. Publish as a draft now and
                finalize later.
              </div>
            </div>
          }
        />

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
                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="Topic or keywords for AI draft"
                      disabled={aiLoading}
                      className="min-w-[240px] flex-1 rounded-md"
                    />
                    <Button
                      type="button"
                      onClick={handleGenerate}
                      disabled={aiLoading}
                      className="w-full whitespace-nowrap sm:w-auto"
                    >
                      {aiLoading ? "Generating…" : "Generate content"}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Fills all fields with an AI draft (title up to 12 words, excerpt up to 40 words, up to 6 tags).
                  </p>
                </div>

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
                    <Input
                      placeholder="Image prompt (optional, used for AI cover)"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 sm:flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleGenerateImage(aiTopic)}
                        disabled={generatingImage}
                        className="w-full sm:w-auto"
                      >
                        {generatingImage ? "Generating…" : "AI cover image"}
                      </Button>
                      {coverImageUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setCoverImageUrl("")}
                          className="w-full sm:w-auto"
                        >
                          Remove image
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>PNG, JPG up to 5MB.</span>
                      {uploading && <span className="text-slate-700">Uploading…</span>}
                      {generatingImage && <span className="text-slate-700">Creating image…</span>}
                    </div>
                    {coverImageUrl && (
                      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        <img src={coverFullUrl} alt="cover" className="h-36 w-full object-contain bg-slate-50" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Content</label>
                  <RichTextEditor value={contentHtml} onChange={setContentHtml} />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link to="/posts">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={saving} className="w-full sm:w-auto">
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

           
          </div>
        </div>
      </div>
      <AlertDialog open={showPaywall} onOpenChange={setShowPaywall}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade for unlimited posts</AlertDialogTitle>
            <AlertDialogDescription>
              You’ve reached the free plan limit (2 posts). Choose a plan to unlock unlimited posts and sites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/pricing")}>View pricing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
