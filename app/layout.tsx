import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ima2-worldcup',
  description: 'AI fan art style transfer for sports highlights',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
