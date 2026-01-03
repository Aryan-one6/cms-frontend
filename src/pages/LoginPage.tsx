import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildOAuthUrl } from "@/lib/oauth";
import { GoogleLogo, GithubLogo } from "@/components/SocialLogos";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleUrl = buildOAuthUrl("google", "/app");
  const githubUrl = buildOAuthUrl("github", "/app");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("oauth") === "error") {
      setError("OAuth login failed. Try again or use email/password.");
    }
  }, [location.search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (err?.message?.includes("Network") ? "Cannot reach server. Check CORS/backend." : null);
      setError(message || "Invalid email or password");
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
          <CardTitle className="text-lg text-white sm:text-xl">CMS Admin Login</CardTitle>
        </CardHeader>

        <CardContent className="pb-6 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
            />

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-slate-800 bg-slate-900/60 text-white placeholder:text-slate-400"
            />
            <button
              type="button"
              className="text-xs text-cyan-300 hover:underline"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400" disabled={loading} type="submit">
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-800" />
              or continue with
              <span className="h-px flex-1 bg-slate-800" />
            </div>

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

            <div className="flex items-center justify-between text-sm text-slate-300">
              <Link to="/signup" className="text-cyan-300 hover:underline">
                Create account
              </Link>
              <Link to="/forgot-password" className="text-cyan-300 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
