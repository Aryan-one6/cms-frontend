import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildOAuthUrl } from "@/lib/oauth";
import { GoogleLogo, GithubLogo } from "@/components/SocialLogos";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [siteName, setSiteName] = useState("");
  const [domain, setDomain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleUrl = buildOAuthUrl("google", "/sites");
  const githubUrl = buildOAuthUrl("github", "/sites");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      if (!siteName.trim() || !domain.trim()) {
        setError("Site name and primary domain are required to finish setup.");
        setLoading(false);
        return;
      }

      await signup(name, email, password, siteName.trim(), domain.trim());

      navigate("/sites");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err?.message?.includes("Network") ? "Cannot reach server. Check CORS/backend." : null);
      setError(message || "Could not create account. Please check details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg text-white sm:text-xl">Create an account</CardTitle>
          <p className="text-sm text-slate-300">Create your workspace and set up your site details.</p>
        </CardHeader>

        <CardContent className="pb-6 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <Button
              asChild
              variant="outline"
              className="w-full gap-2 border-slate-200 bg-white  hover:bg-slate-50"
            >
              <a href={googleUrl}>
                <GoogleLogo className="h-5 w-5" />
                Continue with Google
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full gap-2 "
            >
              <a href={githubUrl}>
                <GithubLogo className="h-5 w-5 border-full border-[#0f1116]" />
                Continue with GitHub
              </a>
            </Button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-800" />
              or use email
              <span className="h-px flex-1 bg-slate-800" />
            </div>

            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
            />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
            />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
            />
            <button
              type="button"
              className="text-xs text-cyan-300 hover:underline"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? "Hide passwords" : "Show passwords"}
            </button>

            <div className="h-px bg-slate-800" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-white">Your site</div>
              <Input
                placeholder="Site name (e.g., Marketing Site)"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
                className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
              />
              <Input
                placeholder="Primary domain (e.g., example.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
                className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400">
                We’ll use this to create your site container and generate a verification token. You can edit later.
              </p>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={loading} type="submit">
              {loading ? "Creating..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-slate-300">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-300 hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
