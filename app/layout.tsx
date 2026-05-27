import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patch - IT Self-Service Chatbot",
  description: "AI-powered IT troubleshooting for store associates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
