export type SeoDraft = {
  title?: string;
  slug?: string;
  excerpt?: string;
  contentHtml?: string;
  tags?: string[];
};

// Allow overriding model/base via env; defaults to Gemini flash models.
const defaultModel = "gemini-2.5-flash";
const defaultBase =
  "https://generativelanguage.googleapis.com/v1beta/models";

export async function generateSeoDraft(topic: string): Promise<SeoDraft> {
  if (!topic.trim()) throw new Error("Topic is required");
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");

  const model =
    import.meta.env.VITE_GEMINI_MODEL?.trim() || defaultModel;
  const baseUrl =
    import.meta.env.VITE_GEMINI_BASE_URL?.trim() || defaultBase;

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are an SEO copywriter. Create an SEO-optimized blog post draft based on this topic: "${topic}". Return a short JSON with fields: title, slug (URL friendly), excerpt (1-2 sentences), tags (array of 3-6 concise tags), and contentHtml (rich HTML with headings, paragraphs, lists, links, bold/italic where natural). Be concise, human, and avoid superlatives. No markdown, only JSON object.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const url = `${baseUrl}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || "Gemini request failed");
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const cleaned = text
    .trim()
    // remove ```json or ``` fences if present
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title,
      slug: parsed.slug,
      excerpt: parsed.excerpt,
      contentHtml: parsed.contentHtml,
      tags: Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t)) : undefined,
    };
  } catch (err) {
    throw new Error("Gemini response could not be parsed");
  }
}
