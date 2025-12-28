import { api } from "./api";

export type SeoDraft = {
  title?: string;
  slug?: string;
  excerpt?: string;
  contentHtml?: string;
  tags?: string[];
};

export async function generateSeoDraft(topic: string): Promise<SeoDraft> {
  if (!topic.trim()) throw new Error("Topic is required");
  try {
    const res = await api.post("/admin/ai/post-draft", { topic: topic.trim() });
    return res.data?.draft as SeoDraft;
  } catch (err: any) {
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to generate draft";
    throw new Error(msg);
  }
}
