import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Patch — IT Support Assistant',
  description: 'AI-powered IT troubleshooting for store associates',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
    </html>
  );
}
