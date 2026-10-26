import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Louboutin · La collection en 3D",
  description:
    "Site de démonstration : une sélection d'escarpins Christian Louboutin à explorer en 3D interactive.",
};

export const viewport: Viewport = {
  themeColor: "#07070a",
  width: "device-width",
  initialScale: 1,
};

// Exécuté avant le premier rendu : marque la session comme déjà visitée pour
// masquer le préchargement sans flash. Le try/catch couvre les navigateurs
// où sessionStorage est indisponible (navigation privée, cookies bloqués).
const seenScript = `try{if(sessionStorage.getItem('cl-preloaded')==='1'){document.documentElement.dataset.preloaded='1'}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: seenScript }} />
      </head>
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
