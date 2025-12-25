import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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
      await resetPassword(token, password);
      setStatus("Password updated. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch {
      setError("Failed to reset password. Token may be expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Set a new password</CardTitle>
          <p className="text-sm text-slate-500">Choose a strong password.</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
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
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading || !token} type="submit">
              {loading ? "Updating..." : "Update password"}
            </Button>
            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="text-cyan-700 hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
