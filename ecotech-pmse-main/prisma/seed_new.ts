import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up existing data...')
    await prisma.billingItem.deleteMany()
    await prisma.request.deleteMany()
    await prisma.customer.deleteMany()

    console.log('Generating 50 completed requests and 5 pending requests...')

    const primeCompanies = [
        { name: "株式会社 住設サービス", kana: "カブシキガイシャ シュウセツサービス", zip: "100-0001", addr: "東京都千代田区千代田1-1", tel: "03-1111-1111", fax: "03-1111-1112", mobile: "090-1111-1111", email: "info@shusetsu.example.com" },
        { name: "エコ・ソリューションズ", kana: "エコソリューションズ", zip: "223-0061", addr: "神奈川県横浜市港北区日吉1-2-3", tel: "045-222-2222", fax: "045-222-2223", mobile: "080-2222-2222", email: "support@eco.example.com" },
        { name: "ライフライン関東", kana: "ライフラインカントウ", zip: "330-0854", addr: "埼玉県さいたま市大宮区桜木町1-1", tel: "048-333-3333", fax: "048-333-3334", mobile: "070-3333-3333", email: "contact@lifeline.example.com" },
    ]

    const manufacturers = ["パーパス", "リンナイ", "ノーリツ", "パロマ"]
    const gasTypes = ["13A", "LPG"]
    const statusCompleted = "COMPLETED"
    const statusPending = "PENDING"

    // Helper to generate management number
    const getMgmtNum = (date: Date, seq: number) => {
        const yy = date.getFullYear().toString().slice(-2)
        const mm = (date.getMonth() + 1).toString().padStart(2, '0')
        const dd = date.getDate().toString().padStart(2, '0')
        return `${yy}${mm}${dd}#${seq}`
    }

    const createRequests = async (count: number, status: string) => {
        for (let i = 1; i <= count; i++) {
            const date = new Date()
            date.setDate(date.getDate() - (status === statusCompleted ? i : 0)) // Older dates for history

            const prime = primeCompanies[i % primeCompanies.length]
            const manufacturer = manufacturers[i % manufacturers.length]
            const gasType = gasTypes[i % gasTypes.length]

            await prisma.request.create({
                data: {
                    managementNumber: getMgmtNum(date, i + (status === statusPending ? 100 : 0)),
                    status,
                    receivedAt: date,
                    completedAt: status === statusCompleted ? new Date(date.getTime() + 86400000) : null,

                    // Prime
                    primeName: prime.name,
                    primeKana: prime.kana,
                    primeZip: prime.zip,
                    primeAddr: prime.addr,
                    primeTel: prime.tel,
                    primeFax: prime.fax,
                    primeMobile: prime.mobile,
                    primeEmail: prime.email,

                    // Requester (same as prime for simplicity)
                    reqName: prime.name,
                    reqKana: prime.kana,
                    reqZip: prime.zip,
                    reqAddr: prime.addr,
                    reqTel: prime.tel,
                    reqFax: prime.fax,
                    reqMobile: prime.mobile,
                    reqEmail: prime.email,

                    // Customer
                    customerName: `顧客 太郎${i}`,
                    customerKana: `コキャク タロウ${i}`,
                    customerZip: "154-0001",
                    customerAddress: "東京都世田谷区池尻1-2-3",
                    customerTel1: "03-4444-4444",
                    customerTel2: "090-4444-4444",
                    customerPlusCode: "8Q7X+WX",
                    customerEmail: `customer${i}@example.com`,

                    // Device
                    deviceManufacturer: manufacturer,
                    deviceModel: `Model-${manufacturer.charAt(0)}-${i}`,
                    gasType,
                    lotNumber: `LOT-${i.toString().padStart(5, '0')}`,
                    yearsUsed: `${i % 15 + 1}年`,
                    yearsUsedInt: i % 15 + 1,

                    requestContent: `${i}番目の修理依頼です。お湯が出ない、または異音がします。`,

                    // Visit Info
                    orderNumber: `ORD-${date.getTime().toString().slice(-6)}`,
                    cause: status === statusCompleted ? "部品の経年劣化による故障。" : "",
                    treatment: status === statusCompleted ? "基盤の交換および配管の清掃を行いました。" : "",
                    billingBreakdown: status === statusCompleted ? "技術料、部品代、出張費の合計です。" : "",

                    // Billing
                    billingName: prime.name,
                    billingKana: prime.kana,
                    billingZip: prime.zip,
                    billingAddress: prime.addr,
                    billingTel: prime.tel,
                    billingFax: prime.fax,
                    pescManagementNumber: `PESC-${i.toString().padStart(6, '0')}`,

                    // Billing Items
                    billingItems: {
                        create: status === statusCompleted ? [
                            { name: "技術料", unitPrice: 10000, quantity: 1 },
                            { name: "部品代(基盤)", unitPrice: 15000, quantity: 1 },
                            { name: "出張費", unitPrice: 3000, quantity: 1 }
                        ] : []
                    }
                }
            })
        }
    }

    console.log('Creating 50 completed requests...')
    await createRequests(50, statusCompleted)

    console.log('Creating 5 pending requests...')
    await createRequests(5, statusPending)

    console.log('Seed completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
