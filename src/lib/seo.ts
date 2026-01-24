import { api } from "./api";

export type TermStat = { term: string; score: number };

export type BenchmarkRange = { min: number; max: number; avg: number };

export type Benchmarks = {
  wordCount: BenchmarkRange;
  headingTargets: { h1: number; h2: number; h3: number };
  keyword: {
    primary: BenchmarkRange;
    secondary: { term: string; recommended: number; min: number; max: number; avg: number }[];
  };
  nlpTerms: { term: string; recommended: number; min: number; max: number; avg: number }[];
  links: { internal: BenchmarkRange; external: BenchmarkRange };
  media: { images: BenchmarkRange };
  readability: { avgSentenceLength: number; targetSentenceLength: { min: number; max: number } };
};

export type SerpCompetitor = {
  url: string;
  title: string;
  snippet?: string;
  position: number;
  wordCount: number;
  titleLength: number;
  metaDescriptionLength: number;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  schema: { faq: boolean; article: boolean; rawTypes: string[] };
};

export type SerpAnalysis = {
  id: string;
  keyword: string;
  location: string;
  language: string;
  competitors: SerpCompetitor[];
  benchmarks: Benchmarks;
  nlpTerms: { topTerms: TermStat[]; semanticPhrases: TermStat[]; questions: string[] };
};

export type ScoreCategory = {
  id: string;
  label: string;
  score: number;
  weight: number;
  reasons: string[];
};

export type ContentMetrics = {
  wordCount: number;
  headingCounts: { h1: number; h2: number; h3: number };
  keywordCounts: Record<string, number>;
  imageCount: number;
  internalLinks: number;
  externalLinks: number;
  avgSentenceLength: number;
};

export type ContentBreakdown = {
  total: number;
  categories: ScoreCategory[];
  missingTerms: string[];
  overOptimized: string[];
  actionable: string[];
  metrics: ContentMetrics;
};

export type ContentAnalysisResponse = {
  seoScore: number;
  breakdown: ContentBreakdown;
  benchmarks: Benchmarks;
  nlp: SerpAnalysis["nlpTerms"];
};

export async function runSerpAnalysis(payload: {
  keyword: string;
  location: string;
  language: string;
  secondaryKeywords: string[];
}) {
  const res = await api.post("/admin/seo/serp/analyze", payload);
  return res.data as { cached: boolean; analysis: SerpAnalysis };
}

export async function analyzeContent(payload: {
  serpAnalysisId: string;
  contentHtml: string;
  metaTitle?: string;
  metaDescription?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  baseUrl?: string;
  blogPostId?: string;
}) {
  const res = await api.post("/admin/seo/content/analyze", payload);
  return res.data as ContentAnalysisResponse;
}

export async function aiSuggest(payload: {
  serpAnalysisId: string;
  contentHtml: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  missingTerms: string[];
}) {
  const res = await api.post("/admin/seo/ai/suggest", payload);
  return res.data.suggestions as {
    headings: string[];
    faqs: string[];
    paragraphSuggestions: string[];
    missingTerms: string[];
  };
}
