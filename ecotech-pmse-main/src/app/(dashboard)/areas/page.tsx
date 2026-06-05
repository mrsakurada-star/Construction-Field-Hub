import { getUserAreas, getUserProfile } from "@/app/actions"
import { AreaListClient } from "@/components/AreaListClient"
import { UserProfileForm } from "@/components/UserProfileForm"

export default async function UserManagementPage() {
    const areas = await getUserAreas()
    const userProfile = await getUserProfile()

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-black">ユーザー管理</h2>
                <p className="text-sm text-gray-500">
                    あなたのプロフィール情報と、担当するエリアを管理します。
                </p>
            </div>

            <UserProfileForm initialData={userProfile || {
                name: "",
                email: "",
                affiliation: "",
                zip: "",
                address: "",
                phoneNumber: "",
                fax: ""
            }} />

            <div className="space-y-4">
                <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-900">担当エリア設定</h3>
                    <p className="text-sm text-gray-500">担当する市区町村を設定します（依頼の自動分類等に使用）。</p>
                </div>

                <AreaListClient initialAreas={areas.map(a => ({
                    id: a.id,
                    prefecture: a.prefecture,
                    cities: a.cities ? JSON.parse(a.cities) as string[] : []
                }))} />
            </div>
        </div>
    )
}
