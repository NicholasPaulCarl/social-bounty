import type { Metadata } from 'next';
import { Space_Grotesk, Inter, Source_Code_Pro } from 'next/font/google';
import { Providers } from './providers';

// PrimeReact CSS - must be imported before Tailwind (globals.css)
import 'primereact/resources/themes/lara-light-pink/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import '@/styles/globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Social Bounty',
  description: 'Complete bounties, earn rewards',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${sourceCodePro.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
