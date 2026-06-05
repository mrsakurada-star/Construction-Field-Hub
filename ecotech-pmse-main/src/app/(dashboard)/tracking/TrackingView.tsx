"use client"

import { RequestSearch } from "@/components/RequestSearch"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { type Request, type BillingItem } from "@prisma/client"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

interface TrackingViewProps {
    query: string
    results: (Request & { billingItems: BillingItem[] })[]
}

export function TrackingView({ query, results }: TrackingViewProps) {
    const handlePrint = () => {
        window.print()
    }

    // Determine the primary/anchor record for comparison (the latest one)
    const anchor = results.length > 0 ? results[results.length - 1] : null;

    // Helper to get match indicators relative to the latest record
    const getMatchMarkers = (r: Request) => {
        if (!anchor || r.id === anchor.id) return [];
        const markers: { label: string, color: string }[] = [];

        const sameName = r.customerName === anchor.customerName;
        // Check if any of the phones match
        const rTels = [r.customerTel1, r.customerTel2].filter(Boolean);
        const aTels = [anchor.customerTel1, anchor.customerTel2].filter(Boolean);
        const sameTel = rTels.some(t => aTels.includes(t));

        const sameAddr = r.customerAddress === anchor.customerAddress;
        const sameDevice = r.deviceModel === anchor.deviceModel && r.lotNumber === anchor.lotNumber && r.lotNumber;

        if (sameName) markers.push({ label: "名称一致", color: "bg-blue-100 text-blue-700" });
        if (sameTel) markers.push({ label: "電話一致", color: "bg-green-100 text-green-700" });
        if (sameAddr) markers.push({ label: "住所一致", color: "bg-orange-100 text-orange-700" });
        if (sameDevice) markers.push({ label: "同機器・ロット", color: "bg-purple-100 text-purple-700" });

        // Contextual analysis
        if (sameAddr && !sameName) {
            markers.push({ label: "居住者変更の可能性", color: "bg-red-50 text-red-600 border border-red-100" });
        }
        if (sameName && !sameAddr) {
            markers.push({ label: "転居の可能性", color: "bg-slate-100 text-slate-600 border border-slate-200" });
        }

        return markers;
    };

    const getFieldComparison = (r: Request) => {
        if (!anchor) return [];
        const rTels = [r.customerTel1, r.customerTel2].filter(Boolean);
        const aTels = [anchor.customerTel1, anchor.customerTel2].filter(Boolean);

        return [
            {
                label: "名称",
                value: r.customerName || "-",
                match: r.customerName === anchor.customerName
            },
            {
                label: "電話",
                value: r.customerTel1 || r.customerTel2 || "-",
                match: rTels.some(t => aTels.includes(t))
            },
            {
                label: "住所",
                value: r.customerAddress || "-",
                match: r.customerAddress === anchor.customerAddress
            },
            {
                label: "機器/LOT",
                value: `${r.deviceModel || "-"} (${r.lotNumber || "-"})`,
                match: r.deviceModel === anchor.deviceModel && r.lotNumber === anchor.lotNumber
            },
        ];
    };

    return (
        <div className="space-y-6 pb-12 print:pb-0 print:space-y-4">
            <div className="print:hidden">
                <h2 className="text-2xl font-bold text-black">追跡履歴検索</h2>
                <p className="text-sm text-gray-600">電話番号または住所で同一のお客様と思われる過去の依頼を時系列に表示します。</p>
            </div>

            <div className="rounded-md border bg-white p-6 shadow-sm print:hidden">
                <RequestSearch />
                <p className="text-xs text-gray-400 mt-2">※名前に加え、電話番号や住所の一部でも検索可能です。</p>
            </div>

            {query && (
                <div className="space-y-6 mt-8 print:mt-0 print:space-y-4">
                    <div className="border-b pb-4 flex items-end justify-between print:border-black print:pb-2">
                        <div>
                            <h3 className="text-lg font-semibold print:text-base">
                                追跡レポート: <span className="text-indigo-600 print:text-black">「{query}」</span>
                            </h3>
                            {anchor && (
                                <div className="mt-2 text-sm text-gray-700 print:mt-1 print:text-xs">
                                    <p className="font-bold">現在の登録情報: {anchor.customerName} 様</p>
                                    <p className="text-xs text-gray-500 print:text-black">最新住所: 〒{anchor.customerZip} {anchor.customerAddress}</p>
                                </div>
                            )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            <span className="text-xs text-gray-400 print:text-black print:text-[10px]">全 {results.length} 件の記録</span>
                            <button
                                onClick={handlePrint}
                                className="text-xs font-normal text-blue-600 hover:underline print:hidden transition-colors"
                            >
                                レポートを印刷
                            </button>
                        </div>
                    </div>

                    {results.length === 0 ? (
                        <p className="text-center py-12 text-gray-500 bg-white rounded-lg border print:py-4">一致するデータが見つかりませんでした。</p>
                    ) : (
                        <div className="relative border-l-2 border-indigo-100 ml-4 pl-6 space-y-8 print:ml-2 print:pl-4 print:space-y-4 print:border-gray-300">
                            {results.map((r) => {
                                const subtotal = r.billingItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
                                const tax = Math.floor(subtotal * 0.1);
                                const total = subtotal + tax;

                                return (
                                    <div key={r.id} className="relative print:break-inside-avoid">
                                        {/* Timeline Marker (Hidden or simplified for print) */}
                                        <div className="absolute -left-[33px] top-4 h-4 w-4 rounded-full border-2 border-indigo-500 bg-white print:border-gray-400 print:-left-[21px] print:h-3 print:w-3" />

                                        <div className="bg-white p-5 rounded-lg border shadow-sm print:shadow-none print:border-gray-200 print:p-3">
                                            {/* Compact Header */}
                                            <div className="flex justify-between items-center mb-3 border-b pb-2 print:mb-2 print:pb-1">
                                                <div className="flex items-baseline gap-3">
                                                    <h4 className="text-lg font-bold text-black print:text-sm">
                                                        {r.receivedAt ? format(new Date(r.receivedAt), "yyyy/MM/dd", { locale: ja }) : "不明"}
                                                    </h4>
                                                    <span className="text-[10px] font-mono text-gray-400">#{r.managementNumber || r.id}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'} print:border print:border-gray-300 print:text-black`}>
                                                        {r.status === 'COMPLETED' ? '完了' : '対応中'}
                                                    </span>
                                                    {r.isReported && (
                                                        <span className="bg-orange-50 text-orange-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-orange-200 print:text-black print:border-gray-300">報告済</span>
                                                    )}
                                                    <Link
                                                        href={`/requests/${r.id}?from=tracking&q=${encodeURIComponent(query)}`}
                                                        className="text-indigo-600 hover:text-indigo-800 transition-colors p-1 rounded hover:bg-indigo-50 print:hidden"
                                                        title="詳細・編集を開く"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </div>

                                            {/* Match Indicators */}
                                            <div className="flex flex-wrap gap-1 mb-2 print:mb-1">
                                                {r.id === anchor?.id ? (
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white print:border print:border-black print:text-black print:bg-white">最新の依頼 (基準)</span>
                                                ) : (
                                                    getMatchMarkers(r).map((m, idx) => (
                                                        <span key={idx} className={`px-2 py-0.5 rounded text-[9px] font-bold ${m.color} print:bg-white print:border print:border-gray-300 print:text-black`}>
                                                            {m.label}
                                                        </span>
                                                    ))
                                                )}
                                            </div>

                                            {/* Detailed Comparison Table */}
                                            {r.id !== anchor?.id && (
                                                <div className="mb-4 bg-gray-50 rounded p-2 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 print:bg-white print:mb-2 print:p-1">
                                                    {getFieldComparison(r).map((cmp, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-[10px]">
                                                            <span className="text-gray-400 font-bold min-w-[45px] leading-relaxed">[{cmp.label}]</span>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    {cmp.match ? (
                                                                        <span className="text-green-600 font-bold whitespace-nowrap">● 一致</span>
                                                                    ) : (
                                                                        <span className="text-orange-500 font-bold whitespace-nowrap">✖ 不一致</span>
                                                                    )}
                                                                    <span className={`${cmp.match ? 'text-gray-600' : 'text-orange-700 font-semibold'} break-all`}>
                                                                        {cmp.value}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Tighter Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 print:gap-2">
                                                {/* Device & Content (4 cols) */}
                                                <div className="md:col-span-4 space-y-2">
                                                    <div className="text-[10px] font-bold text-gray-400 print:text-black border-l-2 border-gray-300 pl-2 py-0.5">機器・依頼</div>
                                                    <div className="text-[11px] space-y-0.5 print:text-[10px]">
                                                        <p><span className="text-gray-500">機種:</span> {r.deviceModel || "-"}</p>
                                                        <p className="text-gray-700 leading-tight italic mt-1 line-clamp-3 print:line-clamp-none">「{r.requestContent}」</p>
                                                    </div>
                                                </div>

                                                {/* Treatment (5 cols) */}
                                                <div className="md:col-span-5 space-y-2">
                                                    <div className="text-[10px] font-bold text-indigo-400 print:text-black border-l-2 border-indigo-400 print:border-black pl-2 py-0.5">訪問記録 (原因・処置)</div>
                                                    <div className="text-[11px] space-y-1 print:text-[10px]">
                                                        <div><span className="text-indigo-600 font-semibold print:text-black">原因:</span> {r.cause || "記載なし"}</div>
                                                        <div><span className="text-indigo-600 font-semibold print:text-black">処置:</span> {r.treatment || "記載なし"}</div>
                                                    </div>
                                                </div>

                                                {/* Billing (3 cols) */}
                                                <div className="md:col-span-3 space-y-2">
                                                    <div className="text-[10px] font-bold text-gray-400 print:text-black border-l-2 border-gray-300 pl-2 py-0.5">請求内訳</div>
                                                    <div className="bg-gray-50 rounded p-2 print:bg-white print:p-0">
                                                        <table className="w-full text-[10px]">
                                                            <tbody className="divide-y divide-gray-200">
                                                                {r.billingItems.slice(0, 3).map((item, i) => (
                                                                    <tr key={i}>
                                                                        <td className="py-0.5 truncate max-w-[60px]">{item.name}</td>
                                                                        <td className="py-0.5 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                                                    </tr>
                                                                ))}
                                                                {r.billingItems.length > 3 && (
                                                                    <tr><td colSpan={2} className="text-[8px] text-gray-400 pt-0.5">他 {r.billingItems.length - 3} 件...</td></tr>
                                                                )}
                                                            </tbody>
                                                            <tfoot className="border-t border-gray-300 font-bold">
                                                                <tr>
                                                                    <td className="pt-1">合計</td>
                                                                    <td className="pt-1 text-right text-indigo-600 print:text-black">¥{total.toLocaleString()}</td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
