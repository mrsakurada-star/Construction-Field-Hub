"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { getSuggestions } from "@/app/actions"

interface AutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
    fieldName: string // The field name to search in DB (e.g., 'primeName')
    value: string
    onChangeValue: (value: string) => void
    placeholder?: string
}

export function Autocomplete({ fieldName, value, onChangeValue, placeholder, className, ...props }: AutocompleteProps) {
    const [open, setOpen] = React.useState(false)
    const [suggestions, setSuggestions] = React.useState<string[]>([])

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (open && value.length >= 2) {
                try {
                    const res = await getSuggestions(fieldName, value)
                    setSuggestions(res)
                } catch (e) {
                    console.error(e)
                }
            } else {
                setSuggestions([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [value, fieldName, open])

    return (
        <div className="relative w-full">
            <Input
                value={value}
                onChange={(e) => {
                    onChangeValue(e.target.value)
                    setOpen(true)
                    props.onChange?.(e)
                }}
                onFocus={() => setOpen(true)}
                onBlur={(e) => {
                    // Delay closing to allow clicking on the dropdown
                    setTimeout(() => setOpen(false), 200)
                    props.onBlur?.(e)
                }}
                placeholder={placeholder}
                autoComplete="off"
                className={className}
                {...props}
            />
            {open && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={index}
                            className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                            onMouseDown={(e) => {
                                // Prevent Input blur from firing before click
                                e.preventDefault()
                            }}
                            onClick={() => {
                                onChangeValue(suggestion)
                                // Trigger plain 'change' event manually if needed by parent logic (e.g. for kana)
                                // But onChangeValue should handle the value update.
                                setOpen(false)
                            }}
                        >
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
