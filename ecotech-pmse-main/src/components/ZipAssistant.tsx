"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { findZips } from "@/app/actions"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface ZipAssistantProps {
    onSelect: (zip: string, addr: string) => void
}

export function ZipAssistant({ onSelect }: ZipAssistantProps) {
    const [open, setOpen] = React.useState(false)
    const [keyword, setKeyword] = React.useState("")
    const [results, setResults] = React.useState<{ zip: string, addr: string }[]>([])
    const [loading, setLoading] = React.useState(false)

    const handleSearch = async () => {
        if (keyword.length < 2) return
        setLoading(true)
        try {
            const res = await findZips(keyword)
            setResults(res)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 text-[0.7rem] text-blue-600 hover:text-blue-800">
                    住所から検索
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>郵便番号を検索</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="例: 世田谷区桜丘"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? "..." : <Search className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-auto space-y-1">
                        {results.length > 0 ? (
                            results.map((item, i) => (
                                <button
                                    key={i}
                                    className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm flex justify-between"
                                    onClick={() => {
                                        onSelect(item.zip, item.addr)
                                        setOpen(false)
                                    }}
                                >
                                    <span>{item.addr}</span>
                                    <span className="text-gray-500 font-mono">{item.zip}</span>
                                </button>
                            ))
                        ) : (
                            !loading && keyword.length >= 2 && <p className="text-center text-gray-500 text-sm py-4">該当するデータが見つかりませんでした。</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
