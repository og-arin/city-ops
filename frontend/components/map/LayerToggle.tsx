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
    <div className="absolute top-4 right-4 z-10 surface p-4 space-y-2 min-w-[200px]">
      <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-1 pb-1.5 border-b border-[var(--border)] mb-3">
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
              className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-1.5 text-sm font-medium transition-colors duration-200 cursor-pointer hover:bg-[var(--surface-hover)] ${
                active
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {/* Color swatch */}
              <span
                className="h-2.5 w-2.5 rounded-full flex-none transition-all duration-300"
                style={{
                  backgroundColor: active ? color : "transparent",
                  border: `1.5px solid ${active ? color : "var(--border-strong)"}`,
                  boxShadow: active ? `0 0 8px ${color}` : "none",
                }}
              />
              <Icon className={`w-4 h-4 flex-none ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`} />
              <span className="flex-1 text-left">{label}</span>
              {/* Toggle pill */}
              <span
                className="w-9 h-5 p-0.5 relative rounded-full inline-flex items-center flex-none transition-all duration-200"
                style={{
                  backgroundColor: active ? color : 'var(--border-strong)',
                  boxShadow: active ? `0 0 10px ${color}A0` : 'none',
                }}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-[var(--bg-base)] shadow-sm transition-transform duration-200 ${
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
