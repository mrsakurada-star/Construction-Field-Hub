"use client"

import { useForm, useFieldArray, useWatch, Controller, type FieldErrors, type SubmitHandler, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { requestSchema, type RequestFormValues } from "@/lib/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTransition, useMemo, useState, useEffect, useRef } from "react"
import { MapPin, Printer, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { DatePicker } from "@/components/ui/date-picker-custom"
import { Autocomplete } from "@/components/ui/autocomplete"
import { formatZip, formatPhone, sanitizeAlphaNum, toFullWidth } from "@/lib/formatters"
import { getLatestDetails, getAssignableUsers } from "@/app/actions"
import { ZipAssistant } from "@/components/ZipAssistant"

interface RequestFormProps {
    initialData?: RequestFormValues & { id?: number; managementNumber?: string | null }
    onSubmit: (data: RequestFormValues) => Promise<void>
    isEditing?: boolean
}

export function RequestForm({ initialData, onSubmit, isEditing }: RequestFormProps) {
    const [isPending, startTransition] = useTransition()
    const [users, setUsers] = useState<{ id: string; name: string | null; email: string | null }[]>([])

    const defaultValues = useMemo(() => {
        if (!initialData) {
            return {
                status: "PENDING" as const,
                billingItems: [],
                receivedAt: new Date(),
            }
        }

        const safeData = { ...initialData };
        (Object.keys(safeData) as Array<keyof typeof safeData>).forEach((key) => {
            if (safeData[key] === null) {
                (safeData as Record<string, unknown>)[key] = ""
            }
        })

        return {
            ...safeData,
            receivedAt: initialData.receivedAt ? new Date(initialData.receivedAt) : null,
            completedAt: initialData.completedAt ? new Date(initialData.completedAt) : null,
        }
    }, [initialData])

    const form = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema) as unknown as Resolver<RequestFormValues>,
        defaultValues,
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "billingItems",
    })

    const watchedBillingItems = useWatch({
        control: form.control,
        name: "billingItems",
    })

    const watchedCustomerAddress1 = useWatch({
        control: form.control,
        name: "customerAddress1",
    })

    const watchedAssignedUserId = useWatch({
        control: form.control,
        name: "assignedUserId",
    })

    // Fetch assignable users
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentAssignedUserId = watchedAssignedUserId || initialData?.assignedUserId || null
            getAssignableUsers(watchedCustomerAddress1, currentAssignedUserId || undefined)
                .then(setUsers)
                .catch(console.error)
        }, 500)
        return () => clearTimeout(timer)
    }, [watchedCustomerAddress1, watchedAssignedUserId, initialData?.assignedUserId])

    const handleSubmit: SubmitHandler<RequestFormValues> = (data) => {
        startTransition(async () => {
            try {
                await onSubmit(data)
                toast.success(isEditing ? "更新しました" : "保存しました")
            } catch (error) {
                console.error(error)
                toast.error("エラーが発生しました")
            }
        })
    }

    const onInvalid = (errors: FieldErrors<RequestFormValues>) => {
        console.error("Validation Errors:", errors)
        toast.error("入力内容に誤りがあります")
    }

    // AutoKana
    type AutoKanaInstance = { getFurigana: () => string }
    const reqNameRef = useRef<AutoKanaInstance | null>(null)
    const customerNameRef = useRef<AutoKanaInstance | null>(null)
    const billingNameRef = useRef<AutoKanaInstance | null>(null)

    useEffect(() => {
        let isMounted = true;
        import("vanilla-autokana").then((AutoKana) => {
            if (!isMounted) return;
            reqNameRef.current = AutoKana.bind("#reqName", "#reqKana")
            customerNameRef.current = AutoKana.bind("#customerName", "#customerKana")
            billingNameRef.current = AutoKana.bind("#billingName", "#billingKana")
        }).catch(err => console.error("Failed to load AutoKana", err));
        return () => { isMounted = false };
    }, [])

    useEffect(() => {
        form.reset(defaultValues)
    }, [defaultValues, form])

    const handleKanaUpdate = (fieldName: keyof RequestFormValues, val: string) => {
        form.setValue(fieldName, val as any)
    }

    const handleSelectLatest = async (field: string, value: string, prefix: 'req' | 'customer' | 'billing') => {
        const details = await getLatestDetails(field, value)
        if (!details) return
        if (prefix === 'req') {
            form.setValue('reqZip', details.reqZip || '')
            form.setValue('reqAddr1', toFullWidth(details.reqAddr1 || details.reqAddr || ''))
            form.setValue('reqAddr2', toFullWidth(details.reqAddr2 || ''))
            form.setValue('reqTel', details.reqTel || '')
            form.setValue('reqFax', details.reqFax || '')
            form.setValue('reqMobile', details.reqMobile || '')
            form.setValue('reqEmail', details.reqEmail || '')
            form.setValue('reqKana', details.reqKana || '')
        } else if (prefix === 'customer') {
            form.setValue('customerZip', details.customerZip || '')
            form.setValue('customerAddress1', toFullWidth(details.customerAddress1 || details.customerAddress || ''))
            form.setValue('customerAddress2', toFullWidth(details.customerAddress2 || ''))
            form.setValue('customerTel1', details.customerTel1 || '')
            form.setValue('customerTel2', details.customerTel2 || '')
            form.setValue('customerEmail', details.customerEmail || '')
            form.setValue('customerKana', details.customerKana || '')
        }
    }

    const handleAddressLookup = async (zip: string, addrField: keyof RequestFormValues) => {
        const cleanZip = zip.replace(/[^0-9]/g, '')
        if (cleanZip.length !== 7) return
        try {
            const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanZip}`)
            const data = await response.json()
            if (data.results && data.results[0]) {
                const { address1, address2, address3 } = data.results[0]
                const fullAddr = `${address1}${address2}${address3}`
                form.setValue(addrField as any, toFullWidth(fullAddr))
            }
        } catch (error) {
            console.error("Address lookup failed", error)
        }
    }

    return (
        <div className="pdf-container pb-12 print:pb-0">
            {/* SCREEN NAVIGATION */}
            <div className="flex justify-end gap-2 mb-8 print:hidden">
                {isEditing && (
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        印刷 / PDF保存
                    </Button>
                )}
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit, onInvalid)} className="space-y-8 print:space-y-0">
                
                {/* PRINT ONLY HEADER */}
                <div className="hidden print:block mb-8 text-center relative border-b-2 border-black pb-2">
                    <h1 className="text-2xl font-bold tracking-widest">アフターサービス報告書</h1>
                    <div className="absolute right-0 bottom-2 text-xs">
                        管理番号: {initialData?.managementNumber || "未発行"}
                    </div>
                </div>

                {/* BASIC INFO (Technician & Date) */}
                <div className="flex flex-col gap-4 mb-8 print:flex-row print:justify-between print:mb-6">
                    <div className="flex gap-8">
                        <div className="space-y-2">
                            <Label>依頼日</Label>
                            <Controller
                                control={form.control}
                                name="receivedAt"
                                render={({ field }) => (
                                    <DatePicker date={field.value} setDate={field.onChange} />
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assignedUserId">担当者</Label>
                            <Controller
                                control={form.control}
                                name="assignedUserId"
                                render={({ field }) => (
                                    <div className="relative">
                                        <select
                                            id="assignedUserId"
                                            aria-label="担当者"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none print:border-none print:px-0"
                                            value={field.value || "unassigned"}
                                            onChange={(e) => field.onChange(e.target.value === "unassigned" ? null : e.target.value)}
                                        >
                                            <option value="unassigned">未割り当て</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>{user.name || user.email}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none print:hidden" />
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                    {/* Status for Screen Only */}
                    <div className="print:hidden">
                        <Label>ステータス</Label>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold w-fit ${
                            form.watch("status") === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {form.watch("status") === 'COMPLETED' ? '完了' : '対応中'}
                        </div>
                    </div>
                </div>

                {/* ROW 1: [Customer] | [Billing Target] */}
                <div className="space-y-8 md:space-y-0 print:print-flex-row print:space-x-8 mb-8">
                    {/* LEFT COLUMN: REQUEST SOURCE & CUSTOMER */}
                    <div className="flex-1 space-y-8 print:print-flex-col print:space-y-4">
                        {/* 依頼元情報 */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-none print:p-0 break-inside-avoid">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">依頼元情報</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-x-4 print:gap-y-1">
                                <div className="space-y-2">
                                    <Label htmlFor="reqName">名称</Label>
                                    <Autocomplete
                                        id="reqName" fieldName="reqName" value={form.watch("reqName") || ""}
                                        onChangeValue={(val) => {
                                            form.setValue("reqName", val)
                                            handleKanaUpdate("reqKana", val ? (reqNameRef.current?.getFurigana() || "") : "")
                                            handleSelectLatest("reqName", val, 'req')
                                        }}
                                        onInput={(e) => handleKanaUpdate("reqKana", e.currentTarget.value ? (reqNameRef.current?.getFurigana() || "") : "")}
                                    />
                                </div>
                                <div className="space-y-2"><Label htmlFor="reqKana">フリガナ</Label><Input id="reqKana" {...form.register("reqKana")} /></div>
                                <div className="space-y-2"><Label htmlFor="reqManager">担当者</Label><Input id="reqManager" {...form.register("reqManager")} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="reqZip">郵便番号</Label>
                                    <div className="flex gap-2">
                                        <Input id="reqZip" {...form.register("reqZip")} onBlur={(e) => form.setValue("reqZip", formatZip(e.target.value))} />
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleAddressLookup(form.getValues("reqZip") || "", "reqAddr1")}>検索</Button>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="reqAddr1">所在地①</Label>
                                    <Input id="reqAddr1" {...form.register("reqAddr1")} onBlur={(e) => form.setValue("reqAddr1", toFullWidth(e.target.value))} />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">{form.watch("reqAddr1")}</div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="reqAddr2">所在地②</Label>
                                    <Input id="reqAddr2" {...form.register("reqAddr2")} onBlur={(e) => form.setValue("reqAddr2", toFullWidth(e.target.value))} />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">{form.watch("reqAddr2")}</div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="reqTel">TEL</Label><Input id="reqTel" {...form.register("reqTel")} /></div>
                                <div className="space-y-2"><Label htmlFor="reqFax">FAX</Label><Input id="reqFax" {...form.register("reqFax")} /></div>
                            </div>
                        </div>

                        {/* お客様情報 */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-none print:p-0 break-inside-avoid">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">お客様情報</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-x-4 print:gap-y-1">
                                <div className="space-y-2">
                                    <Label htmlFor="customerName">名称 (必須)</Label>
                                    <Autocomplete
                                        id="customerName" fieldName="customerName" value={form.watch("customerName") || ""}
                                        onChangeValue={(val) => {
                                            form.setValue("customerName", val)
                                            handleKanaUpdate("customerKana", val ? (customerNameRef.current?.getFurigana() || "") : "")
                                            handleSelectLatest("customerName", val, 'customer')
                                        }}
                                        onInput={(e) => handleKanaUpdate("customerKana", e.currentTarget.value ? (customerNameRef.current?.getFurigana() || "") : "")}
                                    />
                                </div>
                                <div className="space-y-2"><Label htmlFor="customerKana">フリガナ</Label><Input id="customerKana" {...form.register("customerKana")} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerZip">郵便番号</Label>
                                    <div className="flex gap-2">
                                        <Input id="customerZip" {...form.register("customerZip")} onBlur={(e) => form.setValue("customerZip", formatZip(e.target.value))} />
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleAddressLookup(form.getValues("customerZip") || "", "customerAddress1")}>検索</Button>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="customerAddress1">所在地①</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-blue-600 p-0 text-xs print:hidden"
                                            onClick={() => {
                                                const addr = form.getValues("customerAddress1")
                                                if (addr) window.open(`https://map.yahoo.co.jp/search?q=${encodeURIComponent(addr)}`, '_blank')
                                            }}
                                        >
                                            <MapPin className="h-3 w-3 mr-1" /> Yahoo地図
                                        </Button>
                                    </div>
                                    <Input id="customerAddress1" {...form.register("customerAddress1")} onBlur={(e) => form.setValue("customerAddress1", toFullWidth(e.target.value))} />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">{form.watch("customerAddress1")}</div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="customerAddress2">所在地②</Label>
                                    <Input id="customerAddress2" {...form.register("customerAddress2")} onBlur={(e) => form.setValue("customerAddress2", toFullWidth(e.target.value))} />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">{form.watch("customerAddress2")}</div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="customerTel1">TEL①</Label><Input id="customerTel1" {...form.register("customerTel1")} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="customerTel2">TEL②</Label>
                                    <Input id="customerTel2" {...form.register("customerTel2")} className="print:hidden" />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">
                                        {form.watch("customerTel2")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: BILLING DESTINATION */}
                    <div className="flex-1 print:print-flex-col">
                        <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-none print:p-0 h-full break-inside-avoid">
                            <div className="flex items-center justify-between border-b pb-2 mb-4">
                                <h3 className="text-lg font-semibold border-none pb-0 mb-0">ご請求先</h3>
                                <div className="flex gap-2 print:hidden">
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                        form.setValue("billingName", form.getValues("reqName")); form.setValue("billingKana", form.getValues("reqKana"));
                                        form.setValue("billingZip", form.getValues("reqZip")); 
                                        form.setValue("billingAddress1", form.getValues("reqAddr1"));
                                        form.setValue("billingAddress2", form.getValues("reqAddr2"));
                                        form.setValue("billingTel", form.getValues("reqTel")); form.setValue("billingFax", form.getValues("reqFax"));
                                    }}>依頼元コピー</Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => {
                                        form.setValue("billingName", form.getValues("customerName")); form.setValue("billingKana", form.getValues("customerKana"));
                                        form.setValue("billingZip", form.getValues("customerZip")); 
                                        form.setValue("billingAddress1", form.getValues("customerAddress1"));
                                        form.setValue("billingAddress2", form.getValues("customerAddress2"));
                                        form.setValue("billingTel", form.getValues("customerTel1"));
                                    }}>お客様コピー</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-x-4 print:gap-y-1">
                                <div className="space-y-2"><Label htmlFor="billingName">名称</Label><Input id="billingName" {...form.register("billingName")} /></div>
                                <div className="space-y-2"><Label htmlFor="billingKana">フリガナ</Label><Input id="billingKana" {...form.register("billingKana")} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="billingZip">郵便番号</Label>
                                    <div className="flex gap-2">
                                        <Input id="billingZip" {...form.register("billingZip")} onBlur={(e) => form.setValue("billingZip", formatZip(e.target.value))} />
                                        <Button type="button" variant="outline" size="sm" onClick={() => handleAddressLookup(form.getValues("billingZip") || "", "billingAddress1")}>検索</Button>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="billingAddress1">所在地①</Label>
                                    <Input id="billingAddress1" {...form.register("billingAddress1")} onBlur={(e) => form.setValue("billingAddress1", toFullWidth(e.target.value))} />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">{form.watch("billingAddress1")}</div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="billingAddress2">所在地②</Label>
                                    <Input id="billingAddress2" {...form.register("billingAddress2")} onBlur={(e) => form.setValue("billingAddress2", toFullWidth(e.target.value))} />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">{form.watch("billingAddress2")}</div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="billingTel">TEL</Label><Input id="billingTel" {...form.register("billingTel")} /></div>
                                <div className="space-y-2"><Label htmlFor="billingFax">FAX</Label><Input id="billingFax" {...form.register("billingFax")} /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2: [Device / Request / Treatment] | [Billing Amount] */}
                <div className="space-y-8 md:space-y-0 print:print-flex-row print:space-x-8">
                    {/* LEFT COLUMN: DEVICE & REPORT */}
                    <div className="flex-1 space-y-8 print:print-flex-col print:space-y-4">
                        {/* 対象機器 */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-none print:p-0 break-inside-avoid">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">対象機器</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-x-4 print:gap-y-1">
                                <div className="space-y-2"><Label htmlFor="deviceManufacturer">メーカー</Label><Input id="deviceManufacturer" {...form.register("deviceManufacturer")} /></div>
                                <div className="space-y-2"><Label htmlFor="deviceModel">機種</Label><Input id="deviceModel" {...form.register("deviceModel")} /></div>
                                <div className="space-y-2"><Label htmlFor="gasType">ガス種</Label><Input id="gasType" {...form.register("gasType")} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="lotNumber">機器ロット</Label>
                                    <Input id="lotNumber" {...form.register("lotNumber")} className="print:hidden" />
                                    <div className="hidden print:block text-xs min-h-[1.2rem] border-b border-black">
                                        {form.watch("lotNumber")}
                                    </div>
                                </div>
                                <div className="space-y-2"><Label htmlFor="yearsUsed">使用年数</Label><Input id="yearsUsed" {...form.register("yearsUsed")} /></div>
                            </div>
                        </div>

                        {/* 依頼内容 */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-none print:p-0 break-inside-avoid">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">依頼内容</h3>
                            <Textarea id="requestContent" {...form.register("requestContent")} className="min-h-[60px] print:min-h-0" />
                        </div>

                        {/* 処置報告 */}
                        <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-none print:p-0 break-inside-avoid">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">処置報告</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-x-4 print:gap-y-1">
                                <div className="space-y-2">
                                    <Label>完了日</Label>
                                    <Controller
                                        control={form.control}
                                        name="completedAt"
                                        render={({ field }) => (
                                            <DatePicker date={field.value} setDate={field.onChange} />
                                        )}
                                    />
                                </div>
                                <div className="space-y-2"><Label htmlFor="orderNumber">注文番号</Label><Input id="orderNumber" {...form.register("orderNumber")} /></div>
                                <div className="col-span-2 space-y-2"><Label htmlFor="cause">原因</Label><Textarea id="cause" {...form.register("cause")} /></div>
                                <div className="col-span-2 space-y-2"><Label htmlFor="treatment">処置内容</Label><Textarea id="treatment" {...form.register("treatment")} /></div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: BILLING AMOUNT */}
                    <div className="flex-1 print:print-flex-col">
                        <div className="rounded-lg border bg-white p-6 shadow-sm print:shadow-none print:border-none print:p-0 h-full break-inside-avoid">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">ご請求金額</h3>
                            <div className="mb-4">
                                <Label htmlFor="pescManagementNumber">請求管理No.</Label>
                                <Input id="pescManagementNumber" {...form.register("pescManagementNumber")} />
                            </div>

                            {/* Billing Table */}
                            <div className="space-y-2 print:space-y-1">
                                <div className="grid grid-cols-[1fr_80px_40px_80px_30px] gap-2 font-medium text-xs border-b pb-1 print:grid-cols-[1fr_60px_40px_60px]">
                                    <div>特記事項・品名</div><div>単価</div><div>数量</div><div>金額</div><div className="print:hidden"></div>
                                </div>
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-[1fr_80px_40px_80px_30px] gap-2 items-center border-b border-gray-100 py-1 print:grid-cols-[1fr_60px_40px_60px] print:border-black/10">
                                        <Input {...form.register(`billingItems.${index}.name`)} className="text-xs print:border-none" />
                                        <Input type="number" {...form.register(`billingItems.${index}.unitPrice`, { valueAsNumber: true })} className="text-xs text-right print:border-none" />
                                        <Input type="number" {...form.register(`billingItems.${index}.quantity`, { valueAsNumber: true })} className="text-xs text-right print:border-none" />
                                        <div className="text-right text-xs">
                                            {((watchedBillingItems?.[index]?.unitPrice || 0) * (watchedBillingItems?.[index]?.quantity || 0)).toLocaleString()}
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 print:hidden" onClick={() => remove(index)}>×</Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", unitPrice: 0, quantity: 1 })} className="mt-2 text-xs print:hidden">+ 明細追加</Button>

                                {/* Totals Block */}
                                <div className="mt-6 space-y-1 border-t-2 border-black pt-2 flex flex-col items-end">
                                    <div className="flex justify-between w-40 text-xs"><span>小計</span><span>{(watchedBillingItems || []).reduce((s, i) => s + ((i.unitPrice || 0) * (i.quantity || 0)), 0).toLocaleString()} 円</span></div>
                                    <div className="flex justify-between w-40 text-xs border-b"><span>消費税(10%)</span><span>{Math.floor((watchedBillingItems || []).reduce((s, i) => s + ((i.unitPrice || 0) * (i.quantity || 0)), 0) * 0.1).toLocaleString()} 円</span></div>
                                    <div className="flex justify-between w-40 font-bold text-sm pt-1"><span>合計</span><span>{(Math.floor((watchedBillingItems || []).reduce((s, i) => s + ((i.unitPrice || 0) * (i.quantity || 0)), 0) * 1.1)).toLocaleString()} 円</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FORM BUTTONS (Screen Only) */}
                <div className="flex justify-end gap-4 pt-12 print:hidden">
                    <Button type="submit" disabled={isPending} className="w-32">
                        {isPending ? "保存中..." : (isEditing ? "更新" : "保存")}
                    </Button>
                    {isEditing && (
                        <Button
                            type="submit" variant="default" className="bg-green-600 hover:bg-green-700"
                            onClick={() => { form.setValue('status', 'COMPLETED'); if (!form.getValues('completedAt')) form.setValue('completedAt', new Date()); }}
                            disabled={isPending}
                        >完了保存</Button>
                    )}
                </div>
            </form>
        </div>
    )
}
