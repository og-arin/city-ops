"use client";

import type { Layer } from "@/lib/types";
import { LAYER_COLORS } from "@/lib/theme";

const LAYER_META: Record<Layer, { label: string; icon: string }> = {
  ward:     { label: "Administrative Wards", icon: "🏢" },
  road:     { label: "Roads",       icon: "🛣️" },
  drainage: { label: "Drainage",    icon: "🌊" },
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
    <div className="absolute top-4 right-4 z-10 surface rounded-xl p-3 space-y-1 shadow-2xl shadow-black/40 min-w-[160px]">
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-1 pb-1 border-b border-[var(--border)] mb-2">
        Infrastructure Layers
      </p>
      {(Object.keys(LAYER_META) as Layer[]).map((layer) => {
        const { label, icon } = LAYER_META[layer];
        const color = LAYER_COLORS[layer];
        const active = activeLayers.includes(layer);

        return (
          <button
            key={layer}
            onClick={() => toggle(layer)}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
              active
                ? "bg-white/8 text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
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
                active ? "bg-[var(--accent)]" : "bg-[var(--border)]"
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
