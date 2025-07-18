"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ModeToggle } from "./mode-toggle"

interface NavigationProps {
  view: 'dashboard' | 'analytics';
}

export function Navigation({ view, onToggle }: NavigationProps) {
  const router = useRouter();
  const handleNav = () => {
    if (view === 'dashboard') {
      router.push('/history');
    } else {
      router.push('/');
    }
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 w-full px-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-white">
            Drone <span className="text-blue-400">Sync</span>
          </Link>
          <ModeToggle />
        </div>
        <div>
          <button
            className="px-4 py-2 rounded-md font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            onClick={handleNav}
          >
            {view === 'dashboard' ? 'Analysis' : 'Dashboard'}
          </button>
        </div>
      </div>
    </nav>
  )
}