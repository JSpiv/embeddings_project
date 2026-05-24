"use client";

import { useEffect, useState } from "react";
import { listDatasets, loadDataset } from "@/lib/api";
import type { SharedDataset, SharedDatasetDetail } from "@/lib/types";

interface Props {
  onLoad: (dataset: SharedDatasetDetail) => void;
}

export default function SharedDatasets({ onLoad }: Props) {
  const [datasets, setDatasets] = useState<SharedDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDatasets()
      .then(setDatasets)
      .catch(() => setError("Storage unavailable"))
      .finally(() => setLoading(false));
  }, []);

  async function handleLoad(id: string) {
    setLoadingId(id);
    try {
      const dataset = await loadDataset(id);
      onLoad(dataset);
    } catch {
      setError("Failed to load dataset");
    } finally {
      setLoadingId(null);
    }
  }

  if (loading) return <p className="text-xs text-gray-400">Loading datasets…</p>;
  if (error) return <p className="text-xs text-red-400">{error}</p>;
  if (datasets.length === 0) return <p className="text-xs text-gray-400">No shared datasets available</p>;

  return (
    <div className="flex flex-col gap-2">
      {datasets.map((d) => (
        <div key={d.id} className="border border-gray-200 rounded p-2 flex flex-col gap-1">
          <p className="text-xs font-medium truncate" title={d.name}>{d.name}</p>
          {d.description && (
            <p className="text-xs text-gray-400 leading-snug">{d.description}</p>
          )}
          <p className="text-xs text-gray-400">{d.projection_method.toUpperCase()} · k={d.n_clusters}</p>
          <button
            onClick={() => handleLoad(d.id)}
            disabled={loadingId === d.id}
            className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-700 disabled:opacity-40"
          >
            {loadingId === d.id ? "Loading…" : "Load"}
          </button>
        </div>
      ))}
    </div>
  );
}
