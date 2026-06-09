"use client"

import { useState, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Copy } from "lucide-react"
import { searchHistoricalRequests } from "@/app/(dashboard)/requests/new/actions"
import { useRouter } from "next/navigation"

interface HistoryCopyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function HistoryCopyModal({ open, onOpenChange }: HistoryCopyModalProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [isSearching, startSearch] = useTransition()
    const router = useRouter()

    const handleSearch = () => {
        startSearch(async () => {
            const data = await searchHistoricalRequests(query)
            setResults(data)
        })
    }

    const handleCopy = (id: number) => {
        onOpenChange(false)
        router.push(`/requests/new?copyFrom=${id}`)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>過去履歴を検索してコピー</DialogTitle>
                    <DialogDescription>
                        作成したい依頼に近い過去のレコードを検索してください。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 py-4">
                    <Input
                        placeholder="お客様名、住所、機種などで検索..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-2">検索</span>
                    </Button>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-black font-medium border-b sticky top-0">
                            <tr>
                                <th className="px-4 py-2">お客様名</th>
                                <th className="px-4 py-2">機種</th>
                                <th className="px-4 py-2">依頼内容</th>
                                <th className="px-4 py-2">完了日</th>
                                <th className="px-4 py-2 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {results.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                        {query ? "該当する結果がありません" : "検索キーワードを入力してください"}
                                    </td>
                                </tr>
                            ) : (
                                results.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium">{r.customerName}</td>
                                        <td className="px-4 py-2">{r.deviceModel}</td>
                                        <td className="px-4 py-2 truncate max-w-[150px]">{r.requestContent}</td>
                                        <td className="px-4 py-2">{r.completedAt ? new Date(r.completedAt).toLocaleDateString("ja-JP") : "-"}</td>
                                        <td className="px-4 py-2 text-right">
                                            <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => handleCopy(r.id)}>
                                                <Copy className="h-4 w-4 mr-1" />
                                                コピー
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DialogContent>
        </Dialog>
    )
}
