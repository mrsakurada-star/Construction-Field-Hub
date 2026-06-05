import { z } from "zod";

export const requestSchema = z.object({
    status: z.enum(["PENDING", "COMPLETED"]).optional(),
    receivedAt: z.coerce.date().optional().nullable(),
    completedAt: z.coerce.date().optional().nullable(),
    isReported: z.boolean().default(false),

    reqName: z.string().optional(),
    reqKana: z.string().optional(),
    reqZip: z.string().optional(),
    reqAddr1: z.string().optional(),
    reqAddr2: z.string().optional(),
    reqTel: z.string().optional(),
    reqFax: z.string().optional(),
    reqMobile: z.string().optional(),
    reqEmail: z.string().optional(),
    reqManager: z.string().optional(),

    // Customer
    customerName: z.string().min(1, "お客様名は必須です"),
    customerKana: z.string().optional(),
    customerZip: z.string().optional(),
    customerAddress1: z.string().optional(),
    customerAddress2: z.string().optional(),
    customerTel1: z.string().optional(),
    customerTel2: z.string().optional(),
    customerPlusCode: z.string().optional(),
    customerEmail: z.string().email("有効なメールアドレスを入力してください").optional().or(z.literal("")),

    // Device
    deviceManufacturer: z.string().optional(),
    deviceModel: z.string().optional(),
    gasType: z.string().optional(),
    lotNumber: z.string().optional(),
    yearsUsed: z.string().optional(),
    requestContent: z.string().optional(),
    internalNotes: z.string().optional(),

    // Visit
    orderNumber: z.string().optional(),
    cause: z.string().optional(),
    treatment: z.string().optional(),
    billingBreakdown: z.string().optional(),

    // Billing Destination
    billingName: z.string().optional(),
    billingKana: z.string().optional(),
    billingZip: z.string().optional(),
    billingAddress1: z.string().optional(),
    billingAddress2: z.string().optional(),
    billingTel: z.string().optional(),
    billingFax: z.string().optional(),
    pescManagementNumber: z.string().optional(),
    assignedUserId: z.string().optional(),
    sitePhotoUrl: z.string().url("有効なURLを入力してください").optional().or(z.literal("")),

    // Billing Items
    billingItems: z.array(z.object({
        name: z.string(),
        unitPrice: z.number(),
        quantity: z.number(),
    })),
});

export type RequestFormValues = z.infer<typeof requestSchema>;
export type BillingItem = {
    name: string
    unitPrice: number
    quantity: number
}
