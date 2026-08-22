import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ACAIABA — O estilo que marca presença.",
  description: "Encontre os melhores calçados, moda fitness, casa, enxoval e beleza na ACAIABA.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "ACAIABA — O estilo que marca presença.",
    description: "Encontre os melhores calçados, moda fitness, casa, enxoval e beleza na ACAIABA.",
    siteName: "ACAIABA",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ACAIABA Store",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} flex flex-col min-h-screen text-slate-900 bg-white`}>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
