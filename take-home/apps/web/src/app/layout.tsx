import type { Metadata } from 'next';
import { Providers } from './providers';
import { NavLinks } from './nav-links';
import './globals.css';

export const metadata: Metadata = {
  title: 'Canals Take Home',
  description: 'Canals take-home project',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <Providers>
          <aside className="w-56 min-h-screen flex-shrink-0 bg-[var(--canals-sidebar)] border-r border-gray-200/80">
            <div className="p-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-canals-accent flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm3.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800">canals</span>
            </div>
            <NavLinks />
          </aside>
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
