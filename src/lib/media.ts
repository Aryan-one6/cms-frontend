const fallback = "http://localhost:5050";

// Resolve a cover image path to an absolute URL, handling both relative paths returned by the API
// (e.g. "/uploads/file.png") and fully-qualified URLs. Also normalizes trailing slashes.
export function buildAssetUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = import.meta.env.VITE_API_ORIGIN || fallback;
  try {
    return new URL(path, base).toString();
  } catch {
    return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }
}
