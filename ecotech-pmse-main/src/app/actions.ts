"use server"
// Trigger rebuild

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requestSchema, RequestFormValues } from "@/lib/schema"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"
import { sendAreaNotification } from "@/lib/email"

export async function getRequests(query?: string, showReported: boolean = false) {
    let where: Prisma.RequestWhereInput = {}

    const conditions: Prisma.RequestWhereInput[] = []

    // 1. Area Filtering
    const userAreas = await getUserAreas()
    if (userAreas.length > 0) {
        const areaFilters: Prisma.RequestWhereInput[] = []
        for (const area of userAreas) {
            const cities = area.cities ? JSON.parse(area.cities) as string[] : []
            if (cities.length === 0) {
                // Whole prefecture
                areaFilters.push({
                    customerAddress: { startsWith: area.prefecture }
                })
            } else {
                // Specific cities in prefecture
                // Address must start with prefecture AND contain one of the cities
                areaFilters.push({
                    AND: [
                        { customerAddress: { startsWith: area.prefecture } },
                        {
                            OR: cities.map(city => ({
                                customerAddress: { contains: city }
                            }))
                        }
                    ]
                })
            }
        }
        if (areaFilters.length > 0) {
            conditions.push({ OR: areaFilters })
        }
    }

    // Default: hide reported items
    if (!showReported) {
        conditions.push({ isReported: false })
    }

    if (query) {
        const terms = query.trim().split(/\s+/)
        if (terms.length > 0) {
            conditions.push({
                AND: terms.map(term => ({
                    OR: [
                        // Identifiers & Names
                        { managementNumber: { contains: term } },
                        { customerName: { contains: term } },
                        { orderNumber: { contains: term } },

                        // Device & Content
                        { deviceModel: { contains: term } },
                        { requestContent: { contains: term } },

                        // Phone Numbers
                        { customerTel1: { contains: term } },
                        { customerTel2: { contains: term } },
                        { primeTel: { contains: term } },
                        { primeMobile: { contains: term } },
                        { reqTel: { contains: term } },
                        { reqMobile: { contains: term } },
                        { billingTel: { contains: term } },
                    ]
                }))
            })
        }
    }

    if (conditions.length > 0) {
        where = { AND: conditions }
    }

    const requests = await prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            billingItems: true,
            assignedUser: {
                select: {
                    name: true,
                    email: true
                }
            }
        },
    })
    return requests
}

export async function getUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true
        },
        orderBy: {
            name: "asc"
        }
    })
}

export async function getAssignableUsers(address?: string, includeUserId?: string) {
    if (!address) {
        return getUsers()
    }

    // 1. Get all users with their areas
    const usersWithAreas = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            areas: true
        },
        orderBy: {
            name: "asc"
        }
    })

    // 2. Filter in memory
    const filtered = usersWithAreas.filter(user => {
        // Always include the specific user if requested
        if (includeUserId && user.id === includeUserId) return true

        if (!user.areas || user.areas.length === 0) return false

        return user.areas.some(area => {
            // Check Prefecture
            if (!address.startsWith(area.prefecture)) return false

            const cities = area.cities ? JSON.parse(area.cities) as string[] : []
            
            // If specific cities are defined, address must contain one of them
            if (cities.length > 0) {
                return cities.some(city => address.includes(city))
            }

            // If no cities defined, they cover the whole prefecture
            return true
        })
    })

    return filtered.map(u => ({ id: u.id, name: u.name, email: u.email }))
}

