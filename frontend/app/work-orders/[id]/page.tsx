"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ConflictAlert from "@/components/work-orders/ConflictAlert";
import { api } from "@/lib/api";
import { STATUS_COLORS } from "@/lib/theme";
import type { WorkOrderResponse, WorkOrderStatus } from "@/lib/types";
import { TriangleAlert, CheckCircle2 } from "lucide-react";

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending:      "Pending",
  conflict:     "Conflict",
  coordinating: "Coordinating",
  approved:     "Approved",
  completed:    "Completed",
  rejected:     "Rejected",
};

const STATUS_ICONS: Partial<Record<WorkOrderStatus, React.ElementType>> = {
  conflict: TriangleAlert,
  approved: CheckCircle2,
};

const DEPT_LABELS: Record<string, string> = {
  road: "Road Dept", water: "Water Dept", electric: "Electricity Dept",
  telecom: "Telecom", traffic: "Traffic Police", waste: "Waste Mgmt",
  municipal: "Municipal Corp", emergency: "Emergency Services",
};

function Skeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-[var(--surface)] rounded" />
        <div className="neu p-6 space-y-4">
          <div className="h-6 w-3/4 bg-[var(--border)] rounded" />
          <div className="h-4 w-1/2 bg-[var(--border)] rounded" />
          <div className="h-4 w-1/3 bg-[var(--border)] rounded" />
        </div>
        <div className="neu p-6 h-32" />
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [order, setOrder] = useState<WorkOrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<number | null>(null);

  const load = () => {
    if (!id) return;
    api
      .getWorkOrder(id)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load work order.")
      );
  };

  useEffect(load, [id]);

  if (!order && !error) return <Skeleton />;

  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Link href="/work-orders" className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 mb-6 transition-colors">
            ← Back to Work Orders
          </Link>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/8 p-6 text-center">
            <TriangleAlert className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="text-sm font-semibold text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order!.status] ?? STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[order!.status] ?? order!.status;
  const StatusIcon = STATUS_ICONS[order!.status];

  const handleAcknowledge = async (conflictLogId: number, deptSlug: string) => {
    setAcknowledging(conflictLogId);
    try {
      await api.acknowledgeConflict(conflictLogId, deptSlug);
      load();
    } catch (err) {
      console.error("Acknowledge failed:", err);
    } finally {
      setAcknowledging(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Back link */}
        <Link
          href="/work-orders"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
        >
          ← Back to Work Orders
        </Link>

        {/* Order detail card */}
        <div className="neu !rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[var(--border)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{order!.title}</h1>
                <p className="text-sm text-[var(--text-muted)] mt-1 font-mono-data">
                  Work Order #{order!.id}
                </p>
              </div>
              <span
                className="flex-none flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ color: statusColor }}
              >
                {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-[var(--border)]">
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Department
              </p>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-[var(--accent)] neu-pill">
                {DEPT_LABELS[order!.requesting_dept_slug] ?? order!.requesting_dept_slug}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                Start Date
              </p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(order!.start_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                End Date
              </p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(order!.end_date)}</p>
            </div>
          </div>

          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Created
            </p>
            <p className="text-sm text-[var(--text-muted)]">{formatDate(order!.created_at)}</p>
          </div>
        </div>

        {/* Conflicts section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Infrastructure Conflicts ({order!.conflicts.length})
          </p>
          <ConflictAlert
            conflicts={order!.conflicts}
            onAcknowledge={handleAcknowledge}
            acknowledging={acknowledging}
            hasPolygon={true}
            checking={false}
          />
        </div>
      </div>
    </div>
  );
}