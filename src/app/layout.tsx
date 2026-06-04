import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trail — BYK Local Email OS",
  description: "Open-source local-first email OS: bring your key, bring your domain, bring your computer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="noise" />
        {children}
      </body>
    </html>
  );
}
