import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VotePopup } from "@/components/VotePopup";
import { PWARegister } from "@/components/PWARegister";
import { LangAttr } from "@/components/LangAttr";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ChromeGate } from "@/components/ChromeGate";
import { UnitProvider } from "@/components/UnitProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Italia Rovente · I dati, non le opinioni. Le temperature italiane dal 1940",
    template: "%s · Italia Rovente",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "meteo italia",
    "temperature italia",
    "clima italia",
    "riscaldamento globale",
    "cambiamento climatico",
    "anomalie temperatura",
    "warming stripes",
    "città italiane",
    "dati storici clima",
    "ERA5",
  ],
  authors: [{ name: "Italia Rovente" }],
  creator: "Italia Rovente",
  alternates: { canonical: "/", languages: { en: "/en", "x-default": "/" } },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: SITE_URL,
    siteName: "Italia Rovente",
    title: "Italia Rovente · I dati, non le opinioni. Le temperature italiane dal 1940",
    description:
      "I dati, non le opinioni. Le temperature delle città italiane dal 1940 a oggi: anomalie, warming stripes e mappa interattiva, senza narrativa precostituita.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Italia Rovente · I dati, non le opinioni. Le temperature italiane dal 1940",
    description:
      "I dati, non le opinioni. Temperature storiche e attuali delle città italiane, anomalie e warming stripes dal 1940.",
  },
  category: "weather",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Italia Rovente",
    statusBarStyle: "black-translucent",
  },
  verification: {
    google: "rmZEXr8-41Yp1-BPPl6TVBVIe8FBn_eFwF341ReSkg4",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#29241f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Italia Rovente",
    url: SITE_URL,
    description:
      "Temperature storiche e attuali delle città italiane dal 1940, anomalie e warming stripes per analizzare il clima con i dati, non le opinioni.",
    inLanguage: "it-IT",
    keywords:
      "meteo italia, riscaldamento globale, temperature, anomalie, clima, ERA5",
    creator: { "@type": "Organization", name: "Italia Rovente" },
    license: "https://open-meteo.com/en/license",
  };

  return (
    <html
      lang="it"
      className={`${sans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('theme');var d=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <UnitProvider>
          <ChromeGate>
            <div className="aurora" aria-hidden />
            <Header />
          </ChromeGate>
          <main className="flex-1 w-full">{children}</main>
          <ChromeGate>
            <Footer />
            <VotePopup />
            <BottomNav />
            <InstallPrompt />
          </ChromeGate>
        </UnitProvider>
        <LangAttr />
        <PWARegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
