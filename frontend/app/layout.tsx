import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CityOps AI — Pune Municipal Corporation",
  description:
    "Inter-department city coordination platform. Catch infrastructure conflicts before the road gets dug twice.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        <Navbar />
        <div className="flex-1 overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
