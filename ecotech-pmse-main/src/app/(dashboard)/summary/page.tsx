import { getMonthlyStats, getTrendAnalysis } from "@/app/actions"
import React from "react"
import { Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SummaryPage() {
    const stats = await getMonthlyStats()
    const trends = await getTrendAnalysis()

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-black">訪問内容まとめ</h2>
                    <p className="text-sm text-black">月ごとの訪問実績（有償・無償）を集計します</p>
                </div>

                <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-black font-semibold border-b">
                            <tr>
                                <th className="px-6 py-3 border-r md:w-1/4">対象月</th>
                                <th className="px-6 py-3 border-r md:w-1/4">訪問件数 (総計)</th>
                                <th className="px-6 py-3 border-r md:w-1/4">有償件数</th>
                                <th className="px-6 py-3 md:w-1/4">無償件数</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {stats.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        完了した訪問データがまだありません。
                                    </td>
                                </tr>
                            ) : (
                                stats.map((stat) => (
                                    <tr key={stat.month} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-black border-r">
                                            {stat.month}
                                        </td>
                                        <td className="px-6 py-4 text-black font-medium border-r">
                                            {stat.total} 件
                                        </td>
                                        <td className="px-6 py-4 text-orange-600 font-medium border-r">
                                            {stat.paid} 件
                                        </td>
                                        <td className="px-6 py-4 text-blue-600 font-medium">
                                            {stat.free} 件
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.length > 0 && (
                        <>
                            <div className="p-6 bg-white border rounded-lg shadow-sm">
                                <div className="text-sm font-medium text-gray-500">総訪問件数 (全期間)</div>
                                <div className="mt-2 text-3xl font-bold text-black">
                                    {stats.reduce((acc, curr) => acc + curr.total, 0)} <span className="text-sm font-normal text-gray-500">件</span>
                                </div>
                            </div>
                            <div className="p-6 bg-white border rounded-lg shadow-sm">
                                <div className="text-sm font-medium text-gray-500">有償対応率 (平均)</div>
                                <div className="mt-2 text-3xl font-bold text-orange-600">
                                    {(() => {
                                        const total = stats.reduce((acc, curr) => acc + curr.total, 0)
                                        const paid = stats.reduce((acc, curr) => acc + curr.paid, 0)
                                        return total > 0 ? Math.round((paid / total) * 100) : 0
                                    })()}%
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {/* Paid Trends */}
                <div className="rounded-lg border bg-white shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-orange-600">有償案件の傾向 (Top 5 要因・処置)</h3>

                    {/* AI Analysis Block */}
                    <div className="p-4 bg-orange-50 rounded-md border border-orange-100">
                        <div className="flex items-center gap-2 mb-2 text-orange-800 font-semibold text-sm">
                            <Sparkles className="w-4 h-4" />
                            AI 分析結果
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">
                            {trends.paid.analysis}
                        </p>
                    </div>

                    {trends.paid.items.length === 0 ? (
                        <p className="text-sm text-gray-500">データがありません</p>
                    ) : (
                        <ul className="space-y-3">
                            {trends.paid.items.map((item, i) => (
                                <li key={i} className="flex justify-between items-center border-b pb-2 last:border-0 border-gray-100">
                                    <span className="font-medium text-gray-700">{i + 1}. {item.name}</span>
                                    <span className="font-bold text-gray-900">{item.count} 件</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Free Trends */}
                <div className="rounded-lg border bg-white shadow-sm p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-blue-600">無償案件の傾向 (Top 5 要因・処置)</h3>

                    {/* AI Analysis Block */}
                    <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
                        <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold text-sm">
                            <Sparkles className="w-4 h-4" />
                            AI 分析結果
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">
                            {trends.free.analysis}
                        </p>
                    </div>

                    {trends.free.items.length === 0 ? (
                        <p className="text-sm text-gray-500">データがありません</p>
                    ) : (
                        <ul className="space-y-3">
                            {trends.free.items.map((item, i) => (
                                <li key={i} className="flex justify-between items-center border-b pb-2 last:border-0 border-gray-100">
                                    <span className="font-medium text-gray-700">{i + 1}. {item.name}</span>
                                    <span className="font-bold text-gray-900">{item.count} 件</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
