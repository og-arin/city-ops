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
      <nav className="h-full flex items-center justify-between px-6 surface border-b border-[var(--border)]">
        {/* Logo & Branding */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-sm font-bold shadow-lg shadow-[var(--accent)]/20 group-hover:shadow-[var(--accent)]/40 transition-shadow">
            🏙
          </div>
          <span className="font-bold text-[var(--text-primary)] text-sm tracking-tight">
            CityOps AI
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
                    ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* System Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full surface text-xs text-[var(--text-muted)] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          Spatial Engine Active
        </div>
      </nav>
    </header>
  );
}
