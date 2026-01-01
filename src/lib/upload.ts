import { api } from "./api";

export type UploadResponse = {
  relativeUrl: string;
  absoluteUrl: string;
  remaining?: number;
};

export async function uploadCoverImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/admin/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const relativeUrl: string = res.data.url;
  const absoluteUrl: string = res.data.absoluteUrl ?? relativeUrl;

  return { relativeUrl, absoluteUrl } as UploadResponse;
}

export async function generateCoverImage(prompt: string, postId?: string) {
  const res = await api.post("/admin/ai/cover-image", { prompt, postId });
  const relativeUrl: string = res.data.url;
  const absoluteUrl: string = res.data.absoluteUrl ?? relativeUrl;
  const remaining: number | undefined = res.data.remaining;
  return { relativeUrl, absoluteUrl, remaining } as UploadResponse;
}
