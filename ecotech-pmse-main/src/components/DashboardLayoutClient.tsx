"use client"

import { useState } from "react"
import { AppSidebar } from "./AppSidebar"
import { Button } from "./ui/button"
import { Menu } from "lucide-react"

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user?: {
        name?: string | null
        affiliation?: string | null
        image?: string | null
    }
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen w-full bg-gray-100 print:block print:h-auto print:bg-white">
            {/* Sidebar Container */}
            <div className="print:hidden">
                <AppSidebar
                    user={user}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center border-b bg-white px-4 md:hidden print:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="mr-2"
                    >
                        <Menu className="h-6 w-6 text-slate-600" />
                    </Button>
                    <h1 className="text-lg font-bold text-slate-900">Purpose Ecotech</h1>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6 print:overflow-visible print:p-0 print:h-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
