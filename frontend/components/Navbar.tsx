"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/work-orders", label: "Work Orders" },
  { href: "/work-orders/new", label: "New Request" },
];

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/work-orders/new") return pathname === href;
    if (href === "/work-orders") return pathname.startsWith("/work-orders") && pathname !== "/work-orders/new";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header
      className="flex-none z-50 w-full"
      style={{ height: "var(--nav-height)" }}
    >
      <nav className="h-full flex items-center justify-between px-6 glass border-b border-slate-700/50">
        {/* Logo & Branding */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            🏙
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-white text-sm tracking-tight gradient-text">
              CityOps AI
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">
              Pune Municipal Corporation
            </span>
          </div>
          <span className="ml-1 hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Pilot
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* System Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass-light text-xs text-slate-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
          Spatial Engine Active
        </div>
      </nav>
    </header>
  );
}
