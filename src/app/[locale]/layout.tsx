import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Navbar from '@/components/Navbar';
import '../globals.css';

export const metadata: Metadata = {
  title: 'LeadPoint AI - Autonomous B2B Sales Agent Platform',
  description: 'AI-Powered Lead Discovery, Social Sourcing, Voice Agent Outreach, and Enterprise Admin Portal',
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1">{children}</div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
