
import nodemailer from 'nodemailer';
import { prisma } from './prisma';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || '"Ecotech Notification" <noreply@ecotech.com>';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

interface NotificationRequest {
    id: number;
    customerName?: string | null;
    customerAddress?: string | null;
    requestContent?: string | null;
    managementNumber?: string | null;
}

export async function sendAreaNotification(request: NotificationRequest) {
    // 1. Validate inputs
    if (!request.customerAddress) {
        console.log(`[Email] Skipping notification for Request #${request.id}: No address provided.`);
        return;
    }

    // 2. Parse address to get Prefecture and City
    // Simple parsing assumption: Address starts with Prefecture
    // In a real Japanese address, we might need a library, but for now we regex common patterns.
    // Matches: (東京都)(...区/市/町/村) or (To|Do|Fu|Ken)
    
    // Using a simple heuristic for now.
    // Fetch all UserAreas to match against.
    // This might be inefficient if we have thousands of areas, but for this scale it's fine.
    
    // Better approach: Get all users with areas, then filter in JS to avoid complex LIKE queries if address format varies.
    const userAreas = await prisma.userArea.findMany({
        include: {
            user: {
                select: {
                    email: true,
                    name: true
                }
            }
        }
    });


    console.log(`[Email] Found ${userAreas.length} user areas.`);
    console.log(`[Email] Checking address: ${request.customerAddress}`);

    const targetEmails = new Set<string>();

    for (const area of userAreas) {
        // Check if request address starts with the assigned prefecture
        if (request.customerAddress.includes(area.prefecture)) {
            let isMatch = false;
            const cities = area.cities ? JSON.parse(area.cities) as string[] : [];

            if (cities.length === 0) {
                // User is assigned to the whole prefecture
                isMatch = true;
            } else {
                // User is assigned to specific cities
                // Check if the address contains any of the assigned cities
                for (const city of cities) {
                    if (request.customerAddress.includes(city)) {
                        isMatch = true;
                        break;
                    }
                }
            }

            if (isMatch && area.user.email) {
                console.log(`[Email] Found match: ${area.user.email} for prefecture ${area.prefecture}`);
                targetEmails.add(area.user.email);
            }
        }
    }

    if (targetEmails.size === 0) {
        console.log(`[Email] No matching users found for address: ${request.customerAddress}`);
        return;
    }

    // 3. Send Email
    const recipients = Array.from(targetEmails);
    const subject = `【新規依頼】${request.customerName || '名称未定'}様 (${request.customerAddress})`;
    const text = `
新規依頼が登録されました。

管理番号: ${request.managementNumber || '未定'}
お名前: ${request.customerName || '未定'}
ご住所: ${request.customerAddress}
依頼内容:
${request.requestContent || 'なし'}

詳細はシステムにログインしてご確認ください。
    `;

    try {
        if (!SMTP_USER || !SMTP_PASS) {
            console.log("==================================================");
            console.log("[DEV MODE] Email to be sent:");
            console.log(`To: ${recipients.join(', ')}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body:\n${text}`);
            console.log("==================================================");
            return;
        }

        const info = await transporter.sendMail({
            from: EMAIL_FROM,
            to: recipients, // Send as To (or Bcc if privacy is concerned among staff)
            subject: subject,
            text: text,
        });

        console.log(`[Email] Notification sent: ${info.messageId}`);
    } catch (error) {
        console.error("[Email] Error sending notification:", error);
    }
}
