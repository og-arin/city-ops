"use client";

// Core map shell. Renders base map + infra layers. DrawPolygon and
// ConflictAlert compose on top of this — this component just owns the map
// instance and layer toggling, nothing else.

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api } from "@/lib/api";
import type { Layer, InfrastructureFeatureCollection } from "@/lib/types";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const LAYER_COLORS: Record<Layer, string> = {
  road: "#6b7280",
  water: "#3b82f6",
  electric: "#f59e0b",
  telecom: "#a855f7",
};

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  activeLayers?: Layer[];
  children?: React.ReactNode; // slot for DrawPolygon control etc.
  onMapReady?: (map: mapboxgl.Map) => void; // gives pages the raw map instance, e.g. to wire up DrawPolygon
}

export default function MapView({
  center = [73.8567, 18.5204], // demo city default — swap for your actual city center
  zoom = 14,
  activeLayers = ["road", "water", "electric", "telecom"],
  children,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  // init map once
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center,
      zoom,
    });

    map.on("load", () => {
      setLoaded(true);
      onMapReady?.(map);
    });
    mapRef.current = map;

    return () => map.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load + toggle infra layers once map is ready
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = mapRef.current;

    (Object.keys(LAYER_COLORS) as Layer[]).forEach(async (layer) => {
      const sourceId = `infra-${layer}`;
      if (map.getSource(sourceId)) return;

      const data: InfrastructureFeatureCollection = await api.getInfrastructure(layer);

      map.addSource(sourceId, { type: "geojson", data: data as any });
      map.addLayer({
        id: sourceId,
        type: "line",
        source: sourceId,
        layout: { visibility: activeLayers.includes(layer) ? "visible" : "none" },
        paint: { "line-color": LAYER_COLORS[layer], "line-width": 3 },
      });
    });
  }, [loaded, activeLayers]);

  // apply visibility changes when activeLayers prop changes
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = mapRef.current;
    (Object.keys(LAYER_COLORS) as Layer[]).forEach((layer) => {
      const id = `infra-${layer}`;
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", activeLayers.includes(layer) ? "visible" : "none");
      }
    });
  }, [activeLayers, loaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      {children}
    </div>
  );
}
