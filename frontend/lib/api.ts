// One place for every backend call. Routers change on the backend?
// Update the function here, every component using it just keeps working.

import type {
  WorkOrderResponse,
  WorkOrderCreatePayload,
  ConflictCheckResponse,
  RAGQueryResponse,
  InfrastructureFeatureCollection,
  Layer,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  // --- Infrastructure layers (for map) ---
  getInfrastructure: (layer?: Layer) =>
    request<InfrastructureFeatureCollection>(
      `/infrastructure${layer ? `?layer=${layer}` : ""}`
    ),

  // --- Conflict pre-check (before submitting a work order) ---
  checkConflicts: (polygon_geojson: GeoJSON.Polygon) =>
    request<ConflictCheckResponse>("/conflicts/check", {
      method: "POST",
      body: JSON.stringify({ polygon_geojson }),
    }),

  // --- Work orders ---
  createWorkOrder: (payload: WorkOrderCreatePayload) =>
    request<WorkOrderResponse>("/work-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listWorkOrders: () => request<WorkOrderResponse[]>("/work-orders"),

  getWorkOrder: (id: number) =>
    request<WorkOrderResponse>(`/work-orders/${id}`),

  acknowledgeConflict: (conflict_log_id: number, dept_slug: string) =>
    request<{ ok: boolean; remaining_unacknowledged: number }>(
      "/work-orders/acknowledge-conflict",
      { method: "POST", body: JSON.stringify({ conflict_log_id, dept_slug }) }
    ),

  // --- RAG ---
  askRAG: (question: string) =>
    request<RAGQueryResponse>("/rag/query", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),
};
