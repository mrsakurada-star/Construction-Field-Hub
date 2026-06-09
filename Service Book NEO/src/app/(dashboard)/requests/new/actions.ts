"use server"

import { prisma } from "@/lib/prisma"

export async function searchHistoricalRequests(query: string) {
    if (!query) return []

    const terms = query.trim().split(/\s+/)
    return prisma.request.findMany({
        where: {
            AND: terms.map((term: string) => ({
                OR: [
                    { managementNumber: { contains: term } },
                    { customerName: { contains: term } },
                    { customerAddress: { contains: term } },
                    { deviceModel: { contains: term } },
                    { requestContent: { contains: term } },
                ]
            }))
        },
        orderBy: { updatedAt: "desc" },
        take: 20
    })
}

export async function getRequestById(id: number) {
    return prisma.request.findUnique({
        where: { id },
        include: {
            billingItems: true
        }
    })
}
