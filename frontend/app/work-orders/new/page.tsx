"use client";

import { useState, useRef, useCallback } from "react";
import type mapboxgl from "mapbox-gl";
import MapView from "@/components/map/MapView";
import DrawPolygon from "@/components/map/DrawPolygon";
import WorkOrderForm from "@/components/work-orders/WorkOrderForm";
import RagChat from "@/components/rag/RagChat";
import type { RagChatHandle } from "@/components/rag/RagChat";
import type { ConflictCheckResponse } from "@/lib/types";

export default function NewWorkOrderPage() {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [conflictResults, setConflictResults] = useState<ConflictCheckResponse | undefined>();
  const ragChatRef = useRef<RagChatHandle>(null);

  const handleAutoAudit = useCallback((query: string) => {
    ragChatRef.current?.sendQuery(query);
  }, []);

  const handleReset = useCallback(() => {
    setPolygon(null);
    setConflictResults(undefined);
  }, []);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden">

      {/* LEFT SIDE: The Map */}
      <div className="w-2/3 h-full relative border-r border-[var(--border)] p-4">
        <MapView onMapReady={setMapInstance}>
          {mapInstance && (
            <DrawPolygon
              map={mapInstance}
              onPolygonChange={setPolygon}
              onConflictCheck={(loading, results) => {
                setIsChecking(loading);
                if (results) setConflictResults(results);
              }}
            />
          )}
        </MapView>
      </div>

      {/* RIGHT SIDE: The Form and Chat */}
      <div className="w-1/3 h-full overflow-y-auto p-6 bg-[var(--bg-base)] flex flex-col gap-6">
        <div>
          <WorkOrderForm
            polygon={polygon}
            conflictResults={conflictResults}
            isChecking={isChecking}
            onAutoAudit={handleAutoAudit}
            onReset={handleReset}
          />
        </div>
        
        <div className="flex-1 min-h-[300px]">
          <RagChat ref={ragChatRef} />
        </div>
      </div>

    </div>
  );
}
