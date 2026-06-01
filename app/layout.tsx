import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ensureKBStructure } from "@/lib/kb";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Patch | Discount Tire Support",
  description:
    "Self-service support for Discount Tire store associates. Resolve common issues with Patch, your IT support agent.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureKBStructure();
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F7F8] text-gray-900">
        {children}
      </body>
    </html>
  );
}
