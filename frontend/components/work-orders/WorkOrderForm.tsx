"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { WorkOrderResponse } from "@/lib/types";

const DEPARTMENTS = [
  { slug: "road", name: "Road Department" },
  { slug: "water", name: "Water Department" },
  { slug: "electric", name: "Electricity Department" },
  { slug: "telecom", name: "Telecom" },
  { slug: "traffic", name: "Traffic Police" },
  { slug: "waste", name: "Waste Management" },
];

interface WorkOrderFormProps {
  polygon: GeoJSON.Polygon | null; // comes from DrawPolygon via parent page
  onSubmitted: (result: WorkOrderResponse) => void;
}

export default function WorkOrderForm({ polygon, onSubmitted }: WorkOrderFormProps) {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState(DEPARTMENTS[0].slug);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          className="w-full border rounded-md px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Repair Road X - Sector 12"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Requesting Department</label>
        <select
          className="w-full border rounded-md px-3 py-2"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.slug} value={d.slug}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            className="w-full border rounded-md px-3 py-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            className="w-full border rounded-md px-3 py-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      {!polygon && (
        <p className="text-sm text-amber-600">
          ⚠️ Draw the work area on the map above before submitting.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !polygon}
        className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-50"
      >
        {submitting ? "Checking for conflicts..." : "Submit Work Order"}
      </button>
    </form>
  );
}
