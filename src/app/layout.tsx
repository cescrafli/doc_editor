import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CESCTOR — Online Collaborative Document & Rich-Text Editor',
  description:
    'Cesctor collaborative document editor with rich-text formatting, live split preview, role-based sharing (Owner, Editor, Viewer), and multi-format file import.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-[#35D7BB]/25 selection:text-[#2B2F36]">
        {children}
      </body>
    </html>
  );
}
