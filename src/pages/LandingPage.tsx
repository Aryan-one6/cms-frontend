import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CheckCircle2, LogIn, Palette, ShieldCheck, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "AI-native writing",
    desc: "Draft SEO-ready posts, outlines, and cover images in seconds.",
    icon: Sparkles,
  },
  {
    title: "Team-ready control",
    desc: "Invite editors, gate publishing, and keep brand guardrails tight.",
    icon: ShieldCheck,
  },
  {
    title: "Multi-site clarity",
    desc: "One dashboard for every domain, with per-site analytics.",
    icon: BarChart3,
  },
];

const steps = [
  {
    label: "01",
    title: "Connect your brand",
    detail: "Import your voice, fonts, and domains. Sapphire keeps everything consistent.",
  },
  {
    label: "02",
    title: "Generate & refine",
    detail: "AI suggests headlines, drafts, and imagery; you polish with live preview.",
  },
  {
    label: "03",
    title: "Publish confidently",
    detail: "Editorial workflow, review gates, and instant CDN deploys.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 font-bold">
            S
          </div>
          Sapphire CMS
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-200">
          <Link
            to="/login"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-200 hover:border-slate-700 hover:text-white sm:hidden"
            aria-label="Log in"
          >
            <LogIn className="h-4 w-4" />
          </Link>
          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/login" className="rounded-lg px-3 py-2 text-slate-200 hover:text-white">
              Log in
            </Link>
            <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
              <Link to="/signup">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 pb-20 pt-6">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge className="bg-cyan-200 text-cyan-900">Modern content OS</Badge>
            <h1 className="font-display text-4xl font-semibold leading-tight text-white sm:text-4xl md:text-4xl">
              Build, brand, and ship content your team is proud of.
            </h1>
            <p className="max-w-3xl text-sm text-slate-200">
              Sapphire CMS combines AI-assisted creation, a clean editorial workflow, and multi-site management
              into one fast, secure dashboard. Move from idea to publish without losing your brand voice.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                <Link to="/signup">
                  Start free workspace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-700 text-primary hover:text-white hover:bg-slate-800">
                <Link to="/login">Open dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                SOC2-ready infra
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                CDN-backed media
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Human + AI workflows
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/70 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active content</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2 text-2xl font-semibold sm:text-3xl">
                    99+
                    <span className="text-xs font-medium text-emerald-400 sm:text-sm">publishing this week</span>
                  </div>
                </div>
                <div className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  Healthy signal
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 px-5 pb-6 sm:grid-cols-2 sm:px-6">
                <Card className="border-white/5 bg-slate-800/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-white">
                      <Wand2 className="h-4 w-4 text-cyan-300" />
                      AI cover images
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-2 rounded-full bg-slate-700">
                      <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" />
                    </div>
                    <p className="text-xs text-slate-300">16 generated today</p>
                  </CardContent>
                </Card>
                <Card className="border-white/5 bg-slate-800/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-white">
                      <Palette className="h-4 w-4 text-rose-300" />
                      Brand fidelity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-2 rounded-full bg-slate-700">
                      <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                    </div>
                    <p className="text-xs text-slate-300">Voice, tone, and design guardrails enforced</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 ">
          {highlights.map(({ title, desc, icon: Icon }) => (
            <Card key={title} className="border-slate-800 bg-slate-900/60 mb-3">
              <CardContent className="space-y-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/70">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <div className="text-lg font-semibold text-white">{title}</div>
                <p className="text-sm text-slate-300">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="flex flex-col ">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div>
              <Badge className="bg-slate-200 text-slate-900">Trusted by teams</Badge>
              <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Content velocity without chaos</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left text-sm sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-2xl font-semibold text-white">99.9%</div>
                <p className="text-slate-300">Uptime on CDN media</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-2xl font-semibold text-white">24h</div>
                <p className="text-slate-300">Average time to launch</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-2xl font-semibold text-white">3x</div>
                <p className="text-slate-300">Faster editorial cycle</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-2xl font-semibold text-white">50+</div>
                <p className="text-slate-300">Teams scaling on Sapphire</p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 mb-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                SOC2-ready stack
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white">Security by default</h3>
              <p className="text-sm text-slate-300">
                SSO-friendly auth, principle-of-least-privilege roles, audit-friendly content history, and locked
                publishing gates so nothing risky slips through.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                <Palette className="h-4 w-4" />
                Design guardrails
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white">On-brand every time</h3>
              <p className="text-sm text-slate-300">
                Lock in typography, palettes, and voice guidelines. AI drafts and images respect your brand kit so
                multi-author teams stay consistent.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            <Badge className="bg-indigo-200 text-indigo-900">Compact journey</Badge>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Infographic-ready workflow</h2>
            <p className="text-slate-300">
              Sapphire keeps the editorial path short and measurable. Every step is visual, so stakeholders
              can scan progress without wading through docs.
            </p>
            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.label}
                  className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-start md:gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-cyan-200">
                    {step.label}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">{step.title}</div>
                    <p className="text-sm text-slate-300">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Insights</p>
                <div className="mt-2 text-3xl font-semibold text-white">3.4x faster shipping</div>
                <p className="text-sm text-slate-300">Teams publish more with Sapphire’s guided AI tooling.</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                Live data
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-900/70 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Editorial completion</span>
                  <span className="font-semibold text-emerald-300">94%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-800">
                  <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/70 p-4">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>AI-assisted drafts</span>
                  <span className="font-semibold text-cyan-200">+128% QoQ</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 text-xs text-slate-400">
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-white">Blog</div>
                    <div className="text-cyan-200">42</div>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-white">Changelog</div>
                    <div className="text-cyan-200">18</div>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-white">Landing</div>
                    <div className="text-cyan-200">27</div>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-white">Docs</div>
                    <div className="text-cyan-200">11</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-10 text-center shadow-2xl">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <Badge className="mx-auto bg-emerald-200 text-emerald-900">Launch faster</Badge>
            <h3 className="text-3xl font-semibold text-white sm:text-4xl">Ready for the next release cycle?</h3>
            <p className="text-slate-300">
              Spin up a Sapphire workspace, invite your writers, and publish in hours—not weeks. Your brand stays
              consistent, your team stays aligned, and your content stays fast.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button asChild size="lg" className="bg-white text-slate-950 hover:bg-slate-100">
                <Link to="/signup">
                  Create workspace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-700 text-primary hover:text-white hover:bg-slate-800">
                <Link to="/login">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
