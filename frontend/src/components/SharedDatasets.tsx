"use client";

import { useEffect, useState } from "react";
import { listDatasets, lookupDataset } from "@/lib/api";
import type { SharedDataset, SharedDatasetDetail } from "@/lib/types";

interface Props {
  projection: string;
  nClusters: number;
  onLoad: (dataset: SharedDatasetDetail) => void;
}

export default function SharedDatasets({ projection, nClusters, onLoad }: Props) {
  const [datasets, setDatasets] = useState<SharedDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingName, setLoadingName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDatasets()
      .then(setDatasets)
      .catch(() => setError("Storage unavailable"))
      .finally(() => setLoading(false));
  }, []);

  // Deduplicate by name — keep first occurrence (most recent)
  const uniqueDatasets = datasets.filter(
    (d, i, arr) => arr.findIndex((x) => x.name === d.name) === i
  );

  async function handleLoad(name: string, description: string | null) {
    setLoadingName(name);
    setError(null);
    try {
      const dataset = await lookupDataset(name, projection, nClusters);
      onLoad(dataset);
    } catch {
      setError(`No "${name}" entry for ${projection.toUpperCase()} k=${nClusters}`);
    } finally {
      setLoadingName(null);
    }
  }

  if (loading) return <p className="text-xs text-gray-400">Loading datasets…</p>;
  if (error) return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-red-400">{error}</p>
    </div>
  );
  if (uniqueDatasets.length === 0) return <p className="text-xs text-gray-400">No shared datasets available</p>;

  return (
    <div className="flex flex-col gap-2">
      {uniqueDatasets.map((d) => (
        <div key={d.name} className="border border-gray-200 rounded p-2 flex flex-col gap-1">
          <p className="text-xs font-medium">{d.name}</p>
          {d.description && (
            <p className="text-xs text-gray-400 leading-snug">{d.description}</p>
          )}
          <p className="text-xs text-gray-400">{projection.toUpperCase()} · k={nClusters}</p>
          <button
            onClick={() => handleLoad(d.name, d.description)}
            disabled={loadingName === d.name}
            className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-xs text-white hover:bg-gray-700 disabled:opacity-40"
          >
            {loadingName === d.name ? "Loading…" : "Load"}
          </button>
        </div>
      ))}
    </div>
  );
}
