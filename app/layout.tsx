import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}