"use client";

import type { Layer } from "@/lib/types";

const LAYER_META: Record<Layer, { label: string; icon: string; color: string }> = {
  road:     { label: "Roads",          icon: "🛣️",  color: "#64748b" },
  water:    { label: "Water Pipes",    icon: "💧",  color: "#0284c7" },
  electric: { label: "Electric",       icon: "⚡",  color: "#f59e0b" },
  telecom:  { label: "Telecom",        icon: "📡",  color: "#9333ea" },
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
    <div className="absolute top-4 right-4 z-10 glass rounded-xl p-3 space-y-1 shadow-2xl shadow-black/40 min-w-[160px]">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1 pb-1 border-b border-slate-700/60 mb-2">
        Infrastructure Layers
      </p>
      {(Object.keys(LAYER_META) as Layer[]).map((layer) => {
        const { label, icon, color } = LAYER_META[layer];
        const active = activeLayers.includes(layer);

        return (
          <button
            key={layer}
            onClick={() => toggle(layer)}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              active
                ? "bg-white/8 text-slate-100"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            }`}
          >
            {/* Color swatch */}
            <span
              className="w-3 h-3 rounded-sm flex-none transition-opacity"
              style={{
                background: active ? color : "transparent",
                border: `2px solid ${color}`,
                opacity: active ? 1 : 0.4,
              }}
            />
            <span>{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            {/* Toggle pill */}
            <span
              className={`w-7 h-3.5 rounded-full flex-none transition-colors duration-200 relative ${
                active ? "bg-indigo-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform duration-200 ${
                  active ? "translate-x-[14px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
