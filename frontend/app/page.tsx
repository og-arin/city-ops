"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Stats {
  activeAssets: number;
  deptsCoordinating: number;
  liveConflicts: number;
  totalDepts: number;
}

const STAT_CARDS: {
  key: keyof Stats;
  label: string;
  icon: string;
}[] = [
  { key: "activeAssets", label: "Active Assets Tracked", icon: "📍" },
  { key: "deptsCoordinating", label: "Departments Coordinating", icon: "🤝" },
  { key: "liveConflicts", label: "Live Conflicts Detected", icon: "⚠️" },
  { key: "totalDepts", label: "Departments on Platform", icon: "🏛️" },
];

export default function LandingPage() {
  const [stats, setStats] = useState<Stats>({
    activeAssets: 0,
    deptsCoordinating: 0,
    liveConflicts: 0,
    totalDepts: 8,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const [infra, orders] = await Promise.allSettled([
          api.getInfrastructure(),
          api.listWorkOrders(),
        ]);

        if (cancelled) return;

        const activeAssets =
          infra.status === "fulfilled" ? infra.value.features.length : 0;

        let deptsCoordinating = 0;
        let liveConflicts = 0;
        if (orders.status === "fulfilled") {
          const coordinating = orders.value.filter(
            (o) => o.status === "coordinating"
          );
          deptsCoordinating = new Set(
            coordinating.map((o) => o.requesting_dept_slug)
          ).size;
          liveConflicts = orders.value.filter(
            (o) => o.status === "conflict"
          ).length;
        }

        setStats({
          activeAssets,
          deptsCoordinating,
          liveConflicts,
          totalDepts: 8, // matches seed_data.py
        });
      } catch {
        // Backend offline — keep defaults at 0
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="h-full flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      <div className="relative z-10 max-w-2xl space-y-8">
        {/* Logo + Title */}
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--accent)] flex items-center justify-center text-4xl shadow-2xl shadow-[var(--accent)]/20">
            🏙️
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            CityOps{" "}
            <span className="text-[var(--accent)]">AI</span>
          </h1>
          <p className="text-xl text-[var(--text-muted)] leading-relaxed max-w-lg mx-auto">
            One shared operational layer for municipal departments — catch
            infrastructure conflicts{" "}
            <span className="text-[var(--text-primary)] font-medium">
              before the road gets dug twice.
            </span>
          </p>
        </div>

        {/* Live stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ key, label, icon }) => (
            <div
              key={key}
              className="surface rounded-xl px-4 py-4 text-center space-y-1"
            >
              <div className="text-2xl">{icon}</div>
              <p
                className={`text-2xl font-bold font-mono-data text-[var(--text-primary)] transition-opacity duration-500 ${
                  loaded ? "opacity-100" : "opacity-30"
                }`}
              >
                {stats[key]}
              </p>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider leading-tight">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "🏢 Administrative Wards",
            "🛣️ Road Network",
            "🌊 Drainage",
          ].map((feat) => (
            <span
              key={feat}
              className="text-xs font-medium text-[var(--text-muted)] surface px-3 py-1.5 rounded-full"
            >
              {feat}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-[var(--accent)] text-[var(--bg-base)] font-semibold text-sm shadow-xl shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/40 hover:brightness-110 transition-all active:scale-[0.98]"
          >
            Open Dashboard →
          </Link>
          <Link
            href="/work-orders/new"
            className="px-8 py-3.5 rounded-xl surface text-[var(--text-muted)] font-semibold text-sm hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-all"
          >
            New Work Order
          </Link>
        </div>
      </div>
    </main>
  );
}