// Dashboard layout — nav is now provided by app/layout.tsx (root layout).
// This layout simply passes children through so the dashboard fills the
// available height that the root layout's flex-1 container provides.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-full">{children}</div>;
}
