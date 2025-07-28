"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ModeToggle } from "./mode-toggle"

interface NavigationProps {
  view: 'dashboard' | 'analytics';
}

export function Navigation({ view }: NavigationProps) {
  const router = useRouter();

  const handleDashboard = () => {
    router.push('/');
  };

  const handleAnalysis = () => {
    router.push('/history');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-900 bg-opacity-90 backdrop-blur-sm">
      <div className="flex items-center h-16 w-full px-4">
        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link href="/" className="text-xl font-bold text-white">
            Drone <span className="text-blue-400">Sync</span>
          </Link>
          <div className="flex gap-2 ml-4">
            <button
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${view === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              onClick={handleDashboard}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 rounded-md font-semibold transition-colors ${view === 'analytics'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              onClick={handleAnalysis}
            >
              Analysis
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}