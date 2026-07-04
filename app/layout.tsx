import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Tibetan Resonance',
  description: 'A calming Tibetan singing bowl frequency generator for children and parents.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body suppressHydrationWarning className="font-sans bg-black text-white">{children}</body>
    </html>
  );
}
