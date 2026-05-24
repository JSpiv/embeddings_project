import type { ProcessResponse, SavedModel, SavedModelDetail } from "./types";

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

export async function listModels(): Promise<SavedModel[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error("Failed to load models");
  return res.json() as Promise<SavedModel[]>;
}

export async function loadModel(modelId: string): Promise<SavedModelDetail> {
  const res = await fetch(`${API_BASE}/models/${modelId}`);
  if (!res.ok) throw new Error("Failed to load model");
  return res.json() as Promise<SavedModelDetail>;
}

export async function deleteModel(modelId: string): Promise<void> {
  await fetch(`${API_BASE}/models/${modelId}`, { method: "DELETE" });
}
