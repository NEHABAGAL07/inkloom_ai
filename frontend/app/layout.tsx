import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/services/theme-context";
import { AuthProvider } from "@/services/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Inkloom AI — Enterprise Brand Governance Platform",
  description:
    "Automated brand guideline retrieval, tone analysis, claim verification, and human-in-the-loop review workflow.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('inkloom_theme');
                  var isDark = stored ? stored === 'dark' : true;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-workspace text-ink-primary min-h-screen font-sans antialiased selection:bg-[#10B981]/25 selection:text-[#0F172A] dark:selection:bg-[#FF7A36]/30 dark:selection:text-white transition-colors duration-150">
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
