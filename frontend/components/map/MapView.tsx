"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api } from "@/lib/api";
import type { Layer, InfrastructureFeatureCollection } from "@/lib/types";

// 1. Token assigned strictly outside the React lifecycle
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = MAPBOX_TOKEN;

const LAYER_CONFIG: Record<Layer, { color: string; width?: number; dashed?: boolean; type?: "line" | "fill"; offset?: number }> = {
  ward: { color: "#8b5cf6", type: "fill" },
  road: { color: "#64748b", width: 6 },
  drainage: { color: "#00FFCC", width: 3, dashed: true, offset: 4 },
};

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  activeLayers?: Layer[];
  children?: React.ReactNode;
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function MapView({
  center = [73.8567, 18.5204],
  zoom = 14,
  activeLayers = ["ward", "road", "drainage"],
  children,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    mapRef.current = map;

    map.on("load", () => {
      map.resize(); // The single most important fix for blank screens
      setIsMapLoaded(true);
      if (onMapReady) onMapReady(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DATA FETCHING & LAYER RENDERING ---
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const loadLayers = async () => {
      for (const layer of Object.keys(LAYER_CONFIG) as Layer[]) {
        const sourceId = `infra-${layer}`;
        if (map.getSource(sourceId)) continue; // Prevent double-fetching

        try {
          const data = await api.getInfrastructure(layer);

          // Safety checks after the async await
          if (!mapRef.current || !mapRef.current.isStyleLoaded()) continue;
          if (mapRef.current.getSource(sourceId)) continue;

          mapRef.current.addSource(sourceId, { type: "geojson", data: data as any });

          const cfg = LAYER_CONFIG[layer];
          const isFill = cfg.type === "fill";

          mapRef.current.addLayer({
            id: sourceId,
            type: isFill ? "fill" : "line",
            source: sourceId,
            layout: {
              visibility: activeLayers.includes(layer) ? "visible" : "none",
              ...(isFill ? {} : { "line-cap": "round", "line-join": "round" }),
            },
            paint: isFill 
              ? {
                  "fill-color": cfg.color,
                  "fill-opacity": 0.15,
                  "fill-outline-color": "#ffffff",
                }
              : {
                  "line-color": cfg.color,
                  "line-width": cfg.width || 3,
                  "line-opacity": 0.9,
                  ...(cfg.offset ? { "line-offset": cfg.offset } : {}),
                  ...(cfg.dashed ? { "line-dasharray": [2, 2] } : {}),
                },
          });
        } catch (err) {
          console.error(`Failed to load layer "${layer}":`, err);
        }
      }
    };
    
    loadLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded]);

  // --- LAYER VISIBILITY TOGGLES ---
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    (Object.keys(LAYER_CONFIG) as Layer[]).forEach((layer) => {
      const id = `infra-${layer}`;
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", activeLayers.includes(layer) ? "visible" : "none");
      }
    });
  }, [activeLayers, isMapLoaded]);

  // --- THE UNBREAKABLE CONTAINER ---
  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '600px', height: 'calc(100vh - 100px)' }}>
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem' }} />
      {children}
    </div>
  );
}