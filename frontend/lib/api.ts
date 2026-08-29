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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 10_000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${body || res.statusText}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error(
          "Request timed out after 10s. Is the backend running?"
        );
      }
      // Re-throw with a friendlier message for network failures
      if (
        err.message === "Failed to fetch" ||
        err.message.includes("fetch")
      ) {
        throw new Error(
          "Cannot reach the CityOps backend. Check that it is running on " +
            API_BASE
        );
      }
      throw err;
    }
    throw new Error("An unexpected error occurred.");
  } finally {
    clearTimeout(timeoutId);
  }
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
