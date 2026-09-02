import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat, Merriweather } from "next/font/google";
import { SiteChrome } from "@/components/SiteChrome";
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
  // Without the italic axis next/font ships upright only and the browser
  // fakes the slant by shearing the glyphs — visibly cruder than the real
  // cut, which the countdown page's subhead uses.
  style: ["normal", "italic"],
});

/* Container ID. Not an env var: it ships in the client HTML by design, is the
   same in every environment, and a value that never changes doesn't need
   configuration around it. */
const GTM_ID = "GTM-TQZP3SMT";

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
      <head>
        {/* Google Tag Manager. `afterInteractive` rather than
            `beforeInteractive`: GTM's own "as high in the head as possible"
            advice is written for a plain HTML page, where nothing else would
            schedule the request. Next hoists this into the head either way,
            and blocking hydration on a tag manager costs LCP on every route
            for no measurable gain in collection. */}
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        {/* GTM noscript fallback — first thing in the body, per GTM's install. */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <SmoothScroll />
        <SiteChrome />
        {children}
      </body>
    </html>
  );
}
