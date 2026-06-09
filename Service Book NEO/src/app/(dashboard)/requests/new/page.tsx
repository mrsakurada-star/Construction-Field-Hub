"use client"

import { createRequest } from "@/app/actions"
import { RequestForm } from "@/components/RequestForm"
import { useEffect, useState, use } from "react"
import { getRequestById } from "./actions"
import { Loader2 } from "lucide-react"
import { RequestFormValues } from "@/lib/schema"

export default function NewRequestPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = use(props.searchParams)
    const copyFromId = searchParams.copyFrom
    const [initialData, setInitialData] = useState<RequestFormValues | null>(null)
    const [isLoading, setIsLoading] = useState(!!copyFromId)

    useEffect(() => {
        if (copyFromId) {
            const fetchHistory = async () => {
                try {
                    const data = await getRequestById(Number(copyFromId))
                    if (data) {
                        // Convert nulls to undefined for Zod compatibility (Prisma returns null, Zod expects undefined for optional)
                        const safeData = Object.fromEntries(
                            Object.entries(data).map(([k, v]) => [k, v === null ? undefined : v])
                        )

                        // Clean data for a "new" request (clear IDs and statuses)
                        const cleanedData = {
                            ...safeData,
                            id: undefined,
                            managementNumber: "",
                            status: "PENDING" as const,
                            receivedAt: new Date(),
                            completedAt: null,
                            createdAt: undefined,
                            updatedAt: undefined,
                            customerName: data.customerName ?? "",
                            customerAddress: data.customerAddress ?? "",
                            reqAddr: data.reqAddr ?? "",
                            billingAddress: data.billingAddress ?? "",
                            isReported: false,
                            billingItems: data.billingItems.map((item: { name: string; unitPrice: number; quantity: number }) => ({
                                name: item.name,
                                unitPrice: item.unitPrice,
                                quantity: item.quantity
                            })),
                        }
                        setInitialData(cleanedData as any)
                    }
                } catch (error) {
                    console.error("Failed to fetch history:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchHistory()
        }
    }, [copyFromId])

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">データを読み込み中...</span>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {copyFromId ? "過去履歴から新規登録" : "新規依頼登録"}
                </h2>
                <p className="text-gray-500">
                    {copyFromId ? "過去の情報をコピーしました。必要に応じて修正して保存してください。" : "新しい案件情報を入力してください。"}
                </p>
            </div>

            <RequestForm
                initialData={initialData || undefined}
                onSubmit={async (data) => {
                    await createRequest(data)
                }}
            />
        </div>
    )
}
