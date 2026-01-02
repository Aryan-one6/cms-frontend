const apiBase = (import.meta.env.VITE_API_BASE || "http://localhost:5050/api").replace(/\/$/, "");

export function buildOAuthUrl(provider: "google" | "github", redirectPath = "/") {
  const redirect = encodeURIComponent(redirectPath);
  return `${apiBase}/auth/oauth/${provider}?redirect=${redirect}`;
}
