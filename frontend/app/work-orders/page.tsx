"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { STATUS_COLORS } from "@/lib/theme";
import type { WorkOrderResponse, WorkOrderStatus } from "@/lib/types";
import { Plus, TriangleAlert, ClipboardList } from "lucide-react";

const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  pending:      "Pending",
  conflict:     "Conflict",
  coordinating: "Coordinating",
  approved:     "Approved",
  completed:    "Completed",
  rejected:     "Rejected",
};

const DEPT_LABELS: Record<string, string> = {
  road: "Road", water: "Water", electric: "Electric",
  telecom: "Telecom", traffic: "Traffic", waste: "Waste",
  municipal: "Municipal", emergency: "Emergency",
};

const ALL_DEPTS = ["all", "road", "water", "electric", "telecom", "traffic", "waste", "municipal", "emergency"];

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}66`,
      }}
    >
      {label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border)]">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-[var(--surface)] rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function WorkOrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<WorkOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState("all");

  useEffect(() => {
    api
      .listWorkOrders()
      .then(setOrders)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load work orders.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    deptFilter === "all"
      ? orders
      : orders.filter((o) => o.requesting_dept_slug === deptFilter);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Work Orders</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              All infrastructure work requests across departments
            </p>
          </div>
          <Link
            href="/work-orders/new"
            className="flex items-center gap-2 px-4 py-2 btn-primary text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> New Request
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider flex-none">
            Filter by dept:
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="surface-sunken text-[var(--text-primary)] text-sm px-3 py-1.5 outline-none"
          >
            {ALL_DEPTS.map((d) => (
              <option key={d} value={d} className="bg-[var(--surface)]">
                {d === "all" ? "All Departments" : DEPT_LABELS[d] ?? d}
              </option>
            ))}
          </select>
          {!loading && !error && (
            <span className="text-xs text-[var(--text-muted)]">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-5 flex items-start gap-3">
            <TriangleAlert className="w-6 h-6 text-red-400 flex-none" />
            <div>
              <p className="text-sm font-semibold text-red-400">Could not load work orders</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  api.listWorkOrders()
                    .then(setOrders)
                    .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
                    .finally(() => setLoading(false));
                }}
                className="mt-2 text-xs text-[var(--accent)] underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {!error && (
          <div className="surface overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Work Order
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">
                    Department
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">
                    Date Range
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading && [1, 2, 3].map((i) => <SkeletonRow key={i} />)}

                {!loading &&
                  filtered.map((o) => {
                    return (
                      <tr
                        key={o.id}
                        onClick={() => router.push(`/work-orders/${o.id}`)}
                        className="cursor-pointer hover:bg-[var(--surface-hover)] transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {o.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono-data">
                            #{o.id}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-[var(--accent)] pill">
                            {DEPT_LABELS[o.requesting_dept_slug] ?? o.requesting_dept_slug}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatDate(o.start_date)} → {formatDate(o.end_date)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-2 items-start">
                            <StatusBadge status={o.status} />
                            {o.co_dig_opportunities && o.co_dig_opportunities.length > 0 && (
                              <div className="flex flex-col gap-1">
                                {o.co_dig_opportunities.map((opp, idx) => (
                                  <span 
                                    key={idx} 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20 whitespace-nowrap cursor-help flex items-center gap-1"
                                    title={`Coordinate trenching with ${DEPT_LABELS[opp.department] ?? opp.department} to prevent duplicate excavation.`}
                                  >
                                    <span>🤝</span> Co-Dig Match
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-16 px-6">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  {deptFilter === "all" ? "No work orders yet" : `No orders for ${DEPT_LABELS[deptFilter] ?? deptFilter}`}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">
                  {deptFilter === "all"
                    ? "Create the first work order to start coordinating infrastructure work."
                    : "Try changing the department filter, or create a new request."}
                </p>
                <Link
                  href="/work-orders/new"
                  className="inline-flex items-center gap-2 px-4 py-2 btn-primary text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" /> Create Work Order
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
