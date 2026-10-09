import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pedra, Papel, Tesoura, Lagarto, Spock | Jogo Online",
  description:
    "Jogo multiplayer em tempo real inspirado em The Big Bang Theory. Desafie oponentes ou jogue contra o bot com o painel 'Quem vence quem'.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} dark`}>
      <body className="font-sans bg-slate-950 text-slate-100 min-h-dvh antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
