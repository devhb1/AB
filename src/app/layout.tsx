import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const codeFont = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AHB26 - AI Context Engine",
  description: "Unified context platform for teams. Store, organize, and reason about company decisions from Slack, GitHub, Gmail, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${codeFont.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (() => {
                try {
                  const storageKey = 'ahb26-theme';
                  const savedTheme = localStorage.getItem(storageKey);
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const resolvedTheme = savedTheme && savedTheme !== 'system' ? savedTheme : systemTheme;
                  document.documentElement.dataset.theme = resolvedTheme;
                  document.documentElement.style.colorScheme = resolvedTheme;
                } catch (error) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "pk_test_YWNjZXB0ZWQtZWVsLTc2LmNsZXJrLmFjY291bnRzLmRldiQ"}
          >
            {children}
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