export async function createRequest(data: RequestFormValues) {
    try {
        const validated = requestSchema.parse(data)

        // Generate Management Number (YYMMDD#N)
        const now = new Date()
        const year = now.getFullYear().toString().slice(-2)
        const month = (now.getMonth() + 1).toString().padStart(2, '0')
        const day = now.getDate().toString().padStart(2, '0')
        // Base prefix: YYMMDD
        const datePrefix = `${year}${month}${day}`
        // Search prefix: YYMMDD#
        const searchPrefix = `${datePrefix}`

        // Find the last request for today to increment the sequence
        // We look for any managementNumber starting with "YYMMDD"
        // Then we parse the part after # to find max sequence.
        const lastRequests = await prisma.request.findMany({
            where: {
                managementNumber: {
                    startsWith: searchPrefix
                }
            },
            select: { managementNumber: true }
        })

        let nextSequence = 1
        let maxSeq = 0

        for (const req of lastRequests) {
            if (req.managementNumber) {
                // Format could be: "YYMMDD#N" or "YYMMDD-XXX" (legacy)
                // We prioritize the #N format.
                const parts = req.managementNumber.split('#')
                if (parts.length === 2) {
                    const seq = parseInt(parts[1], 10)
                    if (!isNaN(seq) && seq > maxSeq) {
                        maxSeq = seq
                    }
                }
            }
        }

        nextSequence = maxSeq + 1

        const managementNumber = `${datePrefix}#${nextSequence}`

        const request = await prisma.request.create({
            data: {
                managementNumber,
                receivedAt: validated.receivedAt,
                completedAt: validated.completedAt,
                status: validated.status || "PENDING",

                reqName: validated.reqName,
                reqKana: validated.reqKana,
                reqManager: validated.reqManager,
                reqZip: validated.reqZip,
                reqAddr1: validated.reqAddr1,
                reqAddr2: validated.reqAddr2,
                reqAddr: `${validated.reqAddr1 || ""}${validated.reqAddr2 || ""}`,
                reqTel: validated.reqTel,
                reqFax: validated.reqFax,
                reqMobile: validated.reqMobile,
                reqEmail: validated.reqEmail,
                customerName: validated.customerName,
                customerKana: validated.customerKana,
                customerAddress1: validated.customerAddress1,
                customerAddress2: validated.customerAddress2,
                customerAddress: `${validated.customerAddress1 || ""}${validated.customerAddress2 || ""}`,
                customerZip: validated.customerZip,
                customerTel1: validated.customerTel1,
                customerTel2: validated.customerTel2,
                customerPlusCode: validated.customerPlusCode,
                customerEmail: validated.customerEmail,
                deviceManufacturer: validated.deviceManufacturer,
                deviceModel: validated.deviceModel,
                gasType: validated.gasType,
                lotNumber: validated.lotNumber,
                yearsUsed: validated.yearsUsed,
                requestContent: validated.requestContent,
                internalNotes: validated.internalNotes,
                orderNumber: validated.orderNumber,
                cause: validated.cause,
                treatment: validated.treatment,
                billingBreakdown: validated.billingBreakdown,
                assignedUserId: validated.assignedUserId,
                sitePhotoUrl: validated.sitePhotoUrl, // Add sitePhotoUrl
                // Billing Destination
                billingName: validated.billingName,
                billingKana: validated.billingKana,
                billingZip: validated.billingZip,
                billingAddress1: validated.billingAddress1,
                billingAddress2: validated.billingAddress2,
                billingAddress: `${validated.billingAddress1 || ""}${validated.billingAddress2 || ""}`,
                billingTel: validated.billingTel,
                billingFax: validated.billingFax,
                pescManagementNumber: validated.pescManagementNumber,
                // Billing Items
                billingItems: {
                    create: validated.billingItems?.map((item) => ({
                        name: item.name,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                    })) || [],
                },
            },
        })

        // -- EMAIL NOTIFICATION START --
        // Send Email Notification (Await to ensure delivery before redirect)
        try {
             await sendAreaNotification({
                id: request.id,
                customerName: request.customerName,
                customerAddress: request.customerAddress,
                requestContent: request.requestContent,
                managementNumber: request.managementNumber
            })
        } catch (err) {
            console.error("Failed to send notification email:", err)
        }
        // -- EMAIL NOTIFICATION END --

        revalidatePath("/requests")
    } catch (e) {
        if ((e as Error).message === "NEXT_REDIRECT") {
            throw e;
        }
        if (e instanceof z.ZodError) {
            console.error("Validation Error:", JSON.stringify(e.issues, null, 2))
        }
        console.error("Failed to create request:", e)
        throw e;
    }
    // Redirect outside try-catch to be safe, or re-throw NEXT_REDIRECT
    redirect("/requests")
}

