"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CountUp from "react-countup";
import { api } from "@/lib/api";
import MapView from "@/components/map/MapView";
import {
  MapPin,
  Handshake,
  TriangleAlert,
  Landmark,
  Building2,
  Route,
  Droplets,
  type LucideIcon,
} from "lucide-react";

interface Stats {
  activeAssets: number;
  deptsCoordinating: number;
  liveConflicts: number;
  totalDepts: number;
}

const STAT_CARDS: {
  key: keyof Stats;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: "activeAssets", label: "Active Assets Tracked", Icon: MapPin },
  { key: "deptsCoordinating", label: "Departments Coordinating", Icon: Handshake },
  { key: "liveConflicts", label: "Live Conflicts Detected", Icon: TriangleAlert },
  { key: "totalDepts", label: "Departments on Platform", Icon: Landmark },
];

const FEATURE_PILLS: { label: string; Icon: LucideIcon }[] = [
  { label: "Administrative Wards", Icon: Building2 },
  { label: "Road Network", Icon: Route },
  { label: "Drainage", Icon: Droplets },
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
        const statsData = await api.getStats();

        if (cancelled) return;

        setStats({
          activeAssets: statsData.active_assets,
          deptsCoordinating: statsData.departments_coordinating,
          liveConflicts: statsData.live_conflicts,
          totalDepts: 8,
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
    <main className="relative h-full flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      {/* Background map — decorative, non-interactive */}
      <div className="absolute inset-0">
        <MapView interactive={false} zoom={12.5} activeLayers={[]} />
      </div>
      {/* Dark overlay so text stays legible regardless of the map tiles under it.
          Fixed (not theme-reactive) since the map behind it never changes with
          light/dark mode — the hero copy below matches it with fixed light colors. */}
      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 max-w-2xl space-y-8">
        {/* Logo + Title */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="w-20 h-20 mx-auto surface flex items-center justify-center">
            <Building2 className="w-9 h-9 text-[var(--accent)]" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            CityOps <span className="text-[var(--accent)]">AI</span>
          </h1>
          <p className="text-xl text-white/70 leading-relaxed max-w-lg mx-auto">
            One shared operational layer for municipal departments — catch
            infrastructure conflicts{" "}
            <span className="text-white font-medium">
              before the road gets dug twice.
            </span>
          </p>
        </div>

        {/* Live stat cards */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up"
          style={{ animationDelay: "120ms" }}
        >
          {STAT_CARDS.map(({ key, label, Icon }) => (
            <div
              key={key}
              className="surface px-4 py-5 text-center space-y-2 transition-transform duration-200 hover:-translate-y-1"
            >
              <Icon className="w-6 h-6 mx-auto text-[var(--accent)]" />
              <p
                className={`text-2xl font-bold font-mono-data text-[var(--text-primary)] transition-opacity duration-500 ${
                  loaded ? "opacity-100" : "opacity-30"
                }`}
              >
                {loaded ? (
                  <CountUp end={stats[key]} separator="," duration={2.5} useEasing={true} />
                ) : (
                  "0"
                )}
              </p>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider leading-tight">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div
          className="flex flex-wrap justify-center gap-2 animate-fade-in-up"
          style={{ animationDelay: "220ms" }}
        >
          {FEATURE_PILLS.map(({ label, Icon }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] pill px-4 py-2"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div
          className="flex items-center justify-center gap-3 animate-fade-in-up"
          style={{ animationDelay: "320ms" }}
        >
          <Link
            href="/dashboard"
            className="px-8 py-3.5 btn-primary font-semibold text-sm"
          >
            Open Dashboard →
          </Link>
          <Link
            href="/work-orders/new"
            className="px-8 py-3.5 btn text-[var(--text-muted)] font-semibold text-sm hover:text-[var(--text-primary)]"
          >
            New Work Order
          </Link>
        </div>
      </div>
    </main>
  );
}
