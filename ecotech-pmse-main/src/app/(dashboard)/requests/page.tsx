import Link from "next/link"
import { getRequests } from "@/app/actions"
import { RequestSearch } from "@/components/RequestSearch"
import { RequestListHeader } from "@/components/RequestListHeader"
import { ReportedToggle } from "@/components/ReportedToggle"

export default async function RequestsPage(props: { searchParams: Promise<{ q?: string, reported?: string }> }) {
    const searchParams = await props.searchParams
    const query = searchParams.q
    const showReported = searchParams.reported === "true"
    const requests = await getRequests(query, showReported)

    return (
        <div className="space-y-6">
            <RequestListHeader />

            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
                <RequestSearch enableReportedFilter={true} />
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <div className="w-full overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-200 text-black font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">管理番号</th>
                                <th className="px-4 py-3">ステータス</th>
                                <th className="px-4 py-3">お客様名</th>
                                <th className="px-4 py-3">担当者</th>
                                <th className="px-4 py-3">依頼内容</th>
                                <th className="px-4 py-3">登録日</th>
                                <th className="px-4 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-black">
                                        依頼はまだありません。
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-gray-100">
                                        <td className="px-4 py-3 font-medium text-black">
                                            <Link href={`/requests/${request.id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                                {request.managementNumber || `#${request.id}`}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {request.status === 'COMPLETED' ? '完了' : '未完了'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{request.customerName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {request.assignedUser?.name || "-"}
                                        </td>
                                        <td className="px-4 py-3 truncate max-w-[200px]">{request.requestContent}</td>
                                        <td className="px-4 py-3 text-black">
                                            {request.createdAt.toLocaleDateString('ja-JP')}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ReportedToggle id={request.id} isReported={request.isReported} requestStatus={request.status} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    )
}
