import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lovon Agente — Especialistas Digitais com IA",
  description: "Crie seu especialista digital com IA anti-alucinação, loja visual e pagamentos PIX automatizados via VLM.",
  keywords: ["Lovon", "agente IA", "especialista digital", "RAG", "PIX", "VLM"],
  authors: [{ name: "Lovon" }],
  icons: { icon: "/lovon-icon.jpg" },
  openGraph: {
    title: "Lovon Agente",
    description: "Especialistas Digitais com IA",
    siteName: "Lovon Agente",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
