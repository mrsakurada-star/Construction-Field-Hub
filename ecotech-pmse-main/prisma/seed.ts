import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Clean up existing data
    await prisma.request.deleteMany()
    await prisma.customer.deleteMany()

    // 1. Pending Requests (5 items)
    // Create Dev User
    await prisma.user.upsert({
        where: { email: "test@example.com" },
        update: {},
        create: {
            id: "dev-user-id",
            name: "Dev User",
            email: "test@example.com",
            image: "https://github.com/shadcn.png"
        }
    })

    const pendingRequests = [
        {
            status: "PENDING",
            primeName: "株式会社 住設サービス",
            customerName: "山田 太郎",
            customerAddress: "東京都世田谷区桜丘1-1-1",
            // Mapping tel to appropriate field, likely just unused in this mock or needs a field. 
            // Schema has primeTel, reqTel, but customer phone seems missing in Request model directly? 
            // schema says: customerTel1 is NOT in Request. Request has `customer` relation or specific fields.
            // Request model has: customerName, customerAddress. 
            // And relation to Customer model (phone1).
            // For simple seeding without relation logic complexity, we'll omit phone or use a valid field if exists.
            // Looking at schema: Request has prime..., req..., but customer fields are limited to Name/Address for fallback.
            // So we will omit phone for now or create Customer first.
            // Let's create Customer relations properly for better data.
            deviceModel: "GH-2401ZWH6",
            gasType: "13A",
            yearsUsed: "8",
            yearsUsedInt: 8,
            requestContent: "お湯が出ない。リモコンにエラー710が表示される。",
            cause: "",
            treatment: "",
        },
        {
            status: "PENDING",
            primeName: "エコ・ソリューションズ",
            customerName: "鈴木 花子",
            customerAddress: "神奈川県横浜市港北区大倉山2-2-2",
            deviceModel: "GX-H2400ZR",
            gasType: "LPG",
            yearsUsed: "12",
            yearsUsedInt: 12,
            requestContent: "追い焚きができない。異音がする。",
            cause: "",
            treatment: "",
        },
        {
            status: "PENDING",
            primeName: "ライフライン関東",
            customerName: "佐藤 次郎",
            customerAddress: "埼玉県さいたま市大宮区桜木町3-3-3",
            deviceModel: "GN-2000AR-1",
            gasType: "13A",
            yearsUsed: "5",
            yearsUsedInt: 5,
            requestContent: "給湯温度が安定しない。熱くなったりぬるくなったりする。",
            cause: "",
            treatment: "",
        },
        {
            status: "PENDING",
            primeName: "東京ガスライフバル",
            customerName: "田中 美咲",
            customerAddress: "東京都杉並区高円寺南4-4-4",
            deviceModel: "GS-1600W-1",
            gasType: "13A",
            yearsUsed: "15",
            yearsUsedInt: 15,
            requestContent: "点火不良。何度か操作しないとつかない。",
            cause: "",
            treatment: "",
        },
        {
            status: "PENDING",
            primeName: "埼玉設備工業",
            customerName: "伊藤 健太",
            customerAddress: "埼玉県川口市並木5-5-5",
            deviceModel: "GH-H2400ZWH6",
            gasType: "LPG",
            yearsUsed: "3",
            yearsUsedInt: 3,
            requestContent: "床暖房が温まらない。",
            cause: "",
            treatment: "",
        },
    ]

    for (const req of pendingRequests) {
        await prisma.request.create({ data: req })
    }

    // 2. Completed History (5 items)
    const historyRequests = [
        {
            status: "COMPLETED",
            primeName: "株式会社 住設サービス",
            customerName: "渡辺 裕子",
            customerAddress: "東京都練馬区豊玉北6-6-6",
            deviceModel: "GH-HK2000ZW",
            gasType: "13A",
            yearsUsed: "9",
            yearsUsedInt: 9,
            requestContent: "エラー111が表示され点火しない。",
            cause: "イグナイタの経年劣化によるスパーク不良。",
            treatment: "イグナイタ交換、点火プラグ清掃。試運転良好。",
            billingBreakdown: "技術料: 8,000円\n部品代(イグナイタ): 5,000円\n出張費: 3,000円\n計: 16,000円",
            createdAt: new Date('2025-12-10'),
            updatedAt: new Date('2025-12-12'),
        },
        {
            status: "COMPLETED",
            primeName: "エコ・ソリューションズ",
            customerName: "高橋 誠",
            customerAddress: "横浜市青葉区美しが丘7-7-7",
            deviceModel: "GX-2000AW-1",
            gasType: "LPG",
            yearsUsed: "11",
            yearsUsedInt: 11,
            requestContent: "水漏れしている。",
            cause: "熱交換器および配管接続部からの水漏れを確認。",
            treatment: "熱交換器交換およびOリング全数交換。水漏れなし確認。",
            billingBreakdown: "技術料: 12,000円\n部品代(熱交換器): 25,000円\n出張費: 3,000円\n計: 40,000円",
            createdAt: new Date('2025-11-20'),
            updatedAt: new Date('2025-11-21'),
        },
        {
            status: "COMPLETED",
            primeName: "ライフライン関東",
            customerName: "小林 直樹",
            customerAddress: "さいたま市浦和区高砂8-8-8",
            deviceModel: "GN-2400AR",
            gasType: "13A",
            yearsUsed: "6",
            yearsUsedInt: 6,
            requestContent: "リモコンの電源が入らない。",
            cause: "浴室リモコンの配線断線および台所リモコンの基盤不良。",
            treatment: "浴室リモコン線修理、台所リモコン交換。",
            billingBreakdown: "技術料: 9,000円\n部品代(台所リモコン): 12,000円\n出張費: 3,000円\n計: 24,000円",
            createdAt: new Date('2025-10-05'),
            updatedAt: new Date('2025-10-06'),
        },
        {
            status: "COMPLETED",
            primeName: "東京ガスライフバル",
            customerName: "加藤 智子",
            customerAddress: "東京都中野区中野9-9-9",
            deviceModel: "GS-2000W-1",
            gasType: "13A",
            yearsUsed: "13",
            yearsUsedInt: 13,
            requestContent: "お湯の温度が低い気がする。",
            cause: "ガス電磁弁の開度不良によるガス量不足。",
            treatment: "ガス電磁弁ユニット交換。ガス圧調整。",
            billingBreakdown: "技術料: 10,000円\n部品代(電磁弁): 8,000円\n出張費: 3,000円\n計: 21,000円",
            createdAt: new Date('2025-09-15'),
            updatedAt: new Date('2025-09-15'),
        },
        {
            status: "COMPLETED",
            primeName: "埼玉設備工業",
            customerName: "吉田 勇輝",
            customerAddress: "川口市西川口10-10-10",
            deviceModel: "GH-2401ZWH6",
            gasType: "LPG",
            yearsUsed: "2",
            yearsUsedInt: 2,
            requestContent: "エラー101が表示される。",
            cause: "給排気閉塞による燃焼異常。",
            treatment: "給排気トップの清掃、周辺の障害物撤去。燃焼状態良好。",
            billingBreakdown: "技術料: 6,000円\n出張費: 3,000円\n計: 9,000円",
            createdAt: new Date('2025-08-01'),
            updatedAt: new Date('2025-08-01'),
        },
    ]

    for (const hist of historyRequests) {
        await prisma.request.create({ data: hist })
    }

    console.log('Seed data created.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
