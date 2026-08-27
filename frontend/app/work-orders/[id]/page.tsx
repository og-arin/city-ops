"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ConflictAlert from "@/components/work-orders/ConflictAlert";
import { api } from "@/lib/api";
import type { WorkOrderResponse } from "@/lib/types";

export default function WorkOrderDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [order, setOrder] = useState<WorkOrderResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getWorkOrder(id).then(setOrder);
  }, [id]);

  if (!order) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{order.title}</h1>
        <p className="text-gray-500">
          Requested by {order.requesting_dept_slug} · Status: {order.status}
        </p>
        <p className="text-sm text-gray-400">
          {new Date(order.start_date).toLocaleDateString()} –{" "}
          {new Date(order.end_date).toLocaleDateString()}
        </p>
      </div>

      <ConflictAlert
        conflicts={order.conflicts}
        onAcknowledge={(assetId) => {
          // NOTE: acknowledge-conflict expects a conflict_log_id, not asset_id —
          // wire the real conflict_log_id through once the list endpoint returns it.
          console.log("acknowledge", assetId);
        }}
      />
    </div>
  );
}