export async function updateRequest(id: number, data: RequestFormValues) {
    console.log("updateRequest payload:", JSON.stringify(data, null, 2))
    const validated = requestSchema.parse(data)

    await prisma.request.update({
        where: { id },
        data: {
            receivedAt: validated.receivedAt,
            completedAt: validated.completedAt,
            status: validated.status,

                reqName: validated.reqName,
                reqKana: validated.reqKana,
                reqManager: validated.reqManager,
                reqZip: validated.reqZip,
                reqAddr1: validated.reqAddr1,
                reqAddr2: validated.reqAddr2,
                reqAddr: `${validated.reqAddr1 || ""}${validated.reqAddr2 || ""}`,
                reqTel: validated.reqTel,
                reqFax: validated.reqFax,
                reqMobile: validated.reqMobile,
                reqEmail: validated.reqEmail,
                customerName: validated.customerName,
                customerKana: validated.customerKana,
                customerAddress1: validated.customerAddress1,
                customerAddress2: validated.customerAddress2,
                customerAddress: `${validated.customerAddress1 || ""}${validated.customerAddress2 || ""}`,
                customerZip: validated.customerZip,
                customerTel1: validated.customerTel1,
                customerTel2: validated.customerTel2,
                customerPlusCode: validated.customerPlusCode,
                customerEmail: validated.customerEmail,
                deviceManufacturer: validated.deviceManufacturer,
                deviceModel: validated.deviceModel,
                gasType: validated.gasType,
                lotNumber: validated.lotNumber,
                yearsUsed: validated.yearsUsed,
                requestContent: validated.requestContent,
                internalNotes: validated.internalNotes,
                orderNumber: validated.orderNumber,
                cause: validated.cause,
                treatment: validated.treatment,
                billingBreakdown: validated.billingBreakdown,
                assignedUserId: validated.assignedUserId,
                sitePhotoUrl: validated.sitePhotoUrl, // Add sitePhotoUrl
                // Billing Destination
                billingName: validated.billingName,
                billingKana: validated.billingKana,
                billingZip: validated.billingZip,
                billingAddress1: validated.billingAddress1,
                billingAddress2: validated.billingAddress2,
                billingAddress: `${validated.billingAddress1 || ""}${validated.billingAddress2 || ""}`,
                billingTel: validated.billingTel,
                billingFax: validated.billingFax,
                pescManagementNumber: validated.pescManagementNumber,
                // Billing Items: Transactional update (delete all, re-create) or careful update.
                // For simplicity, we can deleteMany and createMany if we are sending the full list.
                billingItems: {
                    deleteMany: {},
                    create: validated.billingItems?.map((item) => ({
                        name: item.name,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                    })) ||[],
                }
        }
    })

    revalidatePath(`/requests/${id}`)
    revalidatePath("/requests")
    // Redirect removed to avoid client-side error catching.
}

export async function toggleReportedStatus(id: number, status: boolean) {
    await prisma.request.update({
        where: { id },
        data: { isReported: status }
    })
    revalidatePath("/requests")
    revalidatePath(`/requests/${id}`)
}
// ... existing actions

