"use client";

import type { Point } from "@/lib/types";

interface Props {
  point: Point | null;
}

export default function PointInspector({ point }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-gray-700">Inspector</h2>
      {point ? (
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs text-gray-500">ID</p>
            <p className="text-sm font-mono break-all">{point.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Coordinates</p>
            <p className="text-sm font-mono">
              x: {point.x.toFixed(4)}, y: {point.y.toFixed(4)}
            </p>
          </div>
          {Object.keys(point.metadata).length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Metadata</p>
              <div className="flex flex-col gap-1">
                {Object.entries(point.metadata).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-xs">
                    <span className="text-gray-500 shrink-0">{k}:</span>
                    <span className="font-mono truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Click a point to inspect</p>
      )}
    </div>
  );
}
