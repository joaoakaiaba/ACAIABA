import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";

// No-flash theme init: reads the persisted preference (or OS) and applies the
// `dark` class to <html> before the page paints, preventing a light flash.
const themeInitScript = `(function(){try{var s=localStorage.getItem("acaiaba_theme");var m=s==="light"||s==="dark"||s==="system"?s:"system";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen text-slate-900 bg-white`}>
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
