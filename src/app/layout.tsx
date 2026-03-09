import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { TabBar } from "@/components/layout/tab-bar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Gliss",
  description: "A built-out language learning workspace with chat, saved lessons, and council review.",
  icons: {
    icon: "/logomark.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="selection:bg-sky-100 selection:text-sky-950">
      <body className={`${GeistMono.className} ${GeistMono.variable} bg-background text-foreground antialiased`}>
        <TooltipProvider>
          <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
            <div className="flex min-h-dvh w-full">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main className="flex min-h-0 flex-1 flex-col">{children}</main>
                <TabBar />
              </div>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
