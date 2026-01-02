import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildOAuthUrl } from "@/lib/oauth";
import { Github } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleUrl = buildOAuthUrl("google", "/");
  const githubUrl = buildOAuthUrl("github", "/");

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
      navigate("/");
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>CMS Admin Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="text-xs text-cyan-700 hover:underline"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or continue with
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Button asChild variant="outline" className="w-full gap-2">
              <a href={googleUrl}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  G
                </span>
                Continue with Google
              </a>
            </Button>

            <Button asChild variant="outline" className="w-full gap-2">
              <a href={githubUrl}>
                <Github className="h-4 w-4" />
                Continue with GitHub
              </a>
            </Button>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <Link to="/signup" className="text-cyan-700 hover:underline">
                Create account
              </Link>
              <Link to="/forgot-password" className="text-cyan-700 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
