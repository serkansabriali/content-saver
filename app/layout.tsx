import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Content Saver",
  description: "Save tweets and threads as clean markdown files",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${dmMono.variable} bg-bg text-ink min-h-screen`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
