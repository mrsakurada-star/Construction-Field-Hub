"use client"

import { useCallback, useState, useTransition } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { analyzeAndCreateRequest } from "./actions"
import { Button } from "@/components/ui/button"

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selected = acceptedFiles[0]
        if (!selected) return

        setFile(selected)

        // Create preview
        if (selected.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(selected)
        } else {
            setPreview(null)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'application/pdf': []
        },
        maxFiles: 1
    })

    const handleUpload = () => {
        if (!file) return

        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.append("file", file)

                const result = await analyzeAndCreateRequest(formData)

                if (result.success) {
                    toast.success("解析・登録が完了しました")
                    router.push(`/requests/${result.id}`)
                }
            } catch (error) {
                console.error(error)
                toast.error(error instanceof Error ? error.message : "エラーが発生しました")
            }
        })
    }

    return (
        <div className="mx-auto max-w-4xl p-6">
            <h1 className="mb-6 text-2xl font-bold">依頼インポート (AI解析)</h1>
            <p className="mb-6 text-gray-600">
                依頼書(PDF)や現場の写真(JPEG/PNG)をアップロードしてください。
                AIが内容を解析し、自動的に依頼データを作成します。
            </p>

            <div
                {...getRootProps()}
                className={`
                    cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors
                    ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                    ${file ? "bg-gray-50" : "bg-white"}
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="rounded-full bg-gray-100 p-4">
                        <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                    {file ? (
                        <div className="space-y-2">
                            <p className="text-lg font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            {preview && (
                                <div className="mt-4 flex justify-center">
                                    <Image
                                        src={preview}
                                        alt="Preview"
                                        width={500}
                                        height={500}
                                        className="max-h-64 w-auto rounded-lg border shadow-sm"
                                        unoptimized
                                    />
                                </div>
                            )}
                            {!preview && file.type === "application/pdf" && (
                                <div className="mt-4 flex flex-col items-center text-gray-400">
                                    <FileText className="h-16 w-16" />
                                    <span>PDF Document</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="text-lg font-medium text-gray-900">
                                ファイルをドラッグ＆ドロップ、またはクリックして選択
                            </p>
                            <p className="text-sm text-gray-500">
                                対応フォーマット: PDF, JPEG, PNG
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {file && (
                <div className="mt-8 flex justify-end">
                    <Button
                        size="lg"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleUpload()
                        }}
                        disabled={isPending}
                        className="w-full sm:w-auto"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                AI解析中...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                解析して取り込む
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
