type Props = {
  title: string;
  excerpt?: string;
  coverImageUrl?: string; // relative like /uploads/xxx.png
  contentHtml: string;
  tags?: string[];
};

import { buildAssetUrl } from "@/lib/media";

export default function BlogPreview({
  title,
  excerpt,
  coverImageUrl,
  contentHtml,
  tags,
}: Props) {
  const coverSrc = buildAssetUrl(coverImageUrl);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Preview</h3>
        <p className="text-sm text-slate-500">Live preview of the published article.</p>
      </div>

      <div className="space-y-4 px-6 py-5">
        {coverSrc ? (
          <img
            src={coverSrc}
            alt="cover"
            className="h-48 w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Cover image preview
          </div>
        )}

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">{title || "Untitled blog post"}</h2>
          {excerpt ? (
            <p className="text-sm text-slate-600">{excerpt}</p>
          ) : (
            <p className="text-sm text-slate-400">Add a short excerpt to display here.</p>
          )}
        </div>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div
          className="ProseMirror rich-content border-t border-slate-100 pt-4 text-slate-900"
          dangerouslySetInnerHTML={{
            __html: contentHtml || "<p style='color:#9ca3af'>Start writing...</p>",
          }}
        />
      </div>
    </div>
  );
}
