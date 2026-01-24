import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import RichTextEditor from "../components/RichTextEditor";
import { uploadCoverImage, generateCoverImage } from "../lib/upload";
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
import { Sparkles, Wand2, ImageIcon, Trash2 } from "lucide-react";
import { SeoAssistantPanel } from "@/components/SeoAssistantPanel";
import { analyzeContent, aiSuggest, runSerpAnalysis } from "@/lib/seo";
import type { ContentBreakdown, SerpAnalysis } from "@/lib/seo";


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
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywordsText, setSecondaryKeywordsText] = useState("");
  const [location, setLocation] = useState("United States");
  const [language, setLanguage] = useState("en");
  const [serpAnalysisId, setSerpAnalysisId] = useState("");
  const [serpAnalysis, setSerpAnalysis] = useState<SerpAnalysis | null>(null);
  const [seoBreakdown, setSeoBreakdown] = useState<ContentBreakdown | null>(null);
  const [seoSuggestions, setSeoSuggestions] = useState<{
    headings: string[];
    faqs: string[];
    paragraphSuggestions: string[];
    missingTerms: string[];
  } | null>(null);
  const [lastAiPatch, setLastAiPatch] = useState<{
    contentHtml: string;
    metaTitle: string;
    metaDescription: string;
  } | null>(null);
  const [serpLoading, setSerpLoading] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
  const secondaryKeywords = secondaryKeywordsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

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
        primaryKeyword: primaryKeyword || undefined,
        secondaryKeywords,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        serpAnalysisId: serpAnalysisId || undefined,
        seoScore: seoBreakdown?.total ?? undefined,
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

  async function handleRunSerpAnalysis() {
    if (!primaryKeyword.trim()) {
      setError("Add a primary keyword before running SERP analysis.");
      return;
    }
    setSerpLoading(true);
    setError("");
    try {
      const res = await runSerpAnalysis({
        keyword: primaryKeyword.trim(),
        location: location.trim() || "United States",
        language: language.trim() || "en",
        secondaryKeywords,
      });
      setSerpAnalysis(res.analysis);
      setSerpAnalysisId(res.analysis.id);
      setSeoBreakdown(null);
      setSeoSuggestions(null);
      await scoreContent(res.analysis.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "SERP analysis failed";
      setError(msg);
    } finally {
      setSerpLoading(false);
    }
  }

  async function scoreContent(analysisId?: string) {
    const targetId = analysisId || serpAnalysisId;
    if (!targetId) return;
    setSeoLoading(true);
    try {
      const res = await analyzeContent({
        serpAnalysisId: targetId,
        contentHtml,
        metaTitle,
        metaDescription,
        primaryKeyword,
        secondaryKeywords,
        baseUrl: window?.location?.origin,
      });
      setSeoBreakdown(res.breakdown);
      setSeoSuggestions(null);
      if (!serpAnalysis) {
        setSerpAnalysis({
          id: targetId,
          keyword: primaryKeyword,
          location,
          language,
          competitors: [],
          benchmarks: res.benchmarks,
          nlpTerms: res.nlp,
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to score content";
      setError(msg);
    } finally {
      setSeoLoading(false);
    }
  }

  async function handleRequestSuggestions() {
    if (!serpAnalysisId) {
      setError("Run SERP analysis first.");
      return;
    }
    setSeoLoading(true);
    try {
      const res = await aiSuggest({
        serpAnalysisId,
        contentHtml,
        primaryKeyword,
        secondaryKeywords,
        missingTerms: seoBreakdown?.missingTerms || [],
      });
      setSeoSuggestions(res);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Could not fetch AI suggestions";
      setError(msg);
    } finally {
      setSeoLoading(false);
    }
  }

  function handleInsertTerm(term: string) {
    if (!term) return;
    setContentHtml((prev) => `${prev}<p>${term}</p>`);
  }

  function applySuggestionsToContent(
    suggestions: { headings?: string[]; faqs?: string[]; paragraphSuggestions?: string[]; missingTerms?: string[] }
  ) {
    setLastAiPatch({
      contentHtml,
      metaTitle,
      metaDescription,
    });
    const blocks: string[] = [];
    const keywordLine =
      primaryKeyword && primaryKeyword.trim().length
        ? `<p><strong>${primaryKeyword}</strong> — include it in early headings with related terms like ${[
            ...(suggestions.missingTerms || []),
            ...secondaryKeywords,
          ]
            .filter(Boolean)
            .slice(0, 4)
            .join(", ")}.</p>`
        : "";
    if (suggestions.headings?.length) {
      blocks.push(
        `<div class="seo-ai-heading-block">${suggestions.headings
          .slice(0, 3)
          .map((h) => `<h2>${h}</h2><p>Expand on this subtopic with details, examples, and benchmarks.</p>`)
          .join("")}</div>`
      );
    }

    if (suggestions.paragraphSuggestions?.length) {
      blocks.push(
        `<div class="seo-ai-paragraphs">${suggestions.paragraphSuggestions
          .slice(0, 3)
          .map((p) => `<p>${p}</p>`)
          .join("")}</div>`
      );
    }

    if (suggestions.faqs?.length) {
      blocks.push(
        `<section class="seo-ai-faq"><h2>Frequently Asked Questions</h2>${suggestions.faqs
          .slice(0, 4)
          .map((q) => `<h3>${q}</h3><p>Write a concise, helpful answer that uses supporting terms.</p>`)
          .join("")}</section>`
      );
    }

    if (suggestions.missingTerms?.length) {
      blocks.push(
        `<p class="seo-ai-missing">Include these terms naturally: ${suggestions.missingTerms
          .slice(0, 8)
          .join(", ")}</p>`
      );
    }

    if (!blocks.length) return;
    const newHtml = `${contentHtml}\n<section data-seo-ai="true">${keywordLine}${blocks.join("")}</section>`;
    setContentHtml(newHtml);
  }

  async function handleApplyFixes() {
    if (!serpAnalysisId) {
      setError("Run SERP analysis first.");
      return;
    }
    setSeoLoading(true);
    try {
      const res = await aiSuggest({
        serpAnalysisId,
        contentHtml,
        primaryKeyword,
        secondaryKeywords,
        missingTerms: seoBreakdown?.missingTerms || [],
      });
      setSeoSuggestions(res);
      applySuggestionsToContent(res);
      const topTerms =
        serpAnalysis?.nlpTerms?.topTerms
          ?.map((t) => t.term)
          .filter((t) => t && t.length > 2 && t.toLowerCase() !== "nbsp")
          .slice(0, 3) || [];
      const mergedTerms = Array.from(new Set([...(res.missingTerms || []), ...topTerms, ...secondaryKeywords])).filter(
        Boolean
      );
      if (primaryKeyword) {
        if (!metaTitle.toLowerCase().includes(primaryKeyword.toLowerCase())) {
          const extra = mergedTerms[0] ? ` | ${mergedTerms[0]}` : "";
          setMetaTitle(`${primaryKeyword}${extra}`);
        }
        if (metaDescription.length < 110 || !metaDescription.toLowerCase().includes(primaryKeyword.toLowerCase())) {
          const descTerms = mergedTerms.slice(0, 3).join(", ");
          const draftDesc = `Discover ${primaryKeyword} with ${descTerms}. Actionable guide on headings, links, and media to rank.`; 
          setMetaDescription(draftDesc.slice(0, 165));
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Could not fetch AI suggestions";
      setError(msg);
    } finally {
      setSeoLoading(false);
    }
  }

  function handleUndoFixes() {
    if (!lastAiPatch) return;
    setContentHtml(lastAiPatch.contentHtml);
    setMetaTitle(lastAiPatch.metaTitle);
    setMetaDescription(lastAiPatch.metaDescription);
    setLastAiPatch(null);
    scoreContent();
  }

  useEffect(() => {
    if (!serpAnalysisId) return;
    const timer = setTimeout(() => {
      scoreContent();
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentHtml, metaTitle, metaDescription, primaryKeyword, secondaryKeywordsText, serpAnalysisId]);

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

        <div className="grid items-start gap-6 xl:grid-cols-[1.6fr,1fr]">
             <SeoAssistantPanel
              primaryKeyword={primaryKeyword}
              secondaryKeywords={secondaryKeywords}
              serpAnalysis={serpAnalysis || undefined}
              breakdown={seoBreakdown || undefined}
              loadingAnalysis={serpLoading}
              loadingScore={seoLoading}
              onRunAnalysis={handleRunSerpAnalysis}
              onRequestSuggestions={handleRequestSuggestions}
              onApplyFixes={handleApplyFixes}
              onUndoFixes={handleUndoFixes}
              canUndo={Boolean(lastAiPatch)}
              suggestions={seoSuggestions || undefined}
              onInsertTerm={handleInsertTerm}
            />
          <Card className="xl:col-span-1 bg-transparent shadow-none border-0 px-0 w-full">
            <CardHeader>
              <CardTitle>Post details</CardTitle>
              <CardDescription>Title, summary, tags, cover image, and the main content.</CardDescription>
            </CardHeader>
            <CardContent >
              <form id="post-form" onSubmit={handleCreate} className="space-y-6">


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
                      const val = e.target.value;
                      setTitle(val);
                      if (!slugDirty) setSlug(toSlug(val));
                    }}
                    placeholder="A captivating title"
                    className="border-1 border-slate-300 bg-white/50"
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
                    className="border-1 border-slate-300 bg-white/50"

                  />
                  <p className="text-xs text-slate-500">Used in URLs. Leave blank to auto-generate from the title.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Meta title</label>
                  <Input
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Title shown in SERP (45-65 characters)"
                    className="border-1 border-slate-300 bg-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Excerpt</label>
                  <Textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Short description for listings and SEO"
                    rows={3}
                    className="border-1 border-slate-300 bg-white/50"

                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Meta description</label>
                  <Textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Shown in SERP snippets. Aim for 120-180 characters."
                    rows={3}
                    className="border-1 border-slate-300 bg-white/50"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Primary keyword</label>
                    <Input
                      value={primaryKeyword}
                      onChange={(e) => setPrimaryKeyword(e.target.value)}
                      placeholder="e.g. surfer seo alternatives"
                      className="border-1 border-slate-300 bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Secondary keywords</label>
                    <Input
                      value={secondaryKeywordsText}
                      onChange={(e) => setSecondaryKeywordsText(e.target.value)}
                      placeholder="comma separated"
                      className="border-1 border-slate-300 bg-white/50"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Target location</label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="United States"
                      className="border-1 border-slate-300 bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Language</label>
                    <Input
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="en"
                      className="border-1 border-slate-300 bg-white/50"
                    />
                  </div>
                </div>

                <div className=" gap-4 ">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tags</label>
                    <Input
                      value={tagsText}
                      onChange={(e) => setTagsText(e.target.value)}
                      placeholder="design, ui, product"
                      className="border-1 border-slate-300 bg-white/50"

                    />
                    <p className="text-xs text-slate-500">Comma-separated. Shown as badges on the article.</p>
                  </div>

                </div>



                {/* <div className="space-y-2">
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
                  </div> */}



                <div className="relative space-y-2.5 overflow-hidden rounded-2xl border border-cyan-300/30 bg-gradient-to-br from-cyan-50 via-white to-indigo-50 p-4 shadow-sm">
                  {/* soft neural glow */}
                  <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />

                  {/* header */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-indigo-500 text-white shadow">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-cyan-700">
                        AI powered
                      </div>
                      <div className="text-sm font-semibold text-slate-900">
                        Cover image
                      </div>
                    </div>
                  </div>

                  {/* prompt */}
                  <Input
                    placeholder="Image prompt (optional, used for AI cover)"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="rounded-xl border-slate-200 bg-white/90 shadow-inner focus-visible:ring-2 focus-visible:ring-cyan-500"
                  />

                  {/* actions */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {/* keep your real file input, just make it compact + themed */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-600 sm:flex-1
        file:mr-3 file:rounded-lg file:border-0
        file:bg-gradient-to-br file:from-slate-900 file:to-slate-800
        file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white
        hover:file:from-slate-800 hover:file:to-slate-700"
                    />

                    <Button
                      type="button"
                      onClick={() => handleGenerateImage(aiTopic)}
                      disabled={generatingImage}
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
                        onClick={() => setCoverImageUrl("")}
                        className="w-full sm:w-auto rounded-xl text-slate-600 hover:bg-slate-100"
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
