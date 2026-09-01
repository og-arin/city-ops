import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CityOps AI — Municipal Infrastructure Platform",
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
      <head>
        {/* Runs before first paint so the saved theme applies with no flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('cityops-theme');if(t==='light')document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex flex-col bg-[var(--bg-base)] text-[var(--text-primary)] antialiased">
        <Navbar />
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
