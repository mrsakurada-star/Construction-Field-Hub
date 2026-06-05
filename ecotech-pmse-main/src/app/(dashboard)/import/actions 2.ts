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

        // Validate/Clean data for Prisma
        const requestData: Prisma.RequestCreateInput = {
            status: data.status || "PENDING",
            receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
            reqName: data.reqName || "",
            reqAddr: data.reqAddr || "",
            reqTel: data.reqTel || "",
            customerName: data.customerName || "不明",
            customerAddress: data.customerAddr || "",
            customerTel1: data.customerTel1 || "",
            deviceManufacturer: data.deviceManufacturer || "",
            deviceModel: data.deviceModel || "",
            gasType: data.gasType || "",
            lotNumber: data.lotNumber || "",
            yearsUsed: data.yearsUsed || "",
            requestContent: data.requestContent || "",
            cause: data.cause || "",
            treatment: data.treatment || "",
            // Add defaults for other required fields if strictly required by schema, 
            // but schema seems to handle optionals well usually.
            // Check schema.prisma if needed.
        }

        const newRequest = await prisma.request.create({
            data: requestData,
        })

        revalidatePath("/requests")
        return { success: true, id: newRequest.id }

    } catch (error) {
        console.error("AI Analysis Error:", error)
        throw new Error("AI解析に失敗しました: " + (error instanceof Error ? error.message : "Details unknown"))
    }
}
