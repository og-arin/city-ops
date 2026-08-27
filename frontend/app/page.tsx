import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-3">🏙️ CityOps AI</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        One shared operational layer for municipal departments — catch
        infrastructure conflicts before the road gets dug twice.
      </p>
      <Link
        href="/dashboard"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
      >
        Open Dashboard
      </Link>
    </main>
  );
}
