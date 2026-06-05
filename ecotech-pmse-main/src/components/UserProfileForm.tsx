"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { updateUserProfile } from "@/app/actions"
import { Loader2, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

// Define the validation schema
const profileSchema = z.object({
    name: z.string().min(1, "氏名は必須です"),
    affiliation: z.string().optional(),
    zip: z.string()
        .regex(/^\d{7}$/, "郵便番号はハイフンなしの7桁で入力してください")
        .optional()
        .or(z.literal("")),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email().optional(), // Read-only but included in form data
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface UserProfileFormProps {
    initialData: {
        name: string | null
        email: string | null
        affiliation: string | null
        zip: string | null
        address: string | null
        phoneNumber: string | null
        fax: string | null
    }
}

export function UserProfileForm({ initialData }: UserProfileFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: initialData.name || "",
            email: initialData.email || "",
            affiliation: initialData.affiliation || "",
            zip: initialData.zip || "",
            address: initialData.address || "",
            phoneNumber: initialData.phoneNumber || "",
            fax: initialData.fax || "",
        },
    })

    // Address search by zip code
    const handleZipSearch = async () => {
        const zip = form.getValues("zip");
        if (!zip || zip.length !== 7) {
            toast.error("郵便番号は7桁で入力してください");
            return;
        }

        try {
            const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
            const data = await res.json();

            if (data.results) {
                const result = data.results[0];
                const fullAddress = `${result.address1}${result.address2}${result.address3}`;
                form.setValue("address", fullAddress);
                toast.success("住所を自動入力しました");
            } else {
                toast.error("住所が見つかりませんでした");
            }
        } catch (error) {
            console.error(error);
            toast.error("住所検索に失敗しました");
        }
    };

    const onSubmit = async (data: ProfileFormValues) => {
        setIsSubmitting(true)
        try {
            await updateUserProfile(data)
            toast.success("プロフィールを更新しました")
        } catch (error) {
            console.error(error)
            toast.error("更新に失敗しました")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>プロフィール設定</CardTitle>
                <CardDescription>
                    あなたの基本情報を管理します。
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                        {/* 所属 & 氏名 (Swapped) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="affiliation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>所属</FormLabel>
                                        <FormControl>
                                            <Input placeholder="営業部 / ◯◯支店" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ユーザー名</FormLabel>
                                        <FormControl>
                                            <Input placeholder="山田 太郎" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 連絡先 (Email & Phone & Fax) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>メールアドレス (Google)</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled className="bg-slate-100 text-slate-500" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>連絡先 (電話番号)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="090-1234-5678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fax"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>FAX</FormLabel>
                                        <FormControl>
                                            <Input placeholder="03-1234-5678" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* 住所 (Zip & Address) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <FormField
                                    control={form.control}
                                    name="zip"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>郵便番号</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Input placeholder="1234567" maxLength={7} {...field} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="md:col-span-1 pb-2">
                                <Button type="button" variant="outline" size="sm" onClick={handleZipSearch} className="w-full">
                                    住所検索
                                </Button>
                            </div>
                            <div className="md:col-span-2">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>所在地</FormLabel>
                                            <FormControl>
                                                <Input placeholder="東京都..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                ログアウト
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                変更を保存
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
