import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: "TradingIntel",
  description: "Advanced Forex Analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geistMono.variable} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
