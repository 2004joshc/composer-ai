import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Composer AI — Generate Music with AI',
  description: 'Create beautiful MIDI compositions using AI. Choose your genre, mood, and instruments — let AI compose for you.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
