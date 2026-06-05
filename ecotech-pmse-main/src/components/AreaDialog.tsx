"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PREFECTURES } from "@/lib/constants"
import { saveUserArea } from "@/app/actions"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface AreaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialPrefecture?: string
    initialCities?: string[]
}

export function AreaDialog({ open, onOpenChange, initialPrefecture, initialCities = [] }: AreaDialogProps) {
    const [prefecture, setPrefecture] = useState(initialPrefecture || PREFECTURES[0])
    const [cityInput, setCityInput] = useState("")
    const [cities, setCities] = useState<string[]>(initialCities)
    const [isSaving, setIsSaving] = useState(false)

    const handleAddCity = () => {
        const trimmed = cityInput.trim()
        if (trimmed && !cities.includes(trimmed)) {
            setCities([...cities, trimmed])
            setCityInput("")
        }
    }

    const removeCity = (city: string) => {
        setCities(cities.filter(c => c !== city))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await saveUserArea(prefecture, cities)
            toast.success("担当エリアを保存しました")
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("保存に失敗しました")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>担当エリアの追加・編集</DialogTitle>
                    <DialogDescription>
                        担当する都道府県と、その中の市区町村を選択してください。
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="prefecture">都道府県</Label>
                        <select
                            id="prefecture"
                            value={prefecture}
                            onChange={(e) => setPrefecture(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="都道府県を選択"
                        >
                            {PREFECTURES.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="city">市区町村 (任意)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="city"
                                placeholder="例: 港区"
                                value={cityInput}
                                onChange={(e) => setCityInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCity()}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={handleAddCity} aria-label="市区町村を追加">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {cities.length === 0 ? (
                            <span className="text-xs text-gray-400">市区町村が設定されていません（都道府県全体が対象になります）</span>
                        ) : (
                            cities.map(city => (
                                <Badge key={city} variant="secondary" className="gap-1 px-2 py-1">
                                    {city}
                                    <button 
                                        onClick={() => removeCity(city)} 
                                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        aria-label={`${city}を削除`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "保存中..." : "保存"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
