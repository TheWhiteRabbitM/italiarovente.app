import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { VotePopup } from "@/components/VotePopup";
import { PWARegister } from "@/components/PWARegister";
import { LangAttr } from "@/components/LangAttr";
import { BottomNav } from "@/components/BottomNav";
import { AppMenu } from "@/components/AppMenu";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ChromeGate } from "@/components/ChromeGate";
import { UnitProvider } from "@/components/UnitProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import iosSplash from "@/data/ios-splash.json";

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
    "archivio meteo storico",
    "temperature storiche città italiane dal 1940",
    "quanto si è scaldata la mia città",
    "record caldo italia",
    "giorni di caldo africano",
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

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Italia Rovente",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description:
      "Progetto open source e indipendente che pubblica temperature storiche e attuali delle città italiane dal 1940, con metodo dichiarato e dati ERA5/ECMWF via Open-Meteo.",
    sameAs: ["https://github.com/TheWhiteRabbitM/italiarovente.app"],
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
        {/* Schermate di avvio iOS: iOS ignora il manifest per lo splash, servono
            queste immagini (una per risoluzione, chiara e scura). Il dark viene
            DOPO il light per lo stesso device: iOS applica l'ultimo match. */}
        {iosSplash.flatMap((d) => {
          const w = d.dw * d.dpr;
          const h = d.dh * d.dpr;
          const base = `(device-width: ${d.dw}px) and (device-height: ${d.dh}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: portrait)`;
          return [
            <link
              key={`${w}x${h}`}
              rel="apple-touch-startup-image"
              media={base}
              href={`/splash/splash-${w}x${h}.png`}
            />,
            <link
              key={`${w}x${h}-dark`}
              rel="apple-touch-startup-image"
              media={`${base} and (prefers-color-scheme: dark)`}
              href={`/splash/splash-${w}x${h}-dark.png`}
            />,
          ];
        })}
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
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
          <AppMenu />
        </UnitProvider>
        <LangAttr />
        <PWARegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
