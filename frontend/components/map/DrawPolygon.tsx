"use client";

// This is the single most important interaction in the app: officer draws
// the area they want to dig, and we hand the polygon back up so the parent
// (work-orders/new page) can run a live conflict check as they draw.
//
// Uses @mapbox/mapbox-gl-draw. This component assumes it's rendered as a
// child of MapView, so it reaches into the map instance via a ref passed
// down — wire that connection when you integrate (see comment below).

import { useEffect, useRef } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type mapboxgl from "mapbox-gl";

interface DrawPolygonProps {
  map: mapboxgl.Map | null; // pass mapRef.current down from the parent page
  onPolygonChange: (polygon: GeoJSON.Polygon | null) => void;
}

export default function DrawPolygon({ map, onPolygonChange }: DrawPolygonProps) {
  const drawRef = useRef<MapboxDraw | null>(null);

  useEffect(() => {
    if (!map) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    map.addControl(draw);
    drawRef.current = draw;

    const handleUpdate = () => {
      const data = draw.getAll();
      if (data.features.length > 0) {
        onPolygonChange(data.features[0].geometry as GeoJSON.Polygon);
      } else {
        onPolygonChange(null);
      }
    };

    map.on("draw.create", handleUpdate);
    map.on("draw.update", handleUpdate);
    map.on("draw.delete", handleUpdate);

    return () => {
      if (!map || !map.getStyle()) return;

      map.off("draw.create", handleUpdate);
      map.off("draw.update", handleUpdate);
      map.off("draw.delete", handleUpdate);
      map.removeControl(draw);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return null; // this component only wires up map controls, renders nothing itself
}
