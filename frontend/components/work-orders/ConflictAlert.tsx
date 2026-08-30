"use client";

import type { ConflictItem } from "@/lib/types";
import { SEVERITY_COLORS } from "@/lib/theme";

const SEVERITY_CONFIG = {
  red:    { icon: "🔴", label: "Hard Conflict",     color: SEVERITY_COLORS.red },
  yellow: { icon: "🟡", label: "Proximity Warning", color: SEVERITY_COLORS.yellow },
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
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-start gap-3">
        <div className="text-2xl mt-0.5">✏️</div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Draw a Work Area</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
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
      <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4 flex items-center gap-3">
        <div className="relative flex-none">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--accent)] animate-pulse">
            Scanning underground infrastructure layers...
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
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
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
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
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${SEVERITY_COLORS.red}20`,
                color: SEVERITY_COLORS.red,
                borderColor: `${SEVERITY_COLORS.red}66`,
              }}
            >
              {hardCount} Hard
            </span>
          )}
          {warnCount > 0 && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${SEVERITY_COLORS.yellow}20`,
                color: SEVERITY_COLORS.yellow,
                borderColor: `${SEVERITY_COLORS.yellow}66`,
              }}
            >
              {warnCount} Warning
            </span>
          )}
        </div>
      </div>

      {/* Conflict list */}
      <ul className="divide-y divide-[var(--border)]">
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
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex-none"
                    style={{
                      backgroundColor: `${sev.color}20`,
                      color: sev.color,
                      borderColor: `${sev.color}66`,
                    }}
                  >
                    {sev.icon} {sev.label}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-primary)] font-medium truncate">{c.name}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-muted)]">
                  <span className="capitalize">{c.layer}</span>
                  <span>·</span>
                  <span className="font-mono-data">{c.distance_meters}m away</span>
                  <span>·</span>
                  <span className="text-[var(--accent)] font-medium">
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
                      className="text-[10px] font-semibold text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)]/10 px-2 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
      <div className="px-4 py-2.5 border-t border-red-500/20 bg-[var(--bg-base)]/40">
        <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">
          Required Coordination
        </p>
        <div className="flex flex-wrap gap-1.5">
          {depts.map((d) => (
            <span
              key={d}
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(45, 212, 191, 0.12)",
                color: "var(--accent)",
                border: "1px solid rgba(45, 212, 191, 0.3)",
              }}
            >
              {DEPT_LABELS[d] ?? d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}