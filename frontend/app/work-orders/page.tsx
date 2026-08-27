"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { WorkOrderResponse } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  conflict: "bg-red-100 text-red-700",
  coordinating: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  rejected: "bg-gray-200 text-gray-500",
};

export default function WorkOrdersListPage() {
  const [orders, setOrders] = useState<WorkOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listWorkOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading work orders...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Work Orders</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`/work-orders/${o.id}`}
            className="flex items-center justify-between bg-white border rounded-lg p-4 hover:shadow-sm"
          >
            <div>
              <p className="font-medium">{o.title}</p>
              <p className="text-sm text-gray-500">{o.requesting_dept_slug}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>
              {o.status}
            </span>
          </Link>
        ))}
        {orders.length === 0 && (
          <p className="text-gray-500 text-sm">No work orders yet.</p>
        )}
      </div>
    </div>
  );
}
