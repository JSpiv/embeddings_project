"use client";

import { useState, useMemo, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import { OrbitView, COORDINATE_SYSTEM } from "@deck.gl/core";
import { PointCloudLayer, TextLayer, LineLayer } from "@deck.gl/layers";
import type { Point } from "@/lib/types";

const PALETTE: [number, number, number, number][] = [
  [99,  132, 255, 220],
  [255,  99, 132, 220],
  [75,  192, 132, 220],
  [255, 159,  64, 220],
  [153, 102, 255, 220],
  [255, 205,  86, 220],
  [54,  162, 235, 220],
  [255,  99, 255, 220],
  [99,  255, 192, 220],
  [255, 140,  99, 220],
  [140,  99, 255, 220],
  [99,  200,  99, 220],
  [200,  99,  99, 220],
  [99,  150, 200, 220],
  [200, 150,  99, 220],
  [150, 200,  99, 220],
  [99,   99, 200, 220],
  [200, 200,  99, 220],
  [200,  99, 200, 220],
  [99,  200, 200, 220],
];

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0] as [number, number, number],
  rotationX: 20,
  rotationOrbit: 30,
  zoom: 1,
  minZoom: -3,
  maxZoom: 10,
};

interface NormalizedPoint extends Point {
  position: [number, number, number];
}

interface Props {
  points: Point[];
  colorBy: string;
  onPointClick: (point: Point) => void;
  onFallback?: () => void;
}

export default function EmbeddingMap({ points, colorBy, onPointClick, onFallback }: Props) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  useEffect(() => {
    if (points.length > 0) setViewState(INITIAL_VIEW_STATE);
  }, [points]);

  const normalized = useMemo((): NormalizedPoint[] => {
    if (!points.length) return [];
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const zs = points.map((p) => p.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const range = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    return points.map((p) => ({
      ...p,
      position: [
        ((p.x - cx) / range) * 400,
        ((p.y - cy) / range) * 400,
        ((p.z - cz) / range) * 400,
      ],
    }));
  }, [points]);

  // Build value→color map for metadata column, falling back to clusters if column is empty
  const { valueColorMap, usingFallback } = useMemo(() => {
    if (colorBy === "clusters") {
      return { valueColorMap: null, usingFallback: false };
    }
    const values = normalized.map((p) => p.metadata[colorBy]);
    const hasData = values.some((v) => v !== null && v !== undefined && v !== "");
    if (!hasData) {
      onFallback?.();
      return { valueColorMap: null, usingFallback: true };
    }
    const unique = Array.from(new Set(values.map(String)));
    const map: Record<string, [number, number, number, number]> = {};
    unique.forEach((v, i) => { map[v] = PALETTE[i % PALETTE.length]; });
    return { valueColorMap: map, usingFallback: false };
  }, [normalized, colorBy, onFallback]);

  const getColor = (p: NormalizedPoint): [number, number, number, number] => {
    if (valueColorMap) {
      const v = String(p.metadata[colorBy] ?? "");
      return valueColorMap[v] ?? PALETTE[0];
    }
    return PALETTE[p.cluster % PALETTE.length];
  };

  const getLabel = (p: NormalizedPoint): string => {
    if (valueColorMap) return String(p.metadata[colorBy] ?? "");
    return `Cluster ${p.cluster}`;
  };

  // Centroids keyed by label value
  const centroids = useMemo(() => {
    const sums: Record<string, [number, number, number, number]> = {};
    for (const p of normalized) {
      const key = getLabel(p);
      if (!sums[key]) sums[key] = [0, 0, 0, 0];
      sums[key][0] += p.position[0];
      sums[key][1] += p.position[1];
      sums[key][2] += p.position[2];
      sums[key][3]++;
    }
    return Object.entries(sums).map(([label, [sx, sy, sz, count]]) => ({
      label,
      position: [sx / count, sy / count, sz / count] as [number, number, number],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, colorBy, valueColorMap]);

  const pointLayer = new PointCloudLayer<NormalizedPoint>({
    id: "embedding",
    data: normalized,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getPosition: (d) => d.position,
    getColor: (d) => getColor(d),
    pointSize: 2,
    pickable: true,
    onClick: ({ object }) => object && onPointClick(object),
    updateTriggers: { getColor: [colorBy, valueColorMap] },
  });

  const AXIS_LENGTH = 220;
  const axisLayer = new LineLayer({
    id: "axes",
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: [
      { from: [-AXIS_LENGTH, 0, 0], to: [AXIS_LENGTH, 0, 0], color: [220, 60, 60, 200] },
      { from: [0, -AXIS_LENGTH, 0], to: [0, AXIS_LENGTH, 0], color: [60, 180, 60, 200] },
      { from: [0, 0, -AXIS_LENGTH], to: [0, 0, AXIS_LENGTH], color: [60, 60, 220, 200] },
    ],
    getSourcePosition: (d) => d.from,
    getTargetPosition: (d) => d.to,
    getColor: (d) => d.color,
    getWidth: 1,
    pickable: false,
  });

  const axisLabelLayer = new TextLayer({
    id: "axis-labels",
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: [
      { position: [AXIS_LENGTH + 15, 0, 0], text: "X", color: [220, 60, 60, 220] },
      { position: [0, AXIS_LENGTH + 15, 0], text: "Y", color: [60, 180, 60, 220] },
      { position: [0, 0, AXIS_LENGTH + 15], text: "Z", color: [60, 60, 220, 220] },
    ],
    getPosition: (d) => d.position,
    getText: (d) => d.text,
    getColor: (d) => d.color,
    getSize: 14,
    fontWeight: 700,
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    pickable: false,
  });

  const labelLayer = new TextLayer({
    id: "labels",
    data: centroids,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getPosition: (d) => d.position,
    getText: (d) => d.label,
    getColor: [30, 30, 30, 220],
    getSize: 14,
    getTextAnchor: "middle",
    getAlignmentBaseline: "center",
    fontWeight: 600,
    background: true,
    getBackgroundColor: [255, 255, 255, 180],
    backgroundPadding: [4, 2, 4, 2],
    pickable: false,
    updateTriggers: { getText: [colorBy, valueColorMap] },
  });

  return (
    <div className="w-full h-full relative">
      {usingFallback && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-3 py-1.5 rounded-full pointer-events-none">
          No data for selected column — showing k-means clusters
        </div>
      )}
      <DeckGL
        views={new OrbitView({ orbitAxis: "Y" })}
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) =>
          setViewState(vs as typeof INITIAL_VIEW_STATE)
        }
        layers={[axisLayer, axisLabelLayer, pointLayer, labelLayer]}
        controller
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
