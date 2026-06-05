import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { QRCodeSVG } from "qrcode.react"

import { type Request, type BillingItem } from "@prisma/client"

interface ReportViewProps {
    data: Request & { billingItems: BillingItem[], sitePhotoUrl?: string | null }
    userProfile?: {
        name: string | null
        affiliation: string | null
        zip: string | null
        address: string | null
        phoneNumber: string | null
        fax?: string | null
    } | null
}

export function ReportView({ data, userProfile }: ReportViewProps) {
    const subtotal = data.billingItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;

    return (
        <div className="hidden print:block print:w-[210mm] print:h-[297mm] bg-white text-black p-8 text-sm leading-tight">
            {/* A4 Header */}
            <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-4">
                <h1 className="text-2xl font-bold">アフターサービス作業報告書</h1>
                <div className="text-right text-xs space-y-0.5">
                    <p>管理番号: {data.managementNumber || data.id}</p>
                    <p>依頼日: {data.receivedAt ? format(new Date(data.receivedAt), "yyyy年MM月dd日", { locale: ja }) : ""}</p>
                    <p>完了日: {data.completedAt ? format(new Date(data.completedAt), "yyyy年MM月dd日", { locale: ja }) : ""}</p>

                </div>
            </div>

            {/* 1. Requester Info */}
            <div className="border border-black mb-4 p-2">
                <h3 className="font-bold border-b border-black mb-2 bg-gray-100">【依頼元情報】</h3>
                <div className="grid grid-cols-[70px_1fr] gap-1">
                    <span className="font-semibold">名称:</span>
                    <span>
                        {data.reqKana ? (
                            <ruby>
                                {data.reqName}
                                <rt className="text-[0.6rem]">{data.reqKana}</rt>
                            </ruby>
                        ) : (
                            data.reqName
                        )}
                        {data.reqManager && <span className="ml-2 text-xs">({data.reqManager})</span>}
                    </span>
                    <span className="font-semibold">ご住所:</span>
                    <span>
                        〒{data.reqZip}<br />
                        {data.reqAddr}
                    </span>
                    <span className="font-semibold">電話番号:</span>
                    <span>{data.reqTel}</span>
                    <span className="font-semibold">FAX:</span>
                    <span>{data.reqFax}</span>
                </div>
            </div>

            {/* 2. Customer & Device Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Left: Customer Info */}
                <div className="border border-black p-2">
                    <h3 className="font-bold border-b border-black mb-2 bg-gray-100">【お客様情報】</h3>
                    <div className="grid grid-cols-[70px_1fr] gap-1">
                        <span className="font-semibold">お名前:</span>
                        <span>
                            {data.customerKana ? (
                                <ruby>
                                    {data.customerName}
                                    <rt className="text-[0.6rem] text-left">{data.customerKana}</rt>
                                </ruby>
                            ) : (
                                data.customerName
                            )} 様
                        </span>
                        <span className="font-semibold">ご住所:</span>
                        <span>
                            〒{data.customerZip}<br />
                            {data.customerAddress}
                        </span>
                        <span className="font-semibold">電話番号:</span>
                        <span>{data.customerTel1} {data.customerTel2 ? `/ ${data.customerTel2}` : ""}</span>
                    </div>
                </div>

                {/* Right: Device Info */}
                <div className="border border-black p-2">
                    <h3 className="font-bold border-b border-black mb-2 bg-gray-100">【対象機器】</h3>
                    <div className="grid grid-cols-[70px_1fr] gap-1">
                        <span className="font-semibold">メーカー:</span><span>{data.deviceManufacturer}</span>
                        <span className="font-semibold">機種:</span><span>{data.deviceModel}</span>
                        <span className="font-semibold">ガス種:</span><span>{data.gasType}</span>
                        <span className="font-semibold">機器ロット:</span><span>{data.lotNumber}</span>

                    </div>
                </div>
            </div>

            {/* Request Content */}
            <div className="border border-black mb-4 p-2">
                <h3 className="font-bold border-b border-black mb-2 bg-gray-100">【依頼内容】</h3>
                <p className="whitespace-pre-wrap min-h-[40px]">{data.requestContent}</p>
            </div>

            {/* Visit / Treatment */}
            <div className="border border-black mb-4 p-2">
                <h3 className="font-bold border-b border-black mb-2 bg-gray-100">【処置報告】</h3>
                <div className="grid grid-cols-[70px_1fr] gap-2 mb-2">
                    <span className="font-semibold">注文番号:</span>
                    <span>{data.orderNumber}</span>
                </div>
                <div className="mb-2">
                    <h4 className="font-semibold decoration-dotted underline mb-1">原因</h4>
                    <p className="whitespace-pre-wrap min-h-[40px] mb-2">{data.cause}</p>
                </div>
                <div>
                    <h4 className="font-semibold decoration-dotted underline mb-1">処置内容</h4>
                    <p className="whitespace-pre-wrap min-h-[80px]">{data.treatment}</p>
                </div>
            </div>

            {/* Billing Section (Grid: Left=Address, Right=Items) */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* Billing Address */}
                <div className="border border-black p-2">
                    <h3 className="font-bold border-b border-black mb-2 bg-gray-100">【ご請求先】</h3>
                    <div className="grid grid-cols-[70px_1fr] gap-1">
                        <span className="font-semibold">名称:</span>
                        <span>
                            {data.billingKana ? (
                                <ruby>
                                    {data.billingName}
                                    <rt className="text-[0.6rem]">{data.billingKana}</rt>
                                </ruby>
                            ) : (
                                data.billingName
                            )}
                        </span>
                        <span className="font-semibold">ご住所:</span>
                        <span>
                            〒{data.billingZip}<br />
                            {data.billingAddress}
                        </span>
                        <span className="font-semibold">電話番号:</span>
                        <span>{data.billingTel}</span>
                    </div>
                </div>

                {/* Billing Items Table */}
                <div className="border border-black p-2">
                    <h3 className="font-bold border-b border-black mb-2 bg-gray-100">【ご請求金額】</h3>

                    {data.pescManagementNumber && (
                        <div className="mb-2 text-xs text-right">
                            <span className="font-semibold">請求管理No.:</span>
                            <span className="ml-1">{data.pescManagementNumber}</span>
                        </div>
                    )}

                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-black text-center">
                                <th className="text-left w-1/2">品名</th>
                                <th className="w-1/6">単価</th>
                                <th className="w-1/6">数量</th>
                                <th className="w-1/6">金額</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.billingItems.map((item, i) => (
                                <tr key={i} className="border-b border-gray-300">
                                    <td className="py-1">{item.name}</td>
                                    <td className="text-right">{item.unitPrice.toLocaleString()}</td>
                                    <td className="text-center">{item.quantity}</td>
                                    <td className="text-right">{(item.unitPrice * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                            {/* Fill empty rows to maintain height if needed, keeping simple for now */}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-black font-semibold">
                                <td colSpan={3} className="text-right pr-2 pt-2">小計</td>
                                <td className="text-right pt-2">{subtotal.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="text-right pr-2">消費税</td>
                                <td className="text-right">{tax.toLocaleString()}</td>
                            </tr>
                            <tr className="text-lg font-bold">
                                <td colSpan={3} className="text-right pr-2">合計</td>
                                <td className="text-right">{total.toLocaleString()} 円</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Footer / Signatures */}


            {/* Footer / Signatures */}
            <div className="mt-4 border-t border-black pt-2 flex items-end justify-between">
                {/* QR Code Section */}
                <div className="w-[80px]">
                    {data.sitePhotoUrl && (
                        <div className="flex flex-col items-center">
                            <QRCodeSVG value={data.sitePhotoUrl} size={64} />
                            <span className="text-[0.6rem] mt-1">現場写真</span>
                        </div>
                    )}
                </div>

                {/* Company Info */}
                <div className="text-right text-xs text-black leading-relaxed">
                    {userProfile ? (
                        <>
                            <p className="font-bold text-sm">
                                {userProfile.affiliation || ""}
                            </p>
                            {userProfile.zip && userProfile.address && (
                                <p>〒{userProfile.zip} {userProfile.address}</p>
                            )}
                            <p>
                                {userProfile.phoneNumber && `TEL: ${userProfile.phoneNumber}`}
                                {userProfile.phoneNumber && userProfile.fax && " / "}
                                {userProfile.fax && `FAX: ${userProfile.fax}`}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-sm">株式会社パーパスエコテック</p>
                            <p>〒010-0973 秋田県秋田市八橋本町3-20-36 M2ビル1F</p>
                            <p>TEL: 018-883-0866 / FAX: 018-864-3052</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
