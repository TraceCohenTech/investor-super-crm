import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import AuthGate from "@/components/AuthGate";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "NYVP Investor CRM",
    template: "%s · NYVP Investor CRM",
  },
  description: "New York Venture Partners — Investor CRM Dashboard",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <AuthGate>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 ml-64 p-8 flex flex-col">
              <div className="flex-1 min-w-0">{children}</div>
              <Footer />
            </main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