export async function getMonthlyStats() {
    const requests = await prisma.request.findMany({
        where: {
            status: "COMPLETED",
            completedAt: { not: null }
        },
        include: {
            billingItems: true
        },
        orderBy: {
            completedAt: 'desc'
        }
    })

    const statsMap = new Map<string, { month: string, total: number, paid: number, free: number }>()

    for (const req of requests) {
        if (!req.completedAt) continue

        const date = req.completedAt
        const monthKey = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`

        if (!statsMap.has(monthKey)) {
            statsMap.set(monthKey, { month: monthKey, total: 0, paid: 0, free: 0 })
        }

        const stats = statsMap.get(monthKey)!
        stats.total++

        const totalAmount = req.billingItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

        if (totalAmount > 0) {
            stats.paid++
        } else {
            stats.free++
        }
    }

    return Array.from(statsMap.values())
}

export async function getTrendAnalysis() {
    const requests = await prisma.request.findMany({
        where: { status: "COMPLETED" },
        include: { billingItems: true }
    })

    // Simple keyword analysis buckets
    const keywords = ["劣化", "破損", "汚れ", "異音", "点火不良", "水漏れ", "エラー", "電池", "交換", "清掃", "調整", "修理", "点検", "説明"]
    const paidKeywords = new Map<string, number>()
    const freeKeywords = new Map<string, number>()

    const calculateAnalysis = (reqs: typeof requests, keywordMap: Map<string, number>) => {
        reqs.forEach(req => {
            const text = `${req.cause || ""} ${req.treatment || ""} ${req.requestContent || ""}`
            keywords.forEach(k => {
                if (text.includes(k)) {
                    keywordMap.set(k, (keywordMap.get(k) || 0) + 1)
                }
            })
        })

        // Find top 3 keywords
        const top = Array.from(keywordMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(x => `『${x[0]}』`)

        if (top.length === 0) return "データ不足のため傾向を特定できませんでした。"

        return `主な要因・処置として${top.join("、")}が多く検出されています。`
    }

    const paidReqs = requests.filter(req => {
        const totalAmount = req.billingItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        return totalAmount > 0
    })
    const freeReqs = requests.filter(req => {
        const totalAmount = req.billingItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
        return totalAmount === 0
    })

    // Run analysis
    const paidAnalysis = calculateAnalysis(paidReqs, paidKeywords)
    const freeAnalysis = calculateAnalysis(freeReqs, freeKeywords)

    const sortMap = (map: Map<string, number>) => {
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }))
            .slice(0, 5) // Top 5
    }

    return {
        paid: {
            items: sortMap(paidKeywords),
            analysis: paidAnalysis + (paidReqs.length > 0 ? " 部品交換や本格的な修理作業を伴うケースが中心です。" : "")
        },
        free: {
            items: sortMap(freeKeywords),
            analysis: freeAnalysis + (freeReqs.length > 0 ? " 点検や軽微な調整、使用説明のみで完了するケースが中心です。" : "")
        }
    }
}

export async function getSuggestions(field: string, query: string) {
    if (!query || query.length < 2) return []

    // Map field names to database columns strictly to avoid type issues
    const fieldMap: Record<string, Prisma.RequestScalarFieldEnum> = {
        'customerName': 'customerName',
        'reqTel': 'reqTel',
        'customerTel1': 'customerTel1',
        'customerTel2': 'customerTel2',
    }

    const dbField = fieldMap[field]
    if (!dbField) return []

    // Use findMany + select + manual unique for safer typing if groupBy is too complex for dynamic keys
    // or cast to a generic Record array if we trust the output.
    const results = await prisma.request.findMany({
        where: {
            [dbField]: {
                contains: query
            }
        },
        select: {
            [dbField]: true
        },
        distinct: [dbField],
        take: 10,
        orderBy: {
            [dbField]: 'asc'
        }
    })

    return results.map(r => String(r[dbField as keyof typeof r] || "")).filter(Boolean)
}

export async function getLatestDetails(field: string, value: string) {
    if (!value) return null

    const fieldMap: Record<string, string> = {
        'customerName': 'customerName',
    }

    const dbField = fieldMap[field]
    if (!dbField) return null

    const latest = await prisma.request.findFirst({
        where: {
            [dbField]: value
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            customer: true // In case there's a relation
        }
    })

    return latest
}

export async function findZips(addressKeyword: string) {
    if (!addressKeyword || addressKeyword.length < 2) return []

    // Search existing requests for address match and return their zip/address pairs
    const results = await prisma.request.findMany({
        where: {
            OR: [
                { primeAddr: { contains: addressKeyword } },
                { reqAddr: { contains: addressKeyword } },
                { customerAddress: { contains: addressKeyword } },
                { billingAddress: { contains: addressKeyword } },
            ]
        },
        select: {
            primeZip: true,
            primeAddr: true,
            reqZip: true,
            reqAddr: true,
            customerZip: true,
            customerAddress: true,
            billingZip: true,
            billingAddress: true,
        },
        take: 20
    })

    // Flatten and unique
    const items: { zip: string, addr: string }[] = []
    const seen = new Set<string>()

    results.forEach(r => {
        if (r.primeZip && r.primeAddr) {
            const key = `${r.primeZip}-${r.primeAddr}`
            if (!seen.has(key)) { items.push({ zip: r.primeZip, addr: r.primeAddr }); seen.add(key); }
        }
        if (r.reqZip && r.reqAddr) {
            const key = `${r.reqZip}-${r.reqAddr}`
            if (!seen.has(key)) { items.push({ zip: r.reqZip, addr: r.reqAddr }); seen.add(key); }
        }
        if (r.customerZip && r.customerAddress) {
            const key = `${r.customerZip}-${r.customerAddress}`
            if (!seen.has(key)) { items.push({ zip: r.customerZip, addr: r.customerAddress }); seen.add(key); }
        }
        if (r.billingZip && r.billingAddress) {
            const key = `${r.billingZip}-${r.billingAddress}`
            if (!seen.has(key)) { items.push({ zip: r.billingZip, addr: r.billingAddress }); seen.add(key); }
        }
    })

    // --- Search External API (ZipCoda) as fallback or addition ---
    try {
        const extRes = await fetch(`https://zipcoda.net/api?address=${encodeURIComponent(addressKeyword)}`)
        const extData = await extRes.json() as { items?: { zipcode: string, address: string }[] }
        if (extData && extData.items) {
            extData.items.forEach((item) => {
                const key = `${item.zipcode}-${item.address}`
                if (!seen.has(key)) {
                    items.push({ zip: item.zipcode, addr: item.address })
                    seen.add(key)
                }
            })
        }
    } catch (e) {
        console.error("External zip search failed", e)
    }

    return items
}

