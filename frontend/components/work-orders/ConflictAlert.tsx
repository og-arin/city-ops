import type { ConflictItem } from "@/lib/types";

const SEVERITY_ICON = { red: "🔴", yellow: "🟡" } as const;

interface ConflictAlertProps {
  conflicts: ConflictItem[];
  onAcknowledge?: (assetId: number) => void; // hook up to acknowledge-conflict endpoint
}

export default function ConflictAlert({ conflicts, onAcknowledge }: ConflictAlertProps) {
  if (conflicts.length === 0) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
        ✅ No conflicts detected — clear to proceed.
      </div>
    );
  }

  const depts = Array.from(new Set(conflicts.map((c) => c.owner_dept_slug)));

  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
      <p className="font-semibold text-red-900">⚠️ Conflicts Detected</p>

      <ul className="space-y-1">
        {conflicts.map((c) => (
          <li key={c.asset_id} className="flex items-center justify-between text-sm">
            <span>
              {SEVERITY_ICON[c.severity]} {c.name} ({c.layer}) — {c.distance_meters}m away
            </span>
            {onAcknowledge && (
              <button
                onClick={() => onAcknowledge(c.asset_id)}
                className="text-xs underline text-red-700"
              >
                Acknowledge
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="pt-2 border-t border-red-200 text-sm text-red-900">
        <p className="font-medium">Recommended coordination:</p>
        <p>{depts.map((d) => d[0].toUpperCase() + d.slice(1)).join(", ")}</p>
      </div>
    </div>
  );
}
