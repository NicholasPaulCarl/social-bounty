import type { Metadata } from 'next';
import { Providers } from './providers';

// PrimeReact CSS - must be imported before Tailwind (globals.css)
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Social Bounty',
  description: 'Complete bounties, earn rewards',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