export async function getTrackingHistory(query: string) {
    if (!query || query.length < 2) return []

    const halfQuery = query.replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ')
    const fullQuery = query.replace(/[!-~]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0)).replace(/ /g, '　')
    const digitsOnly = query.replace(/\D/g, '')

    // Search by Name, Tel or Address to find "same customer"
    return prisma.request.findMany({
        where: {
            OR: [
                { customerName: { contains: query } },
                { customerName: { contains: fullQuery } },
                { customerKana: { contains: query } },
                { customerKana: { contains: fullQuery } },
                { billingName: { contains: query } },
                { primeName: { contains: query } },
                { reqName: { contains: query } },
                // Tel searches
                { customerTel1: { contains: query } },
                { customerTel1: { contains: digitsOnly } },
                { customerTel2: { contains: query } },
                { customerTel2: { contains: digitsOnly } },
                { primeTel: { contains: query } },
                { reqTel: { contains: query } },
                { billingTel: { contains: query } },
                // Address searches (Width-insensitive)
                { customerAddress: { contains: query } },
                { customerAddress: { contains: fullQuery } },
                { customerAddress: { contains: halfQuery } },
                { primeAddr: { contains: query } },
                { primeAddr: { contains: fullQuery } },
                { reqAddr: { contains: query } },
                { reqAddr: { contains: fullQuery } },
                { billingAddress: { contains: query } },
                { billingAddress: { contains: fullQuery } },
            ]
        },
        include: {
            billingItems: true,
        },
        orderBy: {
            receivedAt: 'asc' // Chronological order
        }
    })
}

export async function getUserAreas() {
    const session = await auth()
    if (!session?.user?.id) return []

    return prisma.userArea.findMany({
        where: { userId: session.user.id },
        orderBy: { prefecture: 'asc' }
    })
}

export async function saveUserArea(prefecture: string, cities: string[]) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const citiesJson = JSON.stringify(cities)

    await prisma.userArea.upsert({
        where: {
            userId_prefecture: {
                userId: session.user.id,
                prefecture
            }
        },
        update: {
            cities: citiesJson
        },
        create: {
            userId: session.user.id,
            prefecture,
            cities: citiesJson
        }
    })

    revalidatePath("/areas")
}

export async function deleteUserArea(id: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await prisma.userArea.delete({
        where: { id, userId: session.user.id }
    })

    revalidatePath("/areas")
}


export async function getUserProfile() {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            email: true,
            image: true,
            affiliation: true,
            zip: true,
            address: true,
            phoneNumber: true,
            fax: true
        }
    })

    return user
}

export async function updateUserProfile(data: {
    name: string,
    affiliation?: string,
    zip?: string,
    address?: string,
    phoneNumber?: string,
    fax?: string
}) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            name: data.name,
            affiliation: data.affiliation,
            zip: data.zip,
            address: data.address,
            phoneNumber: data.phoneNumber,
            fax: data.fax
        }
    })

    revalidatePath("/areas")
}
