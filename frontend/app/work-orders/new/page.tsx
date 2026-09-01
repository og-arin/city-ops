"use client";

import { useState } from "react";
import Link from "next/link";
import type mapboxgl from "mapbox-gl";
import MapView from "@/components/map/MapView";
import DrawPolygon from "@/components/map/DrawPolygon";
import type { ConflictCheckResponse } from "@/lib/types";

export default function NewWorkOrderPage() {
  // --- STATE ---
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [polygon, setPolygon] = useState<GeoJSON.Polygon | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [conflictResults, setConflictResults] = useState<ConflictCheckResponse | undefined>();

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden">
      
      {/* LEFT SIDE: The Map */}
      <div className="w-2/3 h-full relative border-r border-[var(--border)] p-4">
        {/* We pass setMapInstance so MapView gives us the map once it loads */}
        <MapView onMapReady={setMapInstance}>
          {/* ONLY render the drawing tools once the map actually exists */}
          {mapInstance && (
            <DrawPolygon
              map={mapInstance}
              onPolygonChange={(drawnShape) => setPolygon(drawnShape)}
              onConflictCheck={(loading, results) => {
                setIsChecking(loading);
                if (results) setConflictResults(results);
              }}
            />
          )}
        </MapView>
      </div>

      {/* RIGHT SIDE: The Form */}
      <div className="w-1/3 h-full overflow-y-auto p-6 space-y-8 bg-[var(--bg-base)]">
        
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            📋 New Work Request
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Draw the excavation zone on the map — conflicts are detected instantly as you draw.
          </p>
        </div>

        {/* Conflict Detection Status */}
        <div className="surface p-4 rounded-xl border border-[var(--border)] space-y-2">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Live Conflict Detection
          </p>
          {!polygon ? (
            <div className="flex gap-3">
              <span className="text-2xl">✏️</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Draw a Work Area</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Use the polygon tool on the map to define the excavation zone.</p>
              </div>
            </div>
          ) : isChecking ? (
            <p className="text-sm text-[var(--accent)] animate-pulse">Checking for underground conflicts...</p>
          ) : conflictResults?.has_conflict ? (
            <p className="text-sm text-red-400 font-semibold">⚠️ Conflict Detected! Intersects with {conflictResults.conflicts.length} assets.</p>
          ) : (
            <p className="text-sm text-green-400 font-semibold">✅ Path Clear. No conflicts detected.</p>
          )}
        </div>

        {/* The Form Fields */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Work Order Details
          </p>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">WORK ORDER TITLE</label>
            <input type="text" placeholder="e.g. Water Main Repair — FC Road Sector 4" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">REQUESTING DEPARTMENT</label>
            <select className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">
              <option>🛣️ Road Department</option>
              <option>🌊 Drainage Department</option>
              <option>🏢 Municipal Corporation</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-muted)]">START DATE</label>
              <input type="date" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--text-muted)]">END DATE</label>
              <input type="date" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="pt-4 border-t border-[var(--border)] space-y-4">
          {!polygon && (
            <p className="text-xs text-orange-400 bg-orange-400/10 p-3 rounded-lg border border-orange-400/20">
              ✏️ Draw the work area on the map before submitting. The submit button will unlock once a polygon is placed.
            </p>
          )}
          
          <div className="flex gap-3">
            <Link href="/dashboard" className="px-6 py-2.5 rounded-lg surface text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-semibold transition-colors">
              Cancel
            </Link>
            <button 
              disabled={!polygon}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                polygon 
                  ? "bg-[var(--accent)] text-white hover:brightness-110 shadow-lg shadow-[var(--accent)]/20" 
                  : "bg-[var(--surface)] text-[var(--text-muted)] cursor-not-allowed"
              }`}
            >
              🚀 Submit Work Order
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}