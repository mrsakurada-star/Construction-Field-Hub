"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, ChevronDown, FilePlus, Search } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { HistoryCopyModal } from "@/components/HistoryCopyModal"

export function RequestListHeader() {
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-black">依頼一覧</h2>
                    <p className="text-sm text-black">案件を管理します</p>
                </div>

                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="font-semibold">
                                <Plus className="mr-2 h-4 w-4" />
                                新規依頼作成
                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                                <Link href="/requests/new" className="cursor-pointer w-full flex items-center">
                                    <FilePlus className="mr-2 h-4 w-4" />
                                    <span>新規入力</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsCopyModalOpen(true)} className="cursor-pointer">
                                <Search className="mr-2 h-4 w-4" />
                                <span>過去履歴を検索してコピー</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <HistoryCopyModal open={isCopyModalOpen} onOpenChange={setIsCopyModalOpen} />
        </>
    )
}
