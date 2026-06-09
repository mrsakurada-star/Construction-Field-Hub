"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

import { Prisma } from "@prisma/client"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function analyzeAndCreateRequest(formData: FormData) {
    const file = formData.get("file") as File
    if (!file) {
        throw new Error("ファイルがアップロードされていません")
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEYが設定されていません")
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = file.type

    // Setup model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Prompt construction
    const prompt = `
    あなたはプロのアフターサービス受付担当者です。
    以下の画像またはPDFは、アフターサービスの依頼書、または現場の写真とメモです。
    この内容を解析し、システムに登録するためのJSONデータを作成してください。
    
    以下のフィールドを抽出・推測してください。不明な場合は null または 空文字 にしてください。
    
    Return the response ONLY as valid JSON.
    
    Schema:
    {
        "status": "PENDING" | "COMPLETED",
        "receivedAt": "ISO Date String" (依頼日。記載がなければ今日),
        "reqName": "String" (依頼元名称),
        "reqAddr": "String" (依頼元住所),
        "reqTel": "String" (依頼元電話番号),
        "customerName": "String" (お客様名。必須。不明なら '不明' とする),
        "customerAddr": "String" (お客様住所),
        "customerTel1": "String" (お客様電話番号),
        "deviceManufacturer": "String" (メーカー),
        "deviceModel": "String" (型式・機種),
        "gasType": "String" (ガス種),
        "lotNumber": "String" (ロット等の製造番号),
        "yearsUsed": "String" (使用年数),
        "requestContent": "String" (依頼内容・不具合内容),
        "cause": "String" (原因),
        "treatment": "String" (処置内容)
    }
    `

    try {
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
        ])

        const responseText = result.response.text()
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim()

        console.log("AI Response:", cleanedText)

        const data = JSON.parse(cleanedText)

        // Generate Management Number (YYMMDD#N)
        const nowAtGenerate = new Date()
        const year = nowAtGenerate.getFullYear().toString().slice(-2)
        const month = (nowAtGenerate.getMonth() + 1).toString().padStart(2, '0')
        const day = nowAtGenerate.getDate().toString().padStart(2, '0')
        const datePrefix = `${year}${month}${day}`
        const searchPrefix = `${datePrefix}`

        const lastRequests = await prisma.request.findMany({
            where: { managementNumber: { startsWith: searchPrefix } },
            select: { managementNumber: true }
        })

        let maxSeq = 0
        for (const req of lastRequests) {
            if (req.managementNumber) {
                const parts = req.managementNumber.split('#')
                if (parts.length === 2) {
                    const seq = parseInt(parts[1], 10)
                    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq
                }
            }
        }
        const managementNumber = `${datePrefix}#${maxSeq + 1}`

        // Validate/Clean data for Prisma
        const requestData: Prisma.RequestCreateInput = {
            managementNumber,
            status: data.status || "PENDING",
            receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
            reqName: data.reqName || "",
            reqAddr: data.reqAddr || "",
            reqAddr1: data.reqAddr || "",
            reqTel: data.reqTel || "",
            customerName: data.customerName || "不明",
            customerAddress: data.customerAddr || "",
            customerAddress1: data.customerAddr || "",
            customerTel1: data.customerTel1 || "",
            deviceManufacturer: data.deviceManufacturer || "",
            deviceModel: data.deviceModel || "",
            gasType: data.gasType || "",
            lotNumber: data.lotNumber || "",
            yearsUsed: data.yearsUsed || "",
            requestContent: data.requestContent || "",
            cause: data.cause || "",
            treatment: data.treatment || "",
        }

        const newRequest = await prisma.request.create({
            data: requestData,
        })

        revalidatePath("/requests")
        return { success: true, id: newRequest.id }

    } catch (error) {
        console.error("AI Analysis Error:", error)
        if (error instanceof SyntaxError) {
            throw new Error("AI解析結果の読み取りに失敗しました。別の画像・PDFで再試行してください。")
        }
        const msg = error instanceof Error ? error.message : ""
        if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
            throw new Error("AI APIの利用上限に達しました。しばらく待ってから再試行してください。")
        }
        if (msg.includes("INVALID_ARGUMENT") || msg.includes("unsupported")) {
            throw new Error("このファイル形式はAI解析に対応していません。JPEG・PNG・PDFをお試しください。")
        }
        if (msg.includes("SAFETY") || msg.includes("blocked")) {
            throw new Error("AIがコンテンツをブロックしました。別のファイルで再試行してください。")
        }
        throw new Error("AI解析に失敗しました。ネットワーク接続を確認し、再試行してください。")
    }
}
