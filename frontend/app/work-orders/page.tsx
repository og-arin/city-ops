"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { WorkOrderResponse } from "@/lib/types";

const STATUS_CONFIG: Record<
  string,
  { label: string; cls: string }
> = {
  pending:     { label: "Pending",      cls: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  conflict:    { label: "Conflict",     cls: "bg-red-500/20 text-red-300 border-red-500/40" },
  coordinating:{ label: "Coordinating",cls: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  approved:    { label: "Approved",     cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  completed:   { label: "Completed",   cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  rejected:    { label: "Rejected",    cls: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
};

const DEPT_LABELS: Record<string, string> = {
  road: "Road", water: "Water", electric: "Electric",
  telecom: "Telecom", traffic: "Traffic", waste: "Waste",
  municipal: "Municipal", emergency: "Emergency",
};

const ALL_DEPTS = ["all", "road", "water", "electric", "telecom", "traffic", "waste", "municipal", "emergency"];

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-800/60">
      {[1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-slate-800 rounded animate-pulse" />
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
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Work Orders</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              All infrastructure work requests across departments
            </p>
          </div>
          <Link
            href="/work-orders/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition-all"
          >
            <span>+</span> New Request
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex-none">
            Filter by dept:
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-800/60 border border-slate-700/60 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {ALL_DEPTS.map((d) => (
              <option key={d} value={d} className="bg-slate-800">
                {d === "all" ? "All Departments" : DEPT_LABELS[d] ?? d}
              </option>
            ))}
          </select>
          {!loading && !error && (
            <span className="text-xs text-slate-500">
              {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-5 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-400">Could not load work orders</p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  api.listWorkOrders()
                    .then(setOrders)
                    .catch((err) => setError(err instanceof Error ? err.message : "Failed"))
                    .finally(() => setLoading(false));
                }}
                className="mt-2 text-xs text-indigo-400 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {!error && (
          <div className="rounded-xl border border-slate-700/60 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700/60">
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Work Order
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                    Department
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Date Range
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading && [1, 2, 3].map((i) => <SkeletonRow key={i} />)}

                {!loading &&
                  filtered.map((o) => {
                    const status = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.pending;
                    return (
                      <tr
                        key={o.id}
                        onClick={() => router.push(`/work-orders/${o.id}`)}
                        className="cursor-pointer hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {o.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            #{o.id}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full">
                            {DEPT_LABELS[o.requesting_dept_slug] ?? o.requesting_dept_slug}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="text-xs text-slate-400">
                            {formatDate(o.start_date)} → {formatDate(o.end_date)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* Empty state */}
            {!loading && !error && filtered.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-base font-semibold text-slate-300">
                  {deptFilter === "all" ? "No work orders yet" : `No orders for ${DEPT_LABELS[deptFilter] ?? deptFilter}`}
                </h3>
                <p className="text-sm text-slate-500 mt-1 mb-5">
                  {deptFilter === "all"
                    ? "Create the first work order to start coordinating infrastructure work."
                    : "Try changing the department filter, or create a new request."}
                </p>
                <Link
                  href="/work-orders/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  + Create Work Order
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
