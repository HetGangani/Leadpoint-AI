import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import AppShell from '@/components/AppShell';
import '../globals.css';

export const metadata: Metadata = {
  title: 'LeadPoint-AI - B2B Sales Intelligence & Lead Orchestration',
  description: 'AI-Powered Lead Discovery, Intent Detection, Autonomous Voice SDR, and Meeting Orchestration',
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
    <html lang={locale}>
      <body className="min-h-screen bg-[#F2F0FF] text-[#0F0F12] antialiased font-sans selection:bg-[#E5C158]/30 selection:text-[#0F0F12]">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <AppShell>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
