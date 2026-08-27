import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <nav className="flex items-center gap-6 px-6 py-3 border-b bg-white">
        <Link href="/dashboard" className="font-bold">🏙️ CityOps AI</Link>
        <Link href="/work-orders" className="text-sm text-gray-600">Work Orders</Link>
        <Link href="/work-orders/new" className="text-sm text-gray-600">New Request</Link>
      </nav>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
