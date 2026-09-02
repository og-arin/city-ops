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
  /** false for decorative/backdrop use — disables pan/zoom/drag and hides controls. */
  interactive?: boolean;
}

export default function MapView({
  center = [73.8567, 18.5204],
  zoom = 14,
  activeLayers = ["ward", "road", "drainage"],
  children,
  onMapReady,
  interactive = true,
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
      interactive,
    });

    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    }
    mapRef.current = map;

    map.on("load", () => {
      // In dev, React StrictMode mounts/cleans up/remounts this effect once;
      // if this instance's "load" fires after cleanup already tore it down
      // (mapRef.current now points at the remount's map, or nothing), skip —
      // acting on it would touch a removed map and crash.
      if (mapRef.current !== map) return;
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
    // Guards every map access below: if this effect is cleaned up (unmount,
    // or a StrictMode dev double-invoke) while an `await` is in flight, the
    // loop must stop touching the map instead of calling into a removed one.
    let cancelled = false;

    const loadLayers = async () => {
      for (const layer of Object.keys(LAYER_CONFIG) as Layer[]) {
        if (cancelled || !mapRef.current) return;
        const sourceId = `infra-${layer}`;
        if (mapRef.current.getSource(sourceId)) continue; // Prevent double-fetching

        try {
          const data = await api.getInfrastructure(layer);

          // Safety checks after the async await. NOTE: don't gate on
          // isStyleLoaded() here — adding a source makes it report "loading"
          // again until that source's tiles finish, so checking it mid-loop
          // races with the previous layer's own load and randomly skips
          // this one. The map's "load" event (isMapLoaded) already
          // guarantees the style itself is ready to accept sources/layers.
          if (cancelled || !mapRef.current) continue;
          if (mapRef.current.getSource(sourceId)) continue;

          mapRef.current.addSource(sourceId, { type: "geojson", data: data as any });

          const cfg = LAYER_CONFIG[layer];
          const isFill = cfg.type === "fill";
          const visibility = activeLayers.includes(layer) ? "visible" : "none";

          mapRef.current.addLayer({
            id: sourceId,
            type: isFill ? "fill" : "line",
            source: sourceId,
            layout: {
              visibility,
              ...(isFill ? {} : { "line-cap": "round", "line-join": "round" }),
            },
            paint: isFill
              ? {
                  "fill-color": cfg.color,
                  "fill-opacity": 0.15,
                }
              : {
                  "line-color": cfg.color,
                  "line-width": cfg.width || 3,
                  "line-opacity": 0.9,
                  ...(cfg.offset ? { "line-offset": cfg.offset } : {}),
                  ...(cfg.dashed ? { "line-dasharray": [2, 2] } : {}),
                },
          });

          // fill-outline-color is a fixed ~1px antialiased line and barely
          // reads on a dark basemap — add a real stroke so ward boundaries
          // are actually visible.
          if (isFill) {
            mapRef.current.addLayer({
              id: `${sourceId}-outline`,
              type: "line",
              source: sourceId,
              layout: { visibility, "line-cap": "round", "line-join": "round" },
              paint: { "line-color": cfg.color, "line-width": 2, "line-opacity": 0.8 },
            });
          }
        } catch (err) {
          console.error(`Failed to load layer "${layer}":`, err);
        }
      }
    };
    
    loadLayers();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded]);

  // --- LAYER VISIBILITY TOGGLES ---
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    (Object.keys(LAYER_CONFIG) as Layer[]).forEach((layer) => {
      const id = `infra-${layer}`;
      const visibility = activeLayers.includes(layer) ? "visible" : "none";
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", visibility);
      const outlineId = `${id}-outline`;
      if (map.getLayer(outlineId)) map.setLayoutProperty(outlineId, "visibility", visibility);
    });
  }, [activeLayers, isMapLoaded]);

  // --- THE UNBREAKABLE CONTAINER ---
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem' }} />
      {children}
    </div>
  );
}