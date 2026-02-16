import { Inter } from "next/font/google";
import "./globals.css";

// Use Inter as a close alternative to Geist if not available
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "402FC | Football Intelligence, Pay Per Match",
  description: "Web3 football highlights and analytics. Pay per match with STX.",
  icons: {
    icon: "/402fc-icon.svg",
    shortcut: "/402fc-icon.svg",
    apple: "/402fc-icon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="bg-dot-pattern" />
        <div className="blue-glow" />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
