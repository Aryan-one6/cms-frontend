import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildOAuthUrl } from "@/lib/oauth";
import { Github } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Create an account</CardTitle>
          <p className="text-sm text-slate-500">Create your workspace and set up your site details.</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Button asChild variant="outline" className="w-full gap-2">
              <a href={googleUrl}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  G
                </span>
                Sign up with Google
              </a>
            </Button>

            <Button asChild variant="outline" className="w-full gap-2">
              <a href={githubUrl}>
                <Github className="h-4 w-4" />
                Sign up with GitHub
              </a>
            </Button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or use email
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="text-xs text-cyan-700 hover:underline"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? "Hide passwords" : "Show passwords"}
            </button>

            <div className="h-px bg-slate-200" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-800">Your site</div>
              <Input
                placeholder="Site name (e.g., Marketing Site)"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
              />
              <Input
                placeholder="Primary domain (e.g., example.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500">
                We’ll use this to create your site container and generate a verification token. You can edit later.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading} type="submit">
              {loading ? "Creating..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-700 hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
