import type { ProcessResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Upload failed");
  }
  const data = await res.json();
  return data.file_id as string;
}

export async function processFile(
  fileId: string,
  projectionMethod: string,
  nClusters: number = 8
): Promise<ProcessResponse> {
  const form = new FormData();
  form.append("file_id", fileId);
  form.append("projection_method", projectionMethod);
  form.append("n_clusters", String(nClusters));
  const res = await fetch(`${API_BASE}/process`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Processing failed");
  }
  return res.json() as Promise<ProcessResponse>;
}
