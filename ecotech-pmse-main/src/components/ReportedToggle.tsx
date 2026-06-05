"use client"

import { toggleReportedStatus } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { CheckCircle2, RotateCcw } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

interface ReportedToggleProps {
    id: number
    isReported: boolean
    requestStatus: string
}

export function ReportedToggle({ id, isReported, requestStatus }: ReportedToggleProps) {
    const [isPending, startTransition] = useTransition()
    const canToggle = requestStatus === "COMPLETED"

    const handleToggle = () => {
        startTransition(async () => {
            try {
                await toggleReportedStatus(id, !isReported)
                toast.success(isReported ? "報告済みに戻しました" : "報告済みにしました")
            } catch (error) {
                console.error(error)
                toast.error("エラーが発生しました")
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={isPending || (!canToggle && !isReported)}
            className={isReported ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : (canToggle ? "text-gray-400 hover:text-green-600 hover:bg-green-50" : "text-gray-300 cursor-not-allowed")}
            title={isReported ? "報告未完了に戻す" : (canToggle ? "報告済みにする" : "先にステータスを完了にして下さい")}
        >
            {isReported ? (
                <div className="flex items-center gap-1">
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px]">戻す</span>
                </div>
            ) : (
                <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px]">報告済</span>
                </div>
            )}
        </Button>
    )
}
