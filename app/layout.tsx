import type { Metadata } from "next";
import { Montserrat, Merriweather } from "next/font/google";
import { StickyLogo } from "@/components/StickyLogo";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

// The brand book specifies exactly two faces — Montserrat primary,
// Merriweather secondary — so those are the only two the site loads.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Adversado — The Brand Behind The Brands",
  description:
    "Adversado is an integrated creative agency in Kochi building brands across India. Strategy to execution, one team, end to end.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${merriweather.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <StickyLogo />
        {children}
      </body>
    </html>
  );
}
