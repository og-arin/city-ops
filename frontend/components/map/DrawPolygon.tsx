"use client";

import { useEffect, useRef } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
// @ts-expect-error — no type declarations shipped for this package
import FreehandMode from "mapbox-gl-draw-freehand-mode";
import type mapboxgl from "mapbox-gl";
import { api } from "../../lib/api";
import type { ConflictCheckResponse } from "../../lib/types";

// mapbox-gl-draw's default theme always fills a Polygon feature, even the
// still-open ring being actively dragged — so the "enclosed area" shows
// mid-draw. Every rendered feature carries a `mode` property set to the
// currently active mode name, so suppress the fill specifically while
// draw_polygon is active; it fills normally once the drag ends and control
// hands off to simple_select.
const defaultTheme = (MapboxDraw as unknown as { lib: { theme: mapboxgl.AnyLayer[] } }).lib.theme;
const DRAW_STYLES = defaultTheme.map((layer: any) =>
  layer.id === "gl-draw-polygon-fill"
    ? {
        ...layer,
        paint: {
          ...layer.paint,
          "fill-opacity": [
            "case",
            ["==", ["get", "mode"], "draw_polygon"], 0,
            layer.paint["fill-opacity"],
          ],
        },
      }
    : layer
);

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
        // Draw by dragging (lasso-style) instead of click-per-vertex.
        modes: {
          ...MapboxDraw.modes,
          draw_polygon: FreehandMode,
        } as unknown as { [modeKey: string]: MapboxDraw.DrawCustomMode },
        styles: DRAW_STYLES as unknown as MapboxDraw.MapboxDrawOptions["styles"],
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
