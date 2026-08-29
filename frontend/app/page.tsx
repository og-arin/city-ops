import Link from "next/link";

export const metadata = {
  title: "CityOps AI — Infrastructure Coordination Platform",
};

export default function LandingPage() {
  return (
    <main className="h-full flex flex-col items-center justify-center text-center px-6 relative overflow-hidden">
      {/* Animated gradient background blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-600/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 max-w-2xl space-y-8">
        {/* Pilot badge */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Pune Municipal Corporation · Live Pilot Program
        </div>

        {/* Logo + Title */}
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/40">
            🏙️
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            CityOps{" "}
            <span className="gradient-text">AI</span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed max-w-lg mx-auto">
            One shared operational layer for municipal departments — catch
            infrastructure conflicts{" "}
            <span className="text-slate-300 font-medium">
              before the road gets dug twice.
            </span>
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {[
            "🛣️ Road Network",
            "💧 Water Pipes",
            "⚡ Electric Cables",
            "📡 Telecom Ducts",
          ].map((feat) => (
            <span
              key={feat}
              className="text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-full"
            >
              {feat}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/50 transition-all active:scale-[0.98]"
          >
            Open Dashboard →
          </Link>
          <Link
            href="/work-orders/new"
            className="px-8 py-3.5 rounded-xl glass-light text-slate-300 font-semibold text-sm border border-slate-700/60 hover:text-white hover:border-slate-500/60 transition-all"
          >
            New Work Order
          </Link>
        </div>
      </div>
    </main>
  );
}
