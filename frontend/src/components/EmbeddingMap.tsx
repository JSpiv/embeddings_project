"use client";

import { useState, useMemo, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import { OrbitView, COORDINATE_SYSTEM } from "@deck.gl/core";
import { PointCloudLayer } from "@deck.gl/layers";
import type { Point } from "@/lib/types";

const CLUSTER_COLORS: [number, number, number, number][] = [
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
  onPointClick: (point: Point) => void;
}

export default function EmbeddingMap({ points, onPointClick }: Props) {
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

  const layer = new PointCloudLayer<NormalizedPoint>({
    id: "embedding",
    data: normalized,
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    getPosition: (d) => d.position,
    getColor: (d) => CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length],
    pointSize: 2,
    pickable: true,
    onClick: ({ object }) => object && onPointClick(object),
  });

  return (
    <DeckGL
      views={new OrbitView({ orbitAxis: "Y" })}
      viewState={viewState}
      onViewStateChange={({ viewState: vs }) =>
        setViewState(vs as typeof INITIAL_VIEW_STATE)
      }
      layers={[layer]}
      controller
      style={{ width: "100%", height: "100%" }}
    />
  );
}
