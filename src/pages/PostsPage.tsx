import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildAssetUrl } from "@/lib/media";
import { useSite } from "@/lib/site";

type Post = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
  coverImageUrl?: string;
  author: { id: string; name: string };
  isMine: boolean;
  canEdit: boolean;
};

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let field: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    field.push(current.replace(/""/g, '"'));
    current = "";
  };
  const pushRow = () => {
    if (field.length) rows.push(field);
    field = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      pushField();
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushField();
      pushRow();
    } else {
      current += ch;
    }
  }
  pushField();
  pushRow();

  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => c.trim().length))
    .map((cols) => {
      const obj: any = {};
      headers.forEach((h, idx) => {
        const val = (cols[idx] ?? "").trim();
        if (h === "tags") obj.tags = val ? val.split("|").map((t) => t.trim()).filter(Boolean) : [];
        else obj[h] = val;
      });
      return obj;
    });
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputId = "import-posts-input";
  const { activeSite } = useSite();

  async function loadPosts() {
    if (!activeSite) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/posts");
      setPosts(res.data.posts);
    } catch {
      setError("Unable to load posts right now.");
    } finally {
      setLoading(false);
    }
  }

  async function publish(id: string) {
    const target = posts.find((p) => p.id === id);
    if (target && !target.canEdit) {
      alert("You can only publish posts you created.");
      return;
    }

    try {
      await api.post(`/admin/posts/${id}/publish`);
      loadPosts();
    } catch {
      alert("Unable to publish this post.");
    }
  }

  async function unpublish(id: string) {
    const target = posts.find((p) => p.id === id);
    if (target && !target.canEdit) {
      alert("You can only unpublish posts you created.");
      return;
    }

    try {
      await api.post(`/admin/posts/${id}/unpublish`);
      loadPosts();
    } catch {
      alert("Unable to unpublish this post.");
    }
  }

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite?.id]);

  const makeFileName = (ext: string) => {
    const label =
      activeSite?.domains?.[0] ||
      activeSite?.slug ||
      activeSite?.name?.toLowerCase().replace(/\s+/g, "-") ||
      "site";
    const stamp = new Date().toISOString().slice(0, 10);
    return `${label}-posts-${stamp}.${ext}`;
  };

  async function handleExport() {
    if (!activeSite) return;
    setExporting(true);
    setMessage("");
    setError("");
    try {
      const res = await api.get("/admin/posts/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = makeFileName("json");
      a.href = url;
      a.download = stamp;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Export ready. Downloaded posts-export file.");
    } catch {
      setError("Unable to export posts right now.");
    } finally {
      setExporting(false);
    }
  }

  async function handleExportCsv() {
    if (!activeSite) return;
    setExportingCsv(true);
    setMessage("");
    setError("");
    try {
      const res = await api.get("/admin/posts/export?format=csv", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = makeFileName("csv");
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Export ready. Downloaded CSV file.");
    } catch {
      setError("Unable to export CSV right now.");
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    setImportError("");
    setMessage("");
    try {
      const text = await file.text();
      let payload: any;
      if (file.name.toLowerCase().endsWith(".csv")) {
        payload = { posts: parseCsv(text) };
      } else {
        const parsed = JSON.parse(text);
        payload = Array.isArray(parsed) ? { posts: parsed } : parsed;
      }
      if (!payload?.posts || !Array.isArray(payload.posts) || !payload.posts.length) {
        throw new Error("File must contain an array of posts or { posts: [...] }");
      }
      await api.post("/admin/posts/import", payload);
      setMessage(`Imported ${payload.posts.length} posts (duplicates get unique slugs).`);
      await loadPosts();
    } catch (err: any) {
      setImportError(err?.message || "Unable to import posts. Ensure the JSON format is correct.");
    } finally {
      setImporting(false);
      const input = document.getElementById(fileInputId) as HTMLInputElement | null;
      if (input) input.value = "";
    }
  }

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Posts"
        title="Blog Posts"
        description={`See which posts are yours and which were created by teammates for ${
          activeSite?.name ?? "this site"
        }.`}
        actions={
          <>
            <input
              id={fileInputId}
              type="file"
              accept="application/json,text/csv"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export posts"}
            </Button>
            <Button variant="outline" onClick={handleExportCsv} disabled={exportingCsv}>
              {exportingCsv ? "Exporting CSV..." : "Export CSV"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => document.getElementById(fileInputId)?.click()}
              disabled={importing}
            >
              {importing ? "Importing..." : "Import posts"}
            </Button>
            <Button asChild>
              <Link to="/posts/new">Create Post</Link>
            </Button>
          </>
        }
      />

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {importError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {importError}
        </div>
      )}

      <div className="mt-4 rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[150px]">Owner</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[180px]">Updated</TableHead>
              <TableHead className="w-[260px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                  No posts yet.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.coverImageUrl ? (
                      <img src={buildAssetUrl(p.coverImageUrl)} alt="cover" className="h-12 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-12 w-20 rounded-md bg-slate-100" />
                    )}
                  </TableCell>

                  <TableCell className="font-medium">{p.title}</TableCell>

                  <TableCell className="text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>{p.isMine ? "You" : p.author?.name || "Unknown"}</span>
                      {p.isMine ? (
                        <Badge variant="outline">Yours</Badge>
                      ) : (
                        <Badge variant="secondary">Team</Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={p.status === "PUBLISHED" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-slate-600">
                    {new Date(p.updatedAt).toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Link to={`/posts/${p.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>

                      <Link to={`/posts/${p.id}/edit`}>
                        <Button
                          variant="outline"
                          size="sm"
                          title={p.canEdit ? "Edit your post" : "View only — owned by someone else"}
                        >
                          {p.canEdit ? "Edit" : "View"}
                        </Button>
                      </Link>

                      {p.canEdit && (
                        <>
                          {p.status === "DRAFT" ? (
                            <Button size="sm" onClick={() => publish(p.id)}>
                              Publish
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm" onClick={() => unpublish(p.id)}>
                              Unpublish
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
