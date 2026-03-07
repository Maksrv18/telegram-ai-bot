import { useState } from 'react'

interface PromptInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    maxLength?: number
}

export default function PromptInput({ value, onChange, placeholder, maxLength = 500 }: PromptInputProps) {
    const [focused, setFocused] = useState(false)

    return (
        <div className={`relative rounded-2xl transition-all duration-300 ${focused ? 'ring-2 ring-accent-primary/50 shadow-glow-primary' : ''
            }`}>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder || 'Опишите что хотите создать...'}
                maxLength={maxLength}
                rows={3}
                className="w-full bg-bg-card border border-accent-primary/20 rounded-2xl p-4 text-txt-primary placeholder-txt-muted resize-none focus:outline-none text-sm leading-relaxed"
            />
            <div className="absolute bottom-2 right-3 text-txt-muted text-xs">
                {value.length}/{maxLength}
            </div>
        </div>
    )
}
