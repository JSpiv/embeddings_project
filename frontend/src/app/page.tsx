"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import UploadPanel from "@/components/UploadPanel";
import ProjectionControls from "@/components/ProjectionControls";
import PointInspector from "@/components/PointInspector";
import SharedDatasets from "@/components/SharedDatasets";
import { processFile } from "@/lib/api";
import type { Point, SharedDatasetDetail } from "@/lib/types";

const EmbeddingMap = dynamic(() => import("@/components/EmbeddingMap"), { ssr: false });

function extractMetadataCols(points: Point[]): string[] {
  if (!points.length) return [];
  return Object.keys(points[0].metadata).filter((k) => {
    const val = points[0].metadata[k];
    return val !== null && val !== undefined && isNaN(Number(val));
  });
}

export default function Home() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [projection, setProjection] = useState<string>("umap");
  const [nClusters, setNClusters] = useState<number>(6);
  const [colorBy, setColorBy] = useState<string>("clusters");
  const [metadataColumns, setMetadataColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPoints(newPoints: Point[]) {
    setPoints(newPoints);
    setSelectedPoint(null);
    const cols = extractMetadataCols(newPoints);
    setMetadataColumns(cols);
    setColorBy(cols.length > 0 ? cols[0] : "clusters");
  }

  async function handleProcess() {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processFile(fileId, projection, nClusters);
      applyPoints(result.points);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLoadDataset(dataset: SharedDatasetDetail) {
    applyPoints(dataset.points);
    setProjection(dataset.projection_method);
    setNClusters(dataset.n_clusters);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-72 flex-shrink-0 border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto">
        <h1 className="text-xl font-semibold tracking-tight">Embeddings</h1>
        <UploadPanel onUpload={setFileId} fileId={fileId} />
        <ProjectionControls
          projection={projection}
          onProjectionChange={setProjection}
          nClusters={nClusters}
          onNClustersChange={setNClusters}
          colorBy={colorBy}
          onColorByChange={setColorBy}
          metadataColumns={metadataColumns}
          onProcess={handleProcess}
          disabled={!fileId || loading}
          loading={loading}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-gray-700">Datasets</h2>
          <SharedDatasets
            projection={projection}
            nClusters={nClusters}
            onLoad={handleLoadDataset}
          />
        </div>
      </aside>

      <main className="flex-1 relative bg-gray-50">
        <EmbeddingMap
          points={points}
          colorBy={colorBy}
          onPointClick={setSelectedPoint}
          onFallback={() => setColorBy("clusters")}
        />
        {points.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
            Upload a dataset and click Process to visualize embeddings
          </div>
        )}
      </main>

      <aside className="w-72 flex-shrink-0 border-l border-gray-200 p-6">
        <PointInspector point={selectedPoint} />
      </aside>
    </div>
  );
}
