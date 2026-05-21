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
