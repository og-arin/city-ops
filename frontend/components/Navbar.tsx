"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";

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
      className="flex-none z-50 w-full border-b border-[var(--border)]"
      style={{ height: "var(--nav-height)" }}
    >
      <nav className="h-full flex items-center justify-between px-6 bg-[var(--bg-base)]">
        {/* Logo & Branding */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg surface flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[var(--accent)]" />
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
                    ? "surface-sunken text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* System Status + theme */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full pill text-xs text-[var(--text-muted)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Spatial Engine Active
          </div>
        </div>
      </nav>
    </header>
  );
}
