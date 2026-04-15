import "./globals.css";

export const metadata = {
  title: "Digipedia Trading Intel",
  description: "Advanced Forex Analysis SaaS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
