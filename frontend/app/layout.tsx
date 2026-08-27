import "./globals.css";

export const metadata = {
  title: "CityOps AI",
  description: "Inter-department city coordination platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
