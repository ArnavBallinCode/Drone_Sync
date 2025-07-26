"use client"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { MainLayout } from "@/components/main-layout"
import { AutoCollectProvider } from "@/contexts/auto-collect-context"

import { Navigation } from "@/components/navigation"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const view = pathname === '/history' ? 'analytics' : 'dashboard';
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " h-screen w-screen"}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AutoCollectProvider>
            <Navigation view={view} />
            {/* Remove pt-4 and set h-full to main */}
            <main className="pt-12 h-screen w-screen">
              <MainLayout>{children}</MainLayout>
            </main>
          </AutoCollectProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

