"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList, Search, PieChart, LogOut, Upload, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { Button } from "./ui/button"

const navItems = [
    {
        title: "依頼一覧",
        href: "/requests",
        icon: ClipboardList,
    },
    {
        title: "訪問履歴検索",
        href: "/history",
        icon: Search,
    },
    {
        title: "訪問内容まとめ",
        href: "/summary",
        icon: PieChart,
    },
    {
        title: "追跡履歴検索",
        href: "/tracking",
        icon: Search,
    },
    {
        title: "インポート",
        href: "/import",
        icon: Upload,
    },
    {
        title: "ユーザー管理",
        href: "/areas",
        icon: User,
    },
]

interface AppSidebarProps {
    user?: {
        name?: string | null
        affiliation?: string | null
        image?: string | null
    }
    isOpen?: boolean
    onClose?: () => void
}

export function AppSidebar({ user, isOpen, onClose }: AppSidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "pointer-events-none opacity-0"
                )}
                onClick={onClose}
            />

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r bg-white shadow-lg transition-transform md:translate-x-0 md:static md:flex md:shadow-sm",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between px-6 border-b">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        Purpose Ecotech
                    </h1>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
                {user && (
                    <div className="px-6 py-4 bg-slate-50 border-b flex items-center gap-3">
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={user.name || "User"}
                                className="h-10 w-10 rounded-full object-cover border border-slate-200"
                            />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border border-slate-300">
                                {user.name?.[0] || "?"}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-500 truncate">{user.affiliation || "所属なし"}</p>
                            <p className="text-sm font-bold text-slate-900 truncate">{user.name || "ゲスト"}</p>
                        </div>
                    </div>
                )}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => {
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-slate-100 text-slate-900"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0",
                                        isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-900"
                                    )}
                                />
                                {item.title}
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        ログアウト
                    </Button>
                </div>
            </aside>
        </>
    )
}
