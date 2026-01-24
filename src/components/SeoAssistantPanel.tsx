import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import type { ContentBreakdown, SerpAnalysis } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Props = {
  primaryKeyword: string;
  secondaryKeywords: string[];
  serpAnalysis?: SerpAnalysis;
  breakdown?: ContentBreakdown;
  loadingAnalysis?: boolean;
  loadingScore?: boolean;
  onRunAnalysis: () => void;
  onRequestSuggestions: () => void;
  onApplyFixes?: () => void;
  onUndoFixes?: () => void;
  canUndo?: boolean;
  suggestions?: {
    headings: string[];
    faqs: string[];
    paragraphSuggestions: string[];
    missingTerms: string[];
  };
  onInsertTerm?: (term: string) => void;
};

function scoreTone(score: number) {
  if (score >= 85) return "good";
  if (score >= 65) return "mid";
  return "low";
}

/** Compact gauge (clean ring) */
function ScoreGauge({ value }: { value: number }) {
  const normalized = Math.min(100, Math.max(0, value));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - normalized / 100);

  const strokeColor =
    normalized >= 85 ? "stroke-emerald-500" : normalized >= 65 ? "stroke-amber-500" : "stroke-rose-500";

  const textColor =
    normalized >= 85 ? "text-emerald-700" : normalized >= 65 ? "text-amber-800" : "text-rose-700";

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="currentColor"
          className="text-slate-200"
          strokeWidth="10"
          fill="none"
        />

        {/* Progress */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-500", strokeColor)}
        />
      </svg>

      {/* Center Number Only */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn("text-4xl font-bold tabular-nums", textColor)}>
          {Math.round(normalized)}
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold text-slate-900">
        {value}
      </div>
      {sub ? <div className="text-[11px] text-slate-500">{sub}</div> : null}
    </div>
  );
}

function Chip({
  children,
  tone = "default",
  onClick,
  title,
}: {
  children: React.ReactNode;
  tone?: "default" | "good" | "warn";
  onClick?: () => void;
  title?: string;
}) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition border";
  const styles =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
      : tone === "warn"
        ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(base, styles)}
        title={title}
      >
        {children}
      </button>
    );
  }
  return <span className={cn(base, styles)}>{children}</span>;
}

