"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Trash2, Edit2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AreaDialog } from "./AreaDialog"
import { deleteUserArea } from "@/app/actions"
import { toast } from "sonner"

interface AreaSetting {
    id: string
    prefecture: string
    cities: string[]
}

interface AreaListClientProps {
    initialAreas: AreaSetting[]
}

export function AreaListClient({ initialAreas }: AreaListClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingArea, setEditingArea] = useState<AreaSetting | null>(null)

    const handleAdd = () => {
        setEditingArea(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (area: AreaSetting) => {
        setEditingArea(area)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("このエリア設定を削除しますか？")) return
        try {
            await deleteUserArea(id)
            toast.success("エリア設定を削除しました")
        } catch (error) {
            console.error(error)
            toast.error("削除に失敗しました")
        }
    }

    return (
        <>
            <div className="flex justify-end">
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    エリアを追加
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {initialAreas.length === 0 ? (
                    <Card className="col-span-full py-12">
                        <CardContent className="flex flex-col items-center justify-center text-gray-500">
                            <MapPin className="h-12 w-12 mb-4 opacity-20" />
                            <p>担当エリアが設定されていません</p>
                        </CardContent>
                    </Card>
                ) : (
                    initialAreas.map((area) => (
                        <Card key={area.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50 flex flex-row items-center justify-between space-y-0 py-3 px-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-indigo-600" />
                                    {area.prefecture}
                                </CardTitle>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={(e) => {
                                        e.stopPropagation()
                                        handleEdit(area)
                                    }}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(area.id)
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {area.cities.length === 0 ? (
                                        <span className="text-xs text-gray-400 italic">全域</span>
                                    ) : (
                                        area.cities.map(city => (
                                            <Badge key={city} variant="outline" className="text-[11px] font-normal border-gray-200">
                                                {city}
                                            </Badge>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <AreaDialog
                key={editingArea ? `edit-${editingArea.id}` : "add"}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialPrefecture={editingArea?.prefecture}
                initialCities={editingArea?.cities}
            />
        </>
    )
}
