import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { RequestForm } from "@/components/RequestForm"
import { type RequestFormValues } from "@/lib/schema"
import { updateRequest, getUserProfile } from "@/app/actions"
import { ReportView } from "@/components/ReportView"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function RequestPage(props: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ from?: string, q?: string, from_date?: string, to_date?: string }>
}) {
    const params = await props.params
    const searchParams = await props.searchParams
    const request = await prisma.request.findUnique({
        where: { id: parseInt(params.id) },
        include: { billingItems: true },
    })

    if (!request) {
        notFound()
    }

    const userProfile = await getUserProfile()

    return (
        <>
            <div className="mx-auto max-w-4xl print:hidden">
                {searchParams.from === 'tracking' && (
                    <Link
                        href={`/tracking?q=${encodeURIComponent(searchParams.q || '')}`}
                        className="mb-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        追跡履歴の結果に戻る
                    </Link>
                )}
                {searchParams.from === 'history' && (
                    <Link
                        href={`/history?q=${encodeURIComponent(searchParams.q || '')}&from=${searchParams.from_date || ''}&to=${searchParams.to_date || ''}`}
                        className="mb-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        詳細検索の結果に戻る
                    </Link>
                )}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-black">依頼詳細 <span className="text-black font-normal text-lg">{request.managementNumber || `#${request.id}`}</span></h2>
                </div>

                <RequestForm
                    initialData={{
                        ...request,
                        customerAddress: request.customerAddress || "",
                        reqAddr: request.reqAddr || "",
                        billingAddress: request.billingAddress || "",
                        receivedAt: request.receivedAt ? request.receivedAt.toISOString() : null,
                        completedAt: request.completedAt ? request.completedAt.toISOString() : null,
                    } as any}
                    isEditing
                    onSubmit={async (data) => {
                        "use server"
                        await updateRequest(request.id, data)
                    }}
                />
            </div>
            <ReportView data={request} userProfile={userProfile} />
        </>
    )
}
