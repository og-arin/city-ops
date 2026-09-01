"use client";

import type { Layer } from "@/lib/types";
import { LAYER_COLORS } from "@/lib/theme";
import { Building2, Route, Droplets } from "lucide-react";

const LAYER_META: Record<Layer, { label: string; Icon: React.ElementType }> = {
  ward:     { label: "Administrative Wards", Icon: Building2 },
  road:     { label: "Roads",       Icon: Route },
  drainage: { label: "Drainage",    Icon: Droplets },
};

interface LayerToggleProps {
  activeLayers: Layer[];
  onChange: (layers: Layer[]) => void;
}

export default function LayerToggle({ activeLayers, onChange }: LayerToggleProps) {
  const toggle = (layer: Layer) => {
    onChange(
      activeLayers.includes(layer)
        ? activeLayers.filter((l) => l !== layer)
        : [...activeLayers, layer]
    );
  };

  return (
    <div className="absolute top-4 right-4 z-10 bg-slate-900/75 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-slate-950/80 rounded-2xl p-4 space-y-2 min-w-[200px]">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1.5 border-b border-slate-800/50 mb-3">
        Infrastructure Layers
      </p>
      <div className="space-y-1">
        {(Object.keys(LAYER_META) as Layer[]).map((layer) => {
          const { label, Icon } = LAYER_META[layer];
          const color = LAYER_COLORS[layer];
          const active = activeLayers.includes(layer);

          return (
            <button
              key={layer}
              onClick={() => toggle(layer)}
              className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                active
                  ? "text-slate-200"
                  : "text-slate-400 hover:text-slate-300"
              } hover:bg-slate-800/40`}
            >
              {/* Color swatch */}
              <span
                className="h-2.5 w-2.5 rounded-full flex-none transition-all duration-300"
                style={{
                  backgroundColor: active ? color : "transparent",
                  border: `1.5px solid ${active ? color : "rgba(148, 163, 184, 0.3)"}`,
                  boxShadow: active ? `0 0 8px ${color}` : "none",
                }}
              />
              <Icon className={`w-4 h-4 flex-none ${active ? "text-slate-200" : "text-slate-500"}`} />
              <span className="flex-1 text-left">{label}</span>
              {/* Toggle pill */}
              <span
                className="w-9 h-5 p-0.5 relative rounded-full inline-flex items-center flex-none transition-all duration-200"
                style={{
                  backgroundColor: active ? color : 'rgba(30, 41, 59, 0.8)',
                  boxShadow: active ? `0 0 10px ${color}A0` : 'inset 1px 1px 3px rgba(0,0,0,0.4)',
                }}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-slate-950 shadow-sm transition-transform duration-200 ${
                    active ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
