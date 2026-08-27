"use client";

import type { Layer } from "@/lib/types";

const LABELS: Record<Layer, string> = {
  road: "🛣️ Roads",
  water: "💧 Water Pipes",
  electric: "⚡ Electric Cables",
  telecom: "📡 Telecom",
};

interface LayerToggleProps {
  activeLayers: Layer[];
  onChange: (layers: Layer[]) => void;
}

export default function LayerToggle({ activeLayers, onChange }: LayerToggleProps) {
  const toggle = (layer: Layer) => {
    if (activeLayers.includes(layer)) {
      onChange(activeLayers.filter((l) => l !== layer));
    } else {
      onChange([...activeLayers, layer]);
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 space-y-2 z-10">
      {(Object.keys(LABELS) as Layer[]).map((layer) => (
        <label key={layer} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={activeLayers.includes(layer)}
            onChange={() => toggle(layer)}
          />
          {LABELS[layer]}
        </label>
      ))}
    </div>
  );
}
