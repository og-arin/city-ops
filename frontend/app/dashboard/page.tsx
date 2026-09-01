"use client";

import { useState } from "react";
import MapView from "@/components/map/MapView";
import LayerToggle from "@/components/map/LayerToggle";
import type { Layer } from "@/lib/types";

export default function DashboardPage() {
  const [activeLayers, setActiveLayers] = useState<Layer[]>([
    "road", "drainage", "ward",
  ]);

  return (
    <div className="relative w-full h-full">
      <MapView activeLayers={activeLayers}>
        <LayerToggle activeLayers={activeLayers} onChange={setActiveLayers} />
      </MapView>
    </div>
  );
}
