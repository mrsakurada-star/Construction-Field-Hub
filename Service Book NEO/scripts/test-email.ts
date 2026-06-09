
import { sendAreaNotification } from "../src/lib/email";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Email Logic Test...");

    // 1. Setup Test Data
    const testEmail = "test@example.com";
    const testUser = await prisma.user.findFirst({ where: { email: testEmail } });
    let userId = testUser?.id;

    if (!userId) {
        console.log("Creating test user...");
        const newUser = await prisma.user.create({
            data: {
                name: "Email Test User",
                email: testEmail,
            }
        });
        userId = newUser.id;
    }

    // 2. Assign Area (Tokyo)
    console.log("Assigning '東京都' to test user...");
    await prisma.userArea.upsert({
        where: {
            userId_prefecture: {
                userId: userId,
                prefecture: "東京都"
            }
        },
        update: { cities: "[]" }, // Whole prefecture
        create: {
            userId: userId,
            prefecture: "東京都",
            cities: "[]"
        }
    });

    // 3. Trigger Notification (Match)
    console.log("--- Test 1: Match (Tokyo Address) ---");
    await sendAreaNotification({
        id: 99999,
        customerName: "Test Customer Match",
        customerAddress: "東京都港区六本木1-1",
        requestContent: "Should match Tokyo user",
        managementNumber: "TEST-001"
    });

    // 4. Trigger Notification (No Match)
    console.log("--- Test 2: No Match (Osaka Address) ---");
    await sendAreaNotification({
        id: 99998,
        customerName: "Test Customer No Match",
        customerAddress: "大阪府大阪市北区",
        requestContent: "Should NOT match Tokyo user",
        managementNumber: "TEST-002"
    });

    // 5. Cleanup (Optional, keeping user for manual check if needed)
    console.log("Test Finished. Check console output above for '[DEV MODE] Email to be sent'.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