export function SeoAssistantPanel({
  primaryKeyword,
  secondaryKeywords,
  serpAnalysis,
  breakdown,
  loadingAnalysis,
  loadingScore,
  onRunAnalysis,
  onRequestSuggestions,
  onApplyFixes,
  onUndoFixes,
  canUndo = false,
  suggestions,
  onInsertTerm,
}: Props) {
  const missingTerms = breakdown?.missingTerms || [];
  const categories = breakdown?.categories || [];
  const benchmarks = serpAnalysis?.benchmarks;
  const competitorRows = serpAnalysis?.competitors?.slice(0, 6) || [];
  const nlpTerms =
    serpAnalysis?.nlpTerms?.topTerms
      ?.filter((t) => {
        const term = (t.term || "").toLowerCase();
        return (
          term.length > 2 &&
          !/^[0-9]+$/.test(term) &&
          term !== "nbsp" &&
          term !== "amp"
        );
      })
      ?.slice(0, 16) || [];

  const statusLabel = serpAnalysis ? "Benchmarked" : "Not benchmarked";

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-slate-900">
                SEO assistant
              </CardTitle>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-500">{statusLabel}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              SERP-aware scoring and quick fixes for your draft.
            </p>
          </div>

          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px]",
              serpAnalysis ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            )}
          >
            {serpAnalysis ? "Ready" : "Setup"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={onRunAnalysis}
            disabled={loadingAnalysis || !primaryKeyword.trim()}
            className="h-8 rounded-full px-4"
          >
            {loadingAnalysis ? "Analyzing…" : serpAnalysis ? "Refresh Score" : "Run analysis"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onApplyFixes || onRequestSuggestions}
            disabled={loadingScore || !serpAnalysis}
            className="h-8 rounded-full px-4"
          >
            {loadingScore ? "Scoring…" : "AI fixes"}
          </Button>

          {onUndoFixes ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onUndoFixes}
              disabled={!canUndo}
              className="h-8 rounded-full px-3 text-slate-600"
            >
              Undo
            </Button>
          ) : null}

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Badge variant="outline" className="rounded-full text-[11px]">
              Primary: {primaryKeyword || "n/a"}
            </Badge>
            {secondaryKeywords.slice(0, 2).map((kw) => (
              <Badge key={kw} variant="secondary" className="rounded-full text-[11px]">
                {kw}
              </Badge>
            ))}
            {secondaryKeywords.length > 2 ? (
              <Badge variant="secondary" className="rounded-full text-[11px]">
                +{secondaryKeywords.length - 2}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs defaultValue="score">
          <TabsList className="grid w-full grid-cols-4 rounded-xl bg-slate-100 p-1">
            {[
              ["score", "Score"],
              ["keywords", "Keywords"],
              ["headings", "Structure"],
              ["serp", "SERP"],
            ].map(([val, label]) => (
              <TabsTrigger
                key={val}
                value={val}
                className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* SCORE */}
          <TabsContent value="score" className="mt-4 space-y-3 ">
            {/* Improved Breakdown Block */}
            <div className=" ">
              <div className="">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Content score breakdown</div>
                    <div className="text-xs text-slate-500">Optimize key elements to improve ranking potential.</div>
                  </div>

                  <Badge variant="secondary" className="rounded-full text-[11px]">
                    {Math.round(breakdown?.total || 0)} / 100
                  </Badge>
                </div>

                {/* Body */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr] md:items-start">
                  {/* Left: Gauge panel */}
                  {/* Left: Gauge panel */}
                  <div className="rounded-xl bg-slate-50/70 p-4">
                    <div className="flex flex-col items-center">
                      {/* give gauge space */}
                      <div className=" ">
                        <ScoreGauge value={breakdown?.total || 0} />
                      </div>

                      {/* Info BELOW gauge */}
                      <div className="mt-3 w-full text-center">
                        <div className="text-xs font-semibold text-slate-800">
                          Overall score
                        </div>

                        <div className="mt-0.5 text-[11px] text-slate-500">
                          {(() => {
                            const score = breakdown?.total || 0;
                            if (score >= 85) return "Excellent";
                            if (score >= 70) return "Good";
                            if (score >= 50) return "Fair";
                            return "Needs work";
                          })()}
                        </div>

                        <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                          <span className="text-[11px] text-slate-500">Total</span>
                          <span className="text-xs font-semibold tabular-nums text-slate-900">
                            {Math.round(breakdown?.total || 0)}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Right: Breakdown rows */}
                  <div className="min-w-0">
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="grid grid-cols-[180px_1fr_72px] items-center gap-3"
                        >
                          {/* Label */}
                          <div className="min-w-0">
                            <div className="truncate text-[12px] font-medium text-slate-700">
                              {cat.label}
                            </div>
                          </div>

                          {/* Bar */}
                          <div className="min-w-0">
                            <div className="h-2.5 w-full rounded-full bg-slate-100">
                              <div
                                className={cn(
                                  "h-2.5 rounded-full transition-[width] duration-500",
                                  scoreTone(cat.score) === "good" && "bg-emerald-500",
                                  scoreTone(cat.score) === "mid" && "bg-amber-500",
                                  scoreTone(cat.score) === "low" && "bg-rose-500"
                                )}
                                style={{ width: `${Math.min(100, Math.max(0, cat.score))}%` }}
                              />
                            </div>
                          </div>

                          {/* Score pill */}
                          <div className="flex justify-end">
                            <span
                              className={cn(
                                "inline-flex min-w-[64px] justify-center rounded-full px-2 py-1 text-[11px] font-semibold tabular-nums ring-1",
                                scoreTone(cat.score) === "good" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
                                scoreTone(cat.score) === "mid" && "bg-amber-50 text-amber-800 ring-amber-200",
                                scoreTone(cat.score) === "low" && "bg-rose-50 text-rose-700 ring-rose-200"
                              )}
                            >
                              {Math.round(cat.score)} / 100
                            </span>
                          </div>
                        </div>
                      ))}

                      {!categories.length ? (
                        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
                          No breakdown yet. Run analysis to generate scores.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {breakdown?.actionable?.length ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-amber-900">Fix next</div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-amber-300 text-[11px] text-amber-900"
                  >
                    Top {Math.min(4, breakdown.actionable.length)}
                  </Badge>
                </div>

                <ul className="mt-2 space-y-1 text-sm text-amber-900/90">
                  {breakdown.actionable.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-600" />
                      <span className="flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </TabsContent>

          {/* KEYWORDS */}
          <TabsContent value="keywords" className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Terms & coverage</div>
                  <div className="text-xs text-slate-500">Click a term to insert it.</div>
                </div>
                {missingTerms.length ? (
                  <Badge className="rounded-full bg-rose-600 text-white">
                    Missing {Math.min(999, missingTerms.length)}
                  </Badge>
                ) : (
                  <Badge className="rounded-full bg-emerald-600 text-white">All covered</Badge>
                )}
              </div>

              <Separator className="my-3" />

              <div className="flex flex-wrap gap-2">
                <Chip tone="default">Primary: {primaryKeyword || "n/a"}</Chip>
                {secondaryKeywords.slice(0, 6).map((kw) => (
                  <Chip key={kw}>{kw}</Chip>
                ))}
                {secondaryKeywords.length > 6 ? <Chip>+{secondaryKeywords.length - 6}</Chip> : null}
              </div>

              <div className="mt-3">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Recommended NLP terms
                </div>
                <div className="flex flex-wrap gap-2">
                  {nlpTerms.map((term) => {
                    const covered = !missingTerms.includes(term.term.toLowerCase());
                    return (
                      <Chip
                        key={term.term}
                        tone={covered ? "good" : "default"}
                        onClick={() => onInsertTerm?.(term.term)}
                        title={covered ? "Already covered" : "Click to insert"}
                      >
                        {term.term}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {missingTerms.length ? (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  <span className="font-medium">Missing:</span>{" "}
                  {missingTerms.slice(0, 10).join(", ")}
                  {missingTerms.length > 10 ? "…" : null}
                </div>
              ) : null}

              {suggestions ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    AI ideas
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-slate-700">
                    {suggestions.headings?.slice(0, 2).map((h) => (
                      <div key={h} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span className="flex-1">{h}</span>
                      </div>
                    ))}
                    {suggestions.paragraphSuggestions?.slice(0, 2).map((p) => (
                      <div key={p} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span className="flex-1">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </TabsContent>

          {/* STRUCTURE */}
          <TabsContent value="headings" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatPill
                label="Word count"
                value={breakdown?.metrics.wordCount ?? 0}
                sub={
                  benchmarks?.wordCount
                    ? `Target ${Math.round(benchmarks.wordCount.min)}–${Math.round(benchmarks.wordCount.max)}`
                    : undefined
                }
              />

              <StatPill
                label="Headings"
                value={`H1 ${breakdown?.metrics.headingCounts.h1 ?? 0} · H2 ${breakdown?.metrics.headingCounts.h2 ?? 0} · H3 ${breakdown?.metrics.headingCounts.h3 ?? 0
                  }`}
                sub={
                  benchmarks?.headingTargets
                    ? `Targets: H2 ${benchmarks.headingTargets.h2 ?? 0}, H3 ${benchmarks.headingTargets.h3 ?? 0}`
                    : undefined
                }
              />

              <StatPill
                label="Links"
                value={`In ${breakdown?.metrics.internalLinks ?? 0} · Out ${breakdown?.metrics.externalLinks ?? 0}`}
                sub={
                  benchmarks?.links
                    ? `Aim In ${benchmarks.links.internal.min ?? 0}-${benchmarks.links.internal.max ?? 0}, Out ${benchmarks.links.external.min ?? 0}-${benchmarks.links.external.max ?? 0}`
                    : undefined
                }
              />

              <StatPill
                label="Media & readability"
                value={`Images ${breakdown?.metrics.imageCount ?? 0}`}
                sub={`Avg sentence ${Math.round(breakdown?.metrics.avgSentenceLength || 0)} words`}
              />
            </div>
          </TabsContent>

          {/* SERP */}
          <TabsContent value="serp" className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Top competitors</div>
                  <div className="text-xs text-slate-500">Snapshot of the first results.</div>
                </div>
                <Badge variant="secondary" className="rounded-full text-[11px]">
                  {competitorRows.length ? `Showing ${competitorRows.length}` : "None yet"}
                </Badge>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                {competitorRows.map((row) => (
                  <div
                    key={row.url}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          <span className="mr-2 text-slate-500">#{row.position}</span>
                          {row.title}
                        </div>
                        <div className="truncate text-xs text-slate-500">{row.url}</div>
                      </div>

                      <Badge variant="outline" className="shrink-0 rounded-full text-[11px]">
                        {row.wordCount} words
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1">H2 {row.headings.h2.length}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">
                        Links {row.internalLinks}/{row.externalLinks}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1">Images {row.imageCount}</span>
                      {row.schema.faq ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1">FAQ schema</span>
                      ) : null}
                      {row.schema.article ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1">Article schema</span>
                      ) : null}
                    </div>
                  </div>
                ))}

                {!competitorRows.length ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-500">
                    Run analysis to pull competitor benchmarks.
                  </div>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
