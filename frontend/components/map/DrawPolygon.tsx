"use client";

import { useEffect, useRef } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type mapboxgl from "mapbox-gl";
import { api } from "../../lib/api";
import type { ConflictCheckResponse } from "../../lib/types";

interface DrawPolygonProps {
  map: mapboxgl.Map | null; // pass mapRef.current down from the parent page
  onPolygonChange: (polygon: GeoJSON.Polygon | null) => void;
  onConflictCheck: (loading: boolean, results?: ConflictCheckResponse) => void;
}

export default function DrawPolygon({ map, onPolygonChange, onConflictCheck }: DrawPolygonProps) {
  const drawRef = useRef<MapboxDraw | null>(null);

  useEffect(() => {
    if (!map) return;

    if (!drawRef.current) {
      drawRef.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
    }

    const draw = drawRef.current;

    // React strict-mode check: only add control if not already present
    if (!map.hasControl(draw)) {
      map.addControl(draw);
    }

    const handleUpdate = async () => {
      const data = draw.getAll();
      if (data.features.length > 0) {
        const polygon = data.features[0].geometry as GeoJSON.Polygon;
        onPolygonChange(polygon);

        onConflictCheck(true);
        try {
          const results = await api.checkConflicts(polygon);
          onConflictCheck(false, results);
        } catch (error) {
          console.error("Failed to check conflicts:", error);
          onConflictCheck(false);
        }
      } else {
        handleDelete();
      }
    };

    const handleDelete = () => {
      onPolygonChange(null);
      onConflictCheck(false, undefined);
    };

    map.on("draw.create", handleUpdate);
    map.on("draw.update", handleUpdate);
    map.on("draw.delete", handleDelete);

    return () => {
      if (!map || !map.getStyle()) return;

      map.off("draw.create", handleUpdate);
      map.off("draw.update", handleUpdate);
      map.off("draw.delete", handleDelete);
      
      if (map.hasControl(draw)) {
        map.removeControl(draw);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, onPolygonChange, onConflictCheck]);

  return null; // this component only wires up map controls, renders nothing itself
}
