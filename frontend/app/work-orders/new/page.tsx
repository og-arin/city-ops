"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type mapboxgl from "mapbox-gl";
import MapView from "@/components/map/MapView";
import DrawPolygon from "@/components/map/DrawPolygon";
import ConflictAlert from "@/components/work-orders/ConflictAlert";
import WorkOrderForm from "@/components/work-orders/WorkOrderForm";
import { api } from "@/lib/api";
import type { ConflictItem, WorkOrderResponse } from "@/lib/types";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(null);
  const [liveConflicts, setLiveConflicts] = useState<ConflictItem[]>([]);
  const [checking, setChecking] = useState(false);

  // Live conflict preview as soon as a shape is drawn — this is the "wow"
  // moment of the demo, so it fires the instant DrawPolygon reports a shape,
  // before the officer even fills in title/dates.
  const handlePolygonChange = async (poly: GeoJSON.Polygon | null) => {
    setPolygon(poly);
    if (!poly) {
      setLiveConflicts([]);
      return;
    }
    setChecking(true);
    try {
      const result = await api.checkConflicts(poly);
      setLiveConflicts(result.conflicts);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmitted = (result: WorkOrderResponse) => {
    router.push(`/work-orders/${result.id}`);
  };

  return (
    <div className="grid grid-cols-2 h-full">
      <div className="relative">
        <MapView onMapReady={setMap} />
        {map && <DrawPolygon map={map} onPolygonChange={handlePolygonChange} />}
      </div>

      <div className="p-6 overflow-y-auto space-y-6">
        <h1 className="text-xl font-bold">New Work Request</h1>

        <div>
          <p className="text-sm font-medium mb-2">
            {checking ? "Checking for conflicts..." : "Live Conflict Preview"}
          </p>
          <ConflictAlert conflicts={liveConflicts} />
        </div>

        <WorkOrderForm polygon={polygon} onSubmitted={handleSubmitted} />
      </div>
    </div>
  );
}
