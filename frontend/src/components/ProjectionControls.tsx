"use client";

interface Props {
  projection: string;
  onProjectionChange: (p: string) => void;
  nClusters: number;
  onNClustersChange: (n: number) => void;
  colorBy: string;
  onColorByChange: (c: string) => void;
  metadataColumns: string[];
  onProcess: () => void;
  disabled: boolean;
  loading: boolean;
}

const PROJECTIONS = [
  { value: "pca", label: "PCA" },
  { value: "umap", label: "UMAP" },
  { value: "tsne", label: "t-SNE" },
];

export default function ProjectionControls({
  projection,
  onProjectionChange,
  nClusters,
  onNClustersChange,
  colorBy,
  onColorByChange,
  metadataColumns,
  onProcess,
  disabled,
  loading,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-gray-700">Projection</h2>
      <select
        value={projection}
        onChange={(e) => onProjectionChange(e.target.value)}
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        {PROJECTIONS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Clusters (k={nClusters})</label>
        <input
          type="range"
          min={2}
          max={6}
          value={nClusters}
          onChange={(e) => onNClustersChange(Number(e.target.value))}
          className="w-full accent-gray-900"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Color by</label>
        <select
          value={colorBy}
          onChange={(e) => onColorByChange(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <option value="clusters">K-Means Clusters</option>
          {metadataColumns.map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>
      <button
        onClick={onProcess}
        disabled={disabled}
        className="w-full rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition disabled:opacity-40"
      >
        {loading ? "Processing…" : "Process"}
      </button>
    </div>
  );
}
