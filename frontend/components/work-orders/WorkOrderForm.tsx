"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { ConflictCheckResponse } from "@/lib/types";
import ConflictAlert from "./ConflictAlert";
import { ClipboardList, Send, TriangleAlert } from "lucide-react";

const DEPTS = [
  { slug: "road", label: "Road" },
  { slug: "water", label: "Water" },
  { slug: "electric", label: "Electric" },
  { slug: "telecom", label: "Telecom" },
  { slug: "traffic", label: "Traffic" },
  { slug: "waste", label: "Waste" },
  { slug: "municipal", label: "Municipal" },
  { slug: "emergency", label: "Emergency" },
];

interface WorkOrderFormProps {
  polygon: GeoJSON.Polygon | null;
  conflictResults?: ConflictCheckResponse;
  isChecking: boolean;
}

export default function WorkOrderForm({ polygon, conflictResults, isChecking }: WorkOrderFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState(DEPTS[0].slug);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!polygon && !!title.trim() && !!startDate && !!endDate && !submitting;

  const handleSubmit = async () => {
    if (!polygon || !title.trim() || !startDate || !endDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await api.createWorkOrder({
        title: title.trim(),
        requesting_dept_slug: dept,
        polygon_geojson: polygon,
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T00:00:00Z`,
      });
      router.push(`/work-orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit work order.");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[var(--accent)]" />
          New Work Request
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Draw the excavation zone on the map — conflicts are detected instantly as you draw.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Live Conflict Detection
        </p>
        <ConflictAlert
          conflicts={conflictResults?.conflicts ?? []}
          hasPolygon={!!polygon}
          checking={isChecking}
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Work Order Details
        </p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)]">WORK ORDER TITLE</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water Main Repair — FC Road Sector 4"
            className="w-full neu-pressed p-2.5 text-sm text-[var(--text-primary)] outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[var(--text-muted)]">REQUESTING DEPARTMENT</label>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="w-full neu-pressed p-2.5 text-sm text-[var(--text-primary)] outline-none"
          >
            {DEPTS.map((d) => (
              <option key={d.slug} value={d.slug} className="bg-[var(--surface)]">
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">START DATE</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full neu-pressed p-2.5 text-sm text-[var(--text-primary)] outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">END DATE</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full neu-pressed p-2.5 text-sm text-[var(--text-primary)] outline-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border)] space-y-4">
        {!polygon && (
          <div className="flex items-start gap-2 neu p-3">
            <TriangleAlert className="w-4 h-4 mt-0.5 text-orange-400 flex-none" />
            <p className="text-xs text-orange-300">
              Draw the work area on the map before submitting. The submit button will unlock once a polygon is placed.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 neu p-3">
            <TriangleAlert className="w-4 h-4 mt-0.5 text-red-400 flex-none" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 neu-button text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-semibold"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${
              canSubmit ? "neu-accent" : "neu-pressed text-[var(--text-muted)] cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            {submitting ? "Submitting..." : "Submit Work Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
