export interface Point {
  id: string;
  x: number;
  y: number;
  z: number;
  cluster: number;
  metadata: Record<string, unknown>;
}

export interface ProcessResponse {
  model_id: string | null;
  points: Point[];
  cleaning_report: Record<string, unknown>;
}

export interface SavedModel {
  id: string;
  name: string;
  projection_method: string;
  n_clusters: number;
  created_at: string;
}

export interface SavedModelDetail extends SavedModel {
  points: Point[];
  cleaning_report: Record<string, unknown>;
}
