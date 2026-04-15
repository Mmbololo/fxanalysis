import { Maven_Pro } from "next/font/google";
import "./globals.css";

const mavenPro = Maven_Pro({
  subsets: ["latin"],
  variable: "--font-maven-pro",
});

export const metadata = {
  title: "Digipedia Trading Intel",
  description: "Advanced Forex Analysis SaaS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={mavenPro.variable} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
