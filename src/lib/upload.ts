import { api } from "./api";

export type UploadResponse = {
  relativeUrl: string;
  absoluteUrl: string;
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
