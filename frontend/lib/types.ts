// Keep this file in lockstep with backend/app/schemas/*.py.
// If a field changes on one side, change it here in the same commit.

export type Severity = "red" | "yellow";
export type Layer = "road" | "water" | "electric" | "telecom";

export interface ConflictItem {
  asset_id: number;
  layer: Layer;
  name: string;
  severity: Severity;
  distance_meters: number;
  owner_dept_slug: string;
  conflict_log_id?: number; // absent on live /conflicts/check preview; present once persisted
  acknowledged?: boolean;
}

export type WorkOrderStatus =
  | "pending"
  | "conflict"
  | "coordinating"
  | "approved"
  | "completed"
  | "rejected";

export interface WorkOrderResponse {
  id: number;
  title: string;
  requesting_dept_slug: string;
  status: WorkOrderStatus;
  start_date: string; // ISO datetime
  end_date: string;
  created_at: string;
  conflicts: ConflictItem[];
}

export interface WorkOrderCreatePayload {
  title: string;
  requesting_dept_slug: string;
  polygon_geojson: GeoJSON.Polygon;
  start_date: string;
  end_date: string;
}

export interface ConflictCheckResponse {
  has_conflict: boolean;
  conflicts: ConflictItem[];
}

export interface RAGQueryResponse {
  answer: string;
  sources: string[];
}

export interface InfrastructureFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: GeoJSON.Geometry;
    properties: {
      id: number;
      layer: Layer;
      name: string;
      owner_dept_slug: string;
      depth_meters: number | null;
    };
  }>;
}
