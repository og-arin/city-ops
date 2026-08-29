"use client";

import type { ConflictItem } from "@/lib/types";

const SEVERITY_CONFIG = {
  red:    { icon: "🔴", label: "Hard Conflict",       bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400",    badge: "bg-red-500/20 text-red-300 border-red-500/40" },
  yellow: { icon: "🟡", label: "Proximity Warning",   bg: "bg-amber-500/10",  border: "border-amber-500/30",  text: "text-amber-400",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
} as const;

const DEPT_LABELS: Record<string, string> = {
  road: "Road Dept", water: "Water Dept", electric: "Electricity Dept",
  telecom: "Telecom", traffic: "Traffic Police", waste: "Waste Mgmt",
  municipal: "Municipal Corp", emergency: "Emergency",
};

interface ConflictAlertProps {
  conflicts: ConflictItem[];
  onAcknowledge?: (conflictLogId: number, deptSlug: string) => void;
  acknowledging?: number | null;
  /** New props for the live-check flow in /work-orders/new */
  hasPolygon?: boolean;
  checking?: boolean;
}

export default function ConflictAlert({
  conflicts,
  onAcknowledge,
  acknowledging,
  hasPolygon = true,
  checking = false,
}: ConflictAlertProps) {
  // --- IDLE: no polygon drawn yet ---
  if (!hasPolygon && !checking) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 flex items-start gap-3">
        <div className="text-2xl mt-0.5">✏️</div>
        <div>
          <p className="text-sm font-semibold text-slate-300">Draw a Work Area</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Use the polygon tool on the map to define the excavation zone. Conflict
            detection runs instantly as you draw.
          </p>
        </div>
      </div>
    );
  }

  // --- SCANNING: polygon drawn, API call in-flight ---
  if (checking) {
    return (
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 flex items-center gap-3">
        <div className="relative flex-none">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-300 animate-pulse">
            Scanning underground infrastructure layers...
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Checking roads · water pipes · electric cables · telecom ducts
          </p>
        </div>
      </div>
    );
  }

  // --- CLEAR: polygon checked, no conflicts ---
  if (conflicts.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-lg flex-none">
          ✅
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-400">Zone Clear for Excavation</p>
          <p className="text-xs text-slate-500 mt-0.5">
            No infrastructure conflicts detected in this zone.
          </p>
        </div>
      </div>
    );
  }

  // --- CONFLICTS DETECTED ---
  const depts = Array.from(new Set(conflicts.map((c) => c.owner_dept_slug)));
  const hardCount = conflicts.filter((c) => c.severity === "red").length;
  const warnCount = conflicts.filter((c) => c.severity === "yellow").length;

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-red-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <span className="text-sm font-semibold text-red-400">
            Conflicts Detected
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {hardCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
              {hardCount} Hard
            </span>
          )}
          {warnCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {warnCount} Warning
            </span>
          )}
        </div>
      </div>

      {/* Conflict list */}
      <ul className="divide-y divide-slate-700/40">
        {conflicts.map((c) => {
          const sev = SEVERITY_CONFIG[c.severity];
          return (
            <li
              key={c.conflict_log_id ?? c.asset_id}
              className="px-4 py-3 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.badge} flex-none`}
                  >
                    {sev.icon} {sev.label}
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-medium truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span className="capitalize">{c.layer}</span>
                  <span>·</span>
                  <span>{c.distance_meters}m away</span>
                  <span>·</span>
                  <span className="text-sky-400 font-medium">
                    {DEPT_LABELS[c.owner_dept_slug] ?? c.owner_dept_slug}
                  </span>
                </div>
              </div>

              {onAcknowledge && c.conflict_log_id != null && (
                <div className="flex-none">
                  {c.acknowledged ? (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-full">
                      ✓ Acked
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        onAcknowledge(c.conflict_log_id!, c.owner_dept_slug)
                      }
                      disabled={acknowledging === c.conflict_log_id}
                      className="text-[10px] font-semibold text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/10 px-2 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {acknowledging === c.conflict_log_id
                        ? "Acking..."
                        : "Acknowledge"}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Required coordination footer */}
      <div className="px-4 py-2.5 border-t border-red-500/20 bg-slate-900/40">
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mb-1">
          Required Coordination
        </p>
        <div className="flex flex-wrap gap-1.5">
          {depts.map((d) => (
            <span
              key={d}
              className="text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-full"
            >
              {DEPT_LABELS[d] ?? d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}