"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import UploadPanel from "@/components/UploadPanel";
import ProjectionControls from "@/components/ProjectionControls";
import PointInspector from "@/components/PointInspector";
import { processFile } from "@/lib/api";
import type { Point } from "@/lib/types";

const EmbeddingMap = dynamic(() => import("@/components/EmbeddingMap"), { ssr: false });

export default function Home() {
  const [fileId, setFileId] = useState<string | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [projection, setProjection] = useState<string>("umap");
  const [nClusters, setNClusters] = useState<number>(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    if (!fileId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processFile(fileId, projection, nClusters);
      setPoints(result.points);
      setSelectedPoint(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <aside className="w-72 flex-shrink-0 border-r border-gray-200 p-6 flex flex-col gap-6">
        <h1 className="text-xl font-semibold tracking-tight">Embeddings</h1>
        <UploadPanel onUpload={setFileId} fileId={fileId} />
        <ProjectionControls
          projection={projection}
          onProjectionChange={setProjection}
          nClusters={nClusters}
          onNClustersChange={setNClusters}
          onProcess={handleProcess}
          disabled={!fileId || loading}
          loading={loading}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </aside>

      <main className="flex-1 relative bg-gray-50">
        <EmbeddingMap points={points} onPointClick={setSelectedPoint} />
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
