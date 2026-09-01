"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { ConflictCheckResponse } from "@/lib/types";
import ConflictAlert from "./ConflictAlert";
import { ClipboardList, Send, TriangleAlert, Sparkles, CheckCircle2 } from "lucide-react";

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
  onAutoAudit?: (query: string) => void;
  onReset?: () => void;
}

export default function WorkOrderForm({
  polygon,
  conflictResults,
  isChecking,
  onAutoAudit,
  onReset,
}: WorkOrderFormProps) {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState(DEPTS[0].slug);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canSubmit = !!polygon && !!title.trim() && !!startDate && !!endDate && !submitting;

  const conflicts = conflictResults?.conflicts ?? [];
  const hasConflicts = conflicts.length > 0;

  const handleAutoAudit = () => {
    if (!onAutoAudit || !hasConflicts) return;
    const depts = Array.from(new Set(conflicts.map((c) => c.owner_dept_slug)));
    const deptList = depts.join(" and ");
    const query = `Work planned intersecting ${deptList}. Summarize mandatory pre-excavation notices, deposit requirements, and trench refilling rules.`;
    onAutoAudit(query);
  };

  const handleSubmit = async () => {
    if (!polygon || !title.trim() || !startDate || !endDate) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const order = await api.createWorkOrder({
        title: title.trim(),
        requesting_dept_slug: dept,
        polygon_geojson: polygon,
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T00:00:00Z`,
      });
      // Success — show toast and reset
      setSuccessMsg(`Work Order #${order.id} created successfully!`);
      setTitle("");
      setDept(DEPTS[0].slug);
      setStartDate("");
      setEndDate("");
      setSubmitting(false);
      // Reset polygon + conflicts from parent
      if (onReset) onReset();
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMsg(null), 5000);
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
          conflicts={conflicts}
          hasPolygon={!!polygon}
          checking={isChecking}
        />

        {/* Auto-Audit Compliance Button — only visible when conflicts exist */}
        {hasConflicts && onAutoAudit && (
          <button
            onClick={handleAutoAudit}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/25 hover:bg-violet-500/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Audit Compliance
          </button>
        )}
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
        {/* Success toast */}
        {successMsg && (
          <div className="flex items-center gap-2 neu p-3 border border-emerald-500/30 bg-emerald-500/5 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" />
            <p className="text-xs text-emerald-300 font-medium">{successMsg}</p>
          </div>
        )}

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
