import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { 
  title: "Dream → Reality | Travel Planner", 
  description: "Plan your dream vacation with AI. Get personalized destinations, flights, hotels, and detailed itineraries just like Cleartrip." 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>

        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}