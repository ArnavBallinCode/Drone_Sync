"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarNav } from "@/components/sidebar-nav"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex flex-col h-full w-full">
      {/* If you have a sidebar, include it here */}
      <main className="flex-1 h-full min-h-0 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
} 