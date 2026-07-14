import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const metadata = {
  title: "LearnWithA",
  description: "Recursos, noticias y tests para la clase.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "LearnWithA",
    description: "Recursos, noticias y tests para la clase.",
    siteName: "LearnWithA",
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LearnWithA",
    description: "Recursos, noticias y tests para la clase.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
