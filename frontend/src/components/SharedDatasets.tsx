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
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingNow, setLoadingNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDatasets()
      .then((data) => {
        setDatasets(data);
        if (data.length > 0) setSelected(data[0].name);
      })
      .catch(() => setError("Storage unavailable"))
      .finally(() => setLoading(false));
  }, []);

  // Unique names only
  const uniqueNames = [...new Set(datasets.map((d) => d.name))];

  async function handleLoad() {
    if (!selected) return;
    setLoadingNow(true);
    setError(null);
    try {
      const dataset = await lookupDataset(selected, projection, nClusters);
      onLoad(dataset);
    } catch {
      setError(`No entry for ${projection.toUpperCase()} k=${nClusters}`);
    } finally {
      setLoadingNow(false);
    }
  }

  if (loading) return <p className="text-xs text-gray-400">Loading datasets…</p>;
  if (uniqueNames.length === 0 && !error) return <p className="text-xs text-gray-400">No shared datasets available</p>;

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        {uniqueNames.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <button
        onClick={handleLoad}
        disabled={loadingNow || !selected}
        className="w-full rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition disabled:opacity-40"
      >
        {loadingNow ? "Loading…" : "Load"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
