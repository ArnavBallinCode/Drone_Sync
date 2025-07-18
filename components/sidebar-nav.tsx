"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  HomeIcon, 
  CompassIcon,
  SlidersHorizontalIcon,
  SettingsIcon,
  BarChart2Icon,
  RadioIcon,
  WrenchIcon,
  EyeIcon
} from "lucide-react"

const routes = [
  {
    title: "Dashboard",
    icon: HomeIcon,
    href: "/",
  },
  {
    title: "Position",
    icon: CompassIcon,
    href: "/position",
  },
  {
    title: "Attitude",
    icon: SlidersHorizontalIcon,
    href: "/attitude",
  },
  {
    title: "Visualization",
    icon: EyeIcon,
    href: "/visualization",
  },
  {
    title: "Parameters",
    icon: SettingsIcon,
    href: "/parameters",
  },
  {
    title: "Telemetry",
    icon: BarChart2Icon,
    href: "/telemetry",
  },
  {
    title: "Radio Control",
    icon: RadioIcon,
    href: "/radio",
  },
  {
    title: "Calibration",
    icon: WrenchIcon,
    href: "/calibration",
  },
]

interface SidebarNavProps {
  className?: string
  isCollapsed?: boolean
}

export function SidebarNav({ className, isCollapsed }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-2">
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <Link key={route.href} href={route.href}>
                <Button
                  variant={pathname === route.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isCollapsed ? "px-2" : "px-4",
                    pathname === route.href && "bg-muted"
                  )}
                >
                  <Icon className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
                  {!isCollapsed && <span>{route.title}</span>}
                </Button>
              </Link>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
} 