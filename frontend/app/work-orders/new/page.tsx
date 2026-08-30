"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type mapboxgl from "mapbox-gl";
import MapView from "@/components/map/MapView";
import DrawPolygon from "@/components/map/DrawPolygon";
import ConflictAlert from "@/components/work-orders/ConflictAlert";
import WorkOrderForm from "@/components/work-orders/WorkOrderForm";
import LayerToggle from "@/components/map/LayerToggle";
import { api } from "@/lib/api";
import type { ConflictItem, WorkOrderResponse, Layer } from "@/lib/types";

const DEBOUNCE_MS = 400;

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(null);
  const [liveConflicts, setLiveConflicts] = useState<ConflictItem[]>([]);
  const [checking, setChecking] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Layer[]>([
    "road", "water", "electric", "telecom",
  ]);

  // Debounce + abort: prevents stale responses from overwriting fresh ones
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handlePolygonChange = useCallback(
    (poly: GeoJSON.Polygon | null) => {
      setPolygon(poly);

      // Cancel any pending debounce
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      if (!poly) {
        setLiveConflicts([]);
        setChecking(false);
        return;
      }

      setChecking(true);

      debounceTimer.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const result = await api.checkConflicts(poly);
          // Only apply if this controller wasn't aborted
          if (!controller.signal.aborted) {
            setLiveConflicts(result.conflicts);
          }
        } catch {
          if (!controller.signal.aborted) {
            setLiveConflicts([]);
          }
        } finally {
          if (!controller.signal.aborted) {
            setChecking(false);
          }
        }
      }, DEBOUNCE_MS);
    },
    []
  );

  const handleSubmitted = (result: WorkOrderResponse) => {
    router.push(`/work-orders/${result.id}`);
  };

  return (
    // Full height minus navbar (--nav-height CSS var = 64px)
    <div className="flex h-full" style={{ height: "calc(100vh - var(--nav-height))" }}>
      {/* ─── Left panel: 60% — Map ─────────────────────────────────────────── */}
      <div className="relative flex-[3] h-full overflow-hidden">
        <MapView
          onMapReady={setMap}
          activeLayers={activeLayers}
        >
          <LayerToggle activeLayers={activeLayers} onChange={setActiveLayers} />
        </MapView>
        {map && (
          <DrawPolygon map={map} onPolygonChange={handlePolygonChange} />
        )}

        {/* Draw hint overlay — disappears once a polygon is drawn */}
        {!polygon && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 surface rounded-full px-4 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)] pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            Click the polygon tool (top-left of map) to draw the work area
          </div>
        )}
      </div>

      {/* ─── Right panel: 40% — Sidebar ────────────────────────────────────── */}
      <div
        className="flex-[2] flex flex-col h-full overflow-y-auto bg-[var(--surface)] border-l border-[var(--border)]"
      >
        {/* Sidebar header */}
        <div className="flex-none px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--accent)]/20 flex items-center justify-center text-xs">
              📋
            </div>
            <h1 className="text-base font-bold text-[var(--text-primary)]">New Work Request</h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Draw the excavation zone on the map — conflicts are detected
            instantly as you draw.
          </p>
        </div>

        {/* Conflict preview */}
        <div className="flex-none px-5 py-4 border-b border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Live Conflict Detection
            </p>
            {polygon && !checking && (
              <span className="text-[10px] text-[var(--text-muted)]">
                {liveConflicts.length} issue{liveConflicts.length !== 1 ? "s" : ""} found
              </span>
            )}
          </div>
          <ConflictAlert
            conflicts={liveConflicts}
            hasPolygon={!!polygon}
            checking={checking}
          />
        </div>

        {/* Work order form */}
        <div className="flex-1 px-5 py-4 space-y-1">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Work Order Details
          </p>
          <WorkOrderForm polygon={polygon} onSubmitted={handleSubmitted} />
        </div>
      </div>
    </div>
  );
}
