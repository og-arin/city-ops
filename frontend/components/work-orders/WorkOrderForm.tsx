"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { WorkOrderResponse } from "@/lib/types";

const DEPARTMENTS = [
  { slug: "road",      name: "🛣️  Road Department" },
  { slug: "water",     name: "💧  Water Department" },
  { slug: "electric",  name: "⚡  Electricity Department" },
  { slug: "telecom",   name: "📡  Telecom" },
  { slug: "traffic",   name: "🚦  Traffic Police" },
  { slug: "waste",     name: "♻️  Waste Management" },
  { slug: "municipal", name: "🏛️  Municipal Corporation" },
  { slug: "emergency", name: "🚨  Emergency Services" },
];

interface WorkOrderFormProps {
  polygon: GeoJSON.Polygon | null;
  onSubmitted: (result: WorkOrderResponse) => void;
}

const inputCls =
  "w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/60 transition-all";

const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";

export default function WorkOrderForm({ polygon, onSubmitted }: WorkOrderFormProps) {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState(DEPARTMENTS[0].slug);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!polygon && !!title && !!startDate && !!endDate && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!polygon) {
      setError("Draw the work area on the map first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.createWorkOrder({
        title,
        requesting_dept_slug: dept,
        polygon_geojson: polygon,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      });
      onSubmitted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className={labelCls}>Work Order Title</label>
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Water Main Repair — FC Road Sector 4"
          required
        />
      </div>

      {/* Department */}
      <div>
        <label className={labelCls}>Requesting Department</label>
        <select
          className={inputCls}
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.slug} value={d.slug} className="bg-slate-800">
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start Date</label>
          <input
            type="date"
            className={inputCls}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelCls}>End Date</label>
          <input
            type="date"
            className={inputCls}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Polygon required hint */}
      {!polygon && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5">
          <span className="text-base mt-0.5">✏️</span>
          <p className="text-xs text-amber-300 leading-relaxed">
            Draw the work area on the map before submitting. The submit button
            will unlock once a polygon is placed.
          </p>
        </div>
      )}

      {/* API error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/8 px-3 py-2.5">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          canSubmit
            ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/40 active:scale-[0.98]"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        }`}
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Submitting Work Order...
          </>
        ) : (
          <>
            <span>🚀</span>
            Submit Work Order
          </>
        )}
      </button>
    </form>
  );
}
