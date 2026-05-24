export interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  cluster: number;
  metadata: Record<string, unknown>;
}

export interface ProcessResponse {
  points: Point[];
  cleaning_report: Record<string, unknown>;
}

export interface SharedDataset {
  id: string;
  name: string;
  description: string | null;
  projection_method: string;
  n_clusters: number;
  created_at: string;
}

export interface SharedDatasetDetail extends SharedDataset {
  points: Point[];
  cleaning_report: Record<string, unknown>;
}
