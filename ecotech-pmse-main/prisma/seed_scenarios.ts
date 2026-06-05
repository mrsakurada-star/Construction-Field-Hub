import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Generating scenario dummy data...')

    // Cleanup existing data for specific search keyword to avoid clutter
    await prisma.request.deleteMany({
        where: { deviceModel: 'SCENARIO-TEST' }
    })

    const baseData = {
        deviceManufacturer: 'パーパス',
        deviceModel: 'SCENARIO-TEST',
        lotNumber: 'LOT-999-XYZ',
        status: 'COMPLETED',
        gasType: 'LPG',
        requestContent: '点検',
        billingItems: { create: [{ name: '技術料', unitPrice: 5000, quantity: 1 }] }
    }

    // 1. Latest (Anchor): Target Person
    await prisma.request.create({
        data: {
            ...baseData,
            managementNumber: '250101#1',
            receivedAt: new Date(2025, 0, 1),
            customerName: 'シナリオ太郎',
            customerAddress: '東京都千代田区1-1-1',
            customerTel1: '090-0000-0001',
            billingName: 'シナリオ太郎'
        }
    })

    // 2. Relocation: Same Name, Same Tel, Different Address
    await prisma.request.create({
        data: {
            ...baseData,
            managementNumber: '240101#1',
            receivedAt: new Date(2024, 0, 1),
            customerName: 'シナリオ太郎',
            customerAddress: '神奈川県横浜市2-2-2',
            customerTel1: '090-0000-0001'
        }
    })

    // 3. Tenant Change: Different Name, Same Address, Different Tel (but same device/lot)
    await prisma.request.create({
        data: {
            ...baseData,
            managementNumber: '230101#1',
            receivedAt: new Date(2023, 0, 1),
            customerName: '前の住人様',
            customerAddress: '東京都千代田区1-1-1',
            customerTel1: '090-9999-9999'
        }
    })

    // 4. Family/Company Match: Different Name, Same Tel
    await prisma.request.create({
        data: {
            ...baseData,
            managementNumber: '220101#1',
            receivedAt: new Date(2022, 0, 1),
            customerName: 'シナリオ花子',
            customerAddress: '住所不明',
            customerTel1: '090-0000-0001'
        }
    })

    console.log('Successfully generated scenario data.')
}

main().finally(() => prisma.$disconnect())
