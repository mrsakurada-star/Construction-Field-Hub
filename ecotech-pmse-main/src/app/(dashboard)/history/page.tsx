import { prisma } from "@/lib/prisma"
import { type Prisma } from "@prisma/client"
import Link from "next/link"
import { RequestSearch } from "@/components/RequestSearch"

async function searchRequests(query: string, from?: string, to?: string) {
    "use server"

    // Base conditions
    const andConditions: Prisma.RequestWhereInput[] = []

    // Text Search
    if (query) {
        const terms = query.trim().split(/\s+/)
        if (terms.length > 0) {
            andConditions.push(...terms.map((term: string) => ({
                OR: [
                    { managementNumber: { contains: term } },
                    { customerName: { contains: term } },
                    { primeName: { contains: term } },
                    { reqName: { contains: term } },
                    { deviceModel: { contains: term } },
                    { requestContent: { contains: term } },
                    { treatment: { contains: term } },
                    { customerTel1: { contains: term } },
                    { customerTel2: { contains: term } },
                    { primeTel: { contains: term } },
                    { primeMobile: { contains: term } },
                    { reqTel: { contains: term } },
                    { reqMobile: { contains: term } },
                    { billingTel: { contains: term } },
                ]
            })))
        }
    }

    // Date Range Search (completedAt)
    if (from || to) {
        const dateFilter: Prisma.DateTimeFilter = {}
        if (from) dateFilter.gte = new Date(from)
        if (to) {
            // Include the entire end day
            const endDate = new Date(to)
            endDate.setHours(23, 59, 59, 999)
            dateFilter.lte = endDate
        }
        andConditions.push({ completedAt: dateFilter })
    }

    const where: Prisma.RequestWhereInput = {
        status: "COMPLETED",
        AND: andConditions
    }

    // If no filters at all, just return empty? Or maybe latest?
    // User expectation: if search bar empty but date selected -> show results in date.
    // So we proceed if query OR from OR to.
    if (!query && !from && !to) return []

    return prisma.request.findMany({
        where,
        orderBy: { updatedAt: "desc" }
    })
}


async function getLatestHistory() {
    "use server"
    return prisma.request.findMany({
        where: { status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        take: 3
    })
}

export default async function HistoryPage(props: { searchParams: Promise<{ q?: string, from?: string, to?: string }> }) {
    const searchParams = await props.searchParams
    const query = searchParams.q || ""
    const from = searchParams.from
    const to = searchParams.to

    // If any search param exists, use search logic
    const isSearch = !!query || !!from || !!to
    const results = isSearch ? await searchRequests(query, from, to) : await getLatestHistory()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-black">訪問履歴検索</h2>
                <p className="text-sm text-black">完了した案件を検索します</p>
            </div>

            <div className="rounded-md border bg-white p-6 shadow-sm">
                <RequestSearch enableDateFilter />
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                    {isSearch ? `検索結果: ${results.length} 件` : "直近の訪問 (最新3件)"}
                </h3>
                <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-200 text-black font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">管理番号</th>
                                <th className="px-4 py-3">お客様名</th>
                                <th className="px-4 py-3">機種</th>
                                <th className="px-4 py-3">依頼内容</th>
                                <th className="px-4 py-3">処置内容</th>
                                <th className="px-4 py-3">完了日</th>
                                <th className="px-4 py-3">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {results.length === 0 ? (
                                <tr><td colSpan={7} className="p-4 text-center text-black">
                                    {isSearch ? "該当する履歴がありません" : "履歴がありません"}
                                </td></tr>
                            ) : (
                                results.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-100">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span>{r.managementNumber || `#${r.id}`}</span>
                                                {r.isReported && (
                                                    <span className="bg-orange-100 text-orange-700 text-[9px] px-1 py-0 rounded font-bold border border-orange-200">報告済</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{r.customerName}</td>
                                        <td className="px-4 py-3">{r.deviceModel}</td>
                                        <td className="px-4 py-3 truncate max-w-[150px]">{r.requestContent}</td>
                                        <td className="px-4 py-3 truncate max-w-[150px]">{r.treatment}</td>
                                        <td className="px-4 py-3 text-black">{r.updatedAt.toLocaleDateString('ja-JP')}</td>
                                        <td className="px-4 py-3">
                                            <Link href={`/requests/${r.id}?from=history&q=${encodeURIComponent(query)}&from_date=${from || ''}&to_date=${to || ''}`} className="text-indigo-600 hover:underline">詳細</Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
