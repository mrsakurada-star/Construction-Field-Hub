
import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Purpose Ecotech
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        アフター記録システムへログイン
                    </p>
                </div>
                <form
                    action={async () => {
                        "use server"
                        await signIn("google", { redirectTo: "/requests" })
                    }}
                    className="mt-8 space-y-6"
                >
                    <Button type="submit" className="w-full">
                        Googleでログイン
                    </Button>
                </form>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-center text-gray-400 mb-2">開発用 (Google認証スキップ)</p>
                        <form
                            action={async () => {
                                "use server"
                                await signIn("credentials", { email: "dev@example.com", redirectTo: "/requests" })
                            }}
                        >
                            <Button type="submit" variant="outline" className="w-full">
                                開発者ログイン (Dev Login)
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
