"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ConflictAlert from "@/components/work-orders/ConflictAlert";
import { api } from "@/lib/api";
import type { WorkOrderResponse } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:     { label: "Pending",       cls: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  conflict:    { label: "⚠️ Conflict",   cls: "bg-red-500/20 text-red-300 border-red-500/40" },
  coordinating:{ label: "Coordinating", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  approved:    { label: "✓ Approved",   cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  completed:   { label: "Completed",    cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  rejected:    { label: "Rejected",     cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
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
        <div className="h-4 w-32 bg-slate-800 rounded" />
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="h-6 w-3/4 bg-slate-800 rounded" />
          <div className="h-4 w-1/2 bg-slate-800 rounded" />
          <div className="h-4 w-1/3 bg-slate-800 rounded" />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 h-32" />
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
          <Link href="/work-orders" className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-1 mb-6">
            ← Back to Work Orders
          </Link>
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-6 text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-sm font-semibold text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[order!.status] ?? STATUS_CONFIG.pending;

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
          className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
        >
          ← Back to Work Orders
        </Link>

        {/* Order detail card */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-700/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-100">{order!.title}</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Work Order #{order!.id}
                </p>
              </div>
              <span
                className={`flex-none text-xs font-bold px-3 py-1.5 rounded-full border ${status.cls}`}
              >
                {status.label}
              </span>
            </div>
          </div>

          <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-slate-700/50">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Department
              </p>
              <span className="text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full">
                {DEPT_LABELS[order!.requesting_dept_slug] ?? order!.requesting_dept_slug}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Start Date
              </p>
              <p className="text-sm text-slate-300">{formatDate(order!.start_date)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                End Date
              </p>
              <p className="text-sm text-slate-300">{formatDate(order!.end_date)}</p>
            </div>
          </div>

          <div className="px-6 py-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Created
            </p>
            <p className="text-sm text-slate-400">{formatDate(order!.created_at)}</p>
          </div>
        </div>

        {/* Conflicts section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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