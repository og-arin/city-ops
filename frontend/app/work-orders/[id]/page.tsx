"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ConflictAlert from "@/components/work-orders/ConflictAlert";
import { api } from "@/lib/api";
import { STATUS_COLORS } from "@/lib/theme";
import type { WorkOrderResponse, WorkOrderStatus, CoDigOpportunity } from "@/lib/types";
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
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 animate-pulse">
        <div className="h-4 w-32 bg-[var(--surface)] rounded" />
        <div className="surface p-6 space-y-4">
          <div className="h-6 w-3/4 bg-[var(--border)] rounded" />
          <div className="h-4 w-1/2 bg-[var(--border)] rounded" />
          <div className="h-4 w-1/3 bg-[var(--border)] rounded" />
        </div>
        <div className="surface p-6 h-32" />
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

  const [proposalTarget, setProposalTarget] = useState<CoDigOpportunity | null>(null);
  const [propStart, setPropStart] = useState("");
  const [propEnd, setPropEnd] = useState("");
  const [proposing, setProposing] = useState(false);

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
        <div className="max-w-2xl mx-auto px-6 py-6">
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

  const handlePropose = async () => {
    if (!proposalTarget || !propStart || !propEnd) return;
    setProposing(true);
    try {
      await api.proposeJointTrenching(id, {
        target_work_order_id: proposalTarget.work_order_id,
        proposed_start_date: `${propStart}T00:00:00Z`,
        proposed_end_date: `${propEnd}T00:00:00Z`,
      });
      setProposalTarget(null);
      load(); // Reload to get updated status
    } catch (err) {
      console.error(err);
      alert("Failed to send proposal.");
    } finally {
      setProposing(false);
    }
  };

  const handleRespond = async (action: "accept" | "reject") => {
    try {
      await api.respondJointTrenching(id, { action });
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to respond to proposal.");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {/* Back link */}
        <Link
          href="/work-orders"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
        >
          ← Back to Work Orders
        </Link>

        {/* Order detail card */}
        <div className="surface overflow-hidden">
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
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-[var(--accent)] pill">
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

        {/* Coordination Opportunities */}
        {order!.co_dig_opportunities && order!.co_dig_opportunities.length > 0 && (
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">🤝</span> Coordination Opportunities (Dig Once)
            </h2>
            <div className="flex flex-col gap-3">
              {order!.co_dig_opportunities.map((opp, idx) => (
                <div key={idx} className="surface p-4 flex items-center justify-between gap-4 border border-blue-500/20 bg-blue-500/5 rounded-xl">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                      {DEPT_LABELS[opp.department] ?? opp.department}
                    </span>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-1.5">{opp.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Work Order #{opp.work_order_id}</p>
                  </div>
                  {order!.joint_trench_status === 'accepted' ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1.5">
                        ✅ Joint Trenching Approved
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono-data">
                        {formatDate(order!.start_date)} - {formatDate(order!.end_date)}
                      </span>
                    </div>
                  ) : order!.joint_trench_status === 'proposed' ? (
                    order!.id === order!.initiator_work_order_id ? (
                      <button 
                        disabled
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-not-allowed flex-none"
                      >
                        Proposal Sent (Pending)
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] text-[var(--text-muted)] font-mono-data">
                          Proposed Dates: {formatDate(order!.proposed_joint_start_date!)} - {formatDate(order!.proposed_joint_end_date!)}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRespond("accept")}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors"
                          >
                            Accept Proposal
                          </button>
                          <button 
                            onClick={() => handleRespond("reject")}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] hover:border-red-500/50 hover:text-red-400 text-[var(--text-muted)] transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <button 
                      onClick={() => setProposalTarget(opp)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex-none"
                    >
                      Initiate Joint Trenching
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts section */}
        <div className="space-y-2 pt-2">
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

        {/* Proposal Modal */}
        {proposalTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="surface border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Propose Joint Trenching
                </h3>
                <button onClick={() => setProposalTarget(null)} className="text-[var(--text-muted)] hover:text-white">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Coordinate with the <strong className="text-[var(--text-primary)]">{DEPT_LABELS[proposalTarget.department] ?? proposalTarget.department}</strong> to unify excavation timelines.
                </p>
                
                <div className="surface-sunken p-3 rounded-xl border border-[var(--border)] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Your Current Dates:</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(order!.start_date)} - {formatDate(order!.end_date)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Their Current Dates:</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(proposalTarget.target_start_date)} - {formatDate(proposalTarget.target_end_date)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Proposed Start Date</label>
                    <input 
                      type="date" 
                      value={propStart}
                      onChange={(e) => setPropStart(e.target.value)}
                      className="w-full bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Proposed End Date</label>
                    <input 
                      type="date" 
                      value={propEnd}
                      onChange={(e) => setPropEnd(e.target.value)}
                      className="w-full bg-[var(--surface-sunken)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" 
                    />
                  </div>
                </div>

                <button 
                  onClick={handlePropose}
                  disabled={!propStart || !propEnd || proposing}
                  className="w-full btn-primary py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {proposing ? "Sending..." : "Send Proposal"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}