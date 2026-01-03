import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SetPasswordPage() {
  const { admin, setPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextParam = params.get("next") || "/";
  const nextPath = nextParam.startsWith("/") ? nextParam : "/";

  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (admin?.hasPassword) {
      navigate(nextPath, { replace: true });
    }
  }, [admin?.hasPassword, navigate, nextPath]);

  useEffect(() => {
    if (admin?.email && !loginEmail) {
      setLoginEmail(admin.email);
    }
  }, [admin?.email, loginEmail]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    setLoading(true);
    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
      await setPassword(password, loginEmail);
      setStatus("Password saved. Redirecting...");
      setTimeout(() => navigate(nextPath), 900);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Unable to set password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Create a CMS password</CardTitle>
          <p className="text-sm text-slate-500">
            You signed in with Google/GitHub. Choose a CMS login email and password to share access.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="CMS login email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            {status && <p className="text-sm text-green-700">{status}</p>}
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading} type="submit">
              {loading ? "Saving..." : "Save password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
