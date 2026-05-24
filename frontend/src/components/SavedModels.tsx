"use client";

import { useEffect, useState } from "react";
import { listModels, loadModel, deleteModel } from "@/lib/api";
import type { SavedModel, SavedModelDetail } from "@/lib/types";

interface Props {
  onLoad: (model: SavedModelDetail) => void;
}

export default function SavedModels({ onLoad }: Props) {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchModels() {
    try {
      setModels(await listModels());
    } catch {
      setError("Storage unavailable");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchModels(); }, []);

  async function handleLoad(id: string) {
    setLoadingId(id);
    try {
      const model = await loadModel(id);
      onLoad(model);
    } catch {
      setError("Failed to load model");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteModel(id);
    setModels((prev) => prev.filter((m) => m.id !== id));
  }

  if (loading) return <p className="text-xs text-gray-400">Loading models…</p>;
  if (error) return <p className="text-xs text-red-400">{error}</p>;
  if (models.length === 0) return <p className="text-xs text-gray-400">No saved models yet</p>;

  return (
    <div className="flex flex-col gap-2">
      {models.map((m) => (
        <div key={m.id} className="border border-gray-200 rounded p-2 flex flex-col gap-1">
          <p className="text-xs font-medium truncate" title={m.name}>{m.name}</p>
          <p className="text-xs text-gray-400">{m.projection_method.toUpperCase()} · k={m.n_clusters}</p>
          <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => handleLoad(m.id)}
              disabled={loadingId === m.id}
              className="flex-1 rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-700 disabled:opacity-40"
            >
              {loadingId === m.id ? "Loading…" : "Load"}
            </button>
            <button
              onClick={() => handleDelete(m.id)}
              className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:text-red-500 hover:border-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
