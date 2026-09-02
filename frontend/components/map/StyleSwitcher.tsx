"use client";

import { useState } from "react";
import { Layers } from "lucide-react";

export interface BaseStyle {
  id: string;
  label: string;
}

export const BASE_STYLES: BaseStyle[] = [
  { id: "streets-v12", label: "Streets" },
  { id: "dark-v11", label: "Dark" },
  { id: "satellite-streets-v12", label: "Satellite" },
];

interface StyleSwitcherProps {
  activeStyle: string;
  onChange: (styleId: string) => void;
  center: [number, number];
  token: string;
}

function thumbUrl(styleId: string, center: [number, number], token: string) {
  return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${center[0]},${center[1]},10,0/80x80@2x?access_token=${token}`;
}

// Google Maps-style layer picker: a collapsed thumbnail of the current base
// style that expands into a strip of alternatives on click.
export default function StyleSwitcher({ activeStyle, onChange, center, token }: StyleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const current = BASE_STYLES.find((s) => s.id === activeStyle) ?? BASE_STYLES[0];

  return (
    <div className="absolute bottom-4 left-4 z-10">
      {open && (
        <div className="mb-2 flex gap-2 surface p-2">
          {BASE_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onChange(s.id);
                setOpen(false);
              }}
              className="relative flex-none rounded-lg overflow-hidden w-16 h-16 group"
              style={{
                outline: s.id === activeStyle ? "2px solid var(--accent)" : "2px solid transparent",
                outlineOffset: 1,
              }}
            >
              <img src={thumbUrl(s.id, center, token)} alt={s.label} className="w-full h-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-semibold text-center py-0.5 leading-none">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg overflow-hidden w-14 h-14 shadow-lg border border-[var(--border-strong)]"
        title="Change base map"
      >
        <img src={thumbUrl(current.id, center, token)} alt={current.label} className="w-full h-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] font-semibold text-center py-0.5 leading-none flex items-center justify-center gap-0.5">
          <Layers className="w-2.5 h-2.5" />
          {current.label}
        </span>
      </button>
    </div>
  );
}
