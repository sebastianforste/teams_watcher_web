import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Teams Recorder | World-Class Automation",
  description: "Monitor and control the Teams Voice Memos engine with a premium dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased text-white bg-black`}>
        <div className="fixed inset-0 -z-50 bg-[radial-gradient(circle_at_50%_0%,_#1a1a1a_0%,_#000000_100%)] opacity-100"></div>
        <div className="fixed inset-0 -z-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        {children}
      </body>
    </html>
  );
}
