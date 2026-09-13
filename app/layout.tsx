import './globals.css';
import type { Metadata } from 'next';
import { ConvexClientProvider } from "./ConvexClientProvider";

export const metadata: Metadata = {
  title: 'Us',
  description: 'A private space for two',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased transition-colors duration-300">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
