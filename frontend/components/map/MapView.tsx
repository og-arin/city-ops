"use client";

// Core map shell. Renders base map + infra layers. DrawPolygon and
// ConflictAlert compose on top of this — this component just owns the map
// instance and layer toggling, nothing else.

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api } from "@/lib/api";
import { LAYER_COLORS } from "@/lib/theme";
import type { Layer, InfrastructureFeatureCollection } from "@/lib/types";

const MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  "";

const LAYER_CONFIG: Record<
  Layer,
  { color: string; width: number; dashed?: boolean }
> = {
  road:     { color: LAYER_COLORS.road,     width: 4 },
  water:    { color: LAYER_COLORS.water,    width: 3 },
  electric: { color: LAYER_COLORS.electric, width: 3, dashed: true },
  telecom:  { color: LAYER_COLORS.telecom,  width: 3 },
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
  activeLayers = ["road", "water", "electric", "telecom"],
  children,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Token safety guard — render a placeholder instead of crashing
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-full min-h-[500px] flex items-center justify-center bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
        <div className="text-center space-y-3 max-w-sm px-6">
          <div className="text-4xl">🗺️</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Mapbox Token Missing
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Add{" "}
            <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--accent)] text-xs font-mono-data">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>{" "}
            to your{" "}
            <code className="bg-[var(--surface)] px-1.5 py-0.5 rounded text-[var(--accent)] text-xs font-mono-data">
              .env.local
            </code>
            .{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] underline"
            >
              Get a free token →
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Set token once
  if (!mapboxgl.accessToken) {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom,
    });

    map.on("load", () => {
      map.resize(); // prevent partial-render glitch
      setLoaded(true);
      onMapReady?.(map);
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load infra layers once the map is ready
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = mapRef.current;

    (Object.keys(LAYER_CONFIG) as Layer[]).forEach(async (layer) => {
      const sourceId = `infra-${layer}`;
      if (map.getSource(sourceId)) return;

      try {
        const data: InfrastructureFeatureCollection =
          await api.getInfrastructure(layer);

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: "geojson", data: data as any });
        }

        const cfg = LAYER_CONFIG[layer];
        const paintProps: mapboxgl.LinePaint = {
          "line-color": cfg.color,
          "line-width": cfg.width,
          "line-opacity": 0.9,
        };
        if (cfg.dashed) {
          paintProps["line-dasharray"] = [4, 2];
        }

        if (!map.getLayer(sourceId)) {
          map.addLayer({
            id: sourceId,
            type: "line",
            source: sourceId,
            layout: {
              visibility: activeLayers.includes(layer) ? "visible" : "none",
              "line-cap": "round",
              "line-join": "round",
            },
            paint: paintProps,
          });
        }
      } catch (err) {
        // Backend offline — silently skip; map still renders
        console.warn(`[MapView] Could not load layer "${layer}":`, err);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  // Apply visibility changes when activeLayers prop changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const map = mapRef.current;
    (Object.keys(LAYER_CONFIG) as Layer[]).forEach((layer) => {
      const id = `infra-${layer}`;
      if (map.getLayer(id)) {
        map.setLayoutProperty(
          id,
          "visibility",
          activeLayers.includes(layer) ? "visible" : "none"
        );
      }
    });
  }, [activeLayers, loaded]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-xl" />
      {children}
    </div>
  );
}
