import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("");
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStatus("If that email exists, a reset link has been sent.");
    } catch {
      setError("Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Reset your password</CardTitle>
          <p className="text-sm text-slate-500">We’ll email you a reset link.</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {status && <p className="text-sm text-green-700">{status}</p>}
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading} type="submit">
              {loading ? "Sending..." : "Send reset link"}
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
