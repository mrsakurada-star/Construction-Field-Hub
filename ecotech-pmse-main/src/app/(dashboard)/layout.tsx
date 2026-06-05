import { DashboardLayoutClient } from "@/components/DashboardLayoutClient"
import { getUserProfile } from "@/app/actions"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getUserProfile()
    return (
        <DashboardLayoutClient user={user || undefined}>
            {children}
        </DashboardLayoutClient>
    )
}
