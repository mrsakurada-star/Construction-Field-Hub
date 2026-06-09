"use client"

import { Input } from "@/components/ui/input"
import { Search, Eye, EyeOff } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function RequestSearch({
    enableDateFilter = false,
    enableReportedFilter = false
}: {
    enableDateFilter?: boolean,
    enableReportedFilter?: boolean
}) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const { replace } = useRouter()
    const [, startTransition] = useTransition()

    function handleSearch(key: string, value: string) {
        const params = new URLSearchParams(searchParams)
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }

        // Reset page if needed, but simple param update is fine
        startTransition(() => {
            replace(`${pathname}?${params.toString()}`)
        })
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-1 w-full md:w-[300px] md:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="検索: 管理番号, 顧客名, TEL, 機種..."
                    onChange={(e) => handleSearch("q", e.target.value)}
                    defaultValue={searchParams.get("q")?.toString()}
                    className="pl-8 bg-white"
                />
            </div>

            {enableDateFilter && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Input
                        type="date"
                        className="bg-white w-full md:w-[150px]"
                        onChange={(e) => handleSearch("from", e.target.value)}
                        defaultValue={searchParams.get("from")?.toString()}
                    />
                    <span className="text-gray-500">〜</span>
                    <Input
                        type="date"
                        className="bg-white w-full md:w-[150px]"
                        onChange={(e) => handleSearch("to", e.target.value)}
                        defaultValue={searchParams.get("to")?.toString()}
                    />
                </div>
            )}

            {enableReportedFilter && (
                <div className="flex items-center gap-2 ml-auto">
                    <Checkbox
                        id="show-reported"
                        onCheckedChange={(checked) => handleSearch("reported", checked ? "true" : "")}
                        defaultChecked={searchParams.get("reported") === "true"}
                    />
                    <Label htmlFor="show-reported" className="text-sm cursor-pointer flex items-center gap-1">
                        {searchParams.get("reported") === "true" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        報告済みを表示
                    </Label>
                </div>
            )}
        </div>
    )
}
