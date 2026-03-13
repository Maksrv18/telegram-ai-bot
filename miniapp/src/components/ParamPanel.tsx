// ParamPanel — renders configurable parameters for any model
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react'
import { useState } from 'react'

export interface ParamDef {
    key: string
    label: string
    type: 'textarea' | 'slider' | 'select'
    placeholder?: string
    options?: string[]
    min?: number
    max?: number
    step?: number
    default?: number | string
}

interface ParamPanelProps {
    params: ParamDef[]
    values: Record<string, any>
    onChange: (key: string, value: any) => void
}

export default function ParamPanel({ params, values, onChange }: ParamPanelProps) {
    const [open, setOpen] = useState(false)
    if (!params || params.length === 0) return null

    return (
        <div className="glass-card mb-4">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-txt-secondary text-sm"
            >
                <span className="flex items-center gap-2"><Settings2 size={16} /> Параметры</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-4 border-t border-accent-primary/10 pt-3">
                    {params.map(p => (
                        <div key={p.key}>
                            <label className="text-txt-secondary text-xs font-medium block mb-1">{p.label}</label>
                            {p.type === 'textarea' && (
                                <textarea
                                    value={values[p.key] ?? ''}
                                    onChange={e => onChange(p.key, e.target.value)}
                                    placeholder={p.placeholder}
                                    rows={2}
                                    className="w-full bg-bg-primary border border-accent-primary/20 rounded-xl px-3 py-2 text-txt-primary text-sm resize-none outline-none focus:border-accent-primary/50"
                                />
                            )}
                            {p.type === 'slider' && (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={p.min}
                                        max={p.max}
                                        step={p.step || 1}
                                        value={values[p.key] ?? p.default ?? p.min}
                                        onChange={e => onChange(p.key, Number(e.target.value))}
                                        className="flex-1 accent-[var(--accent-primary)]"
                                    />
                                    <span className="text-txt-secondary text-xs w-8 text-right">{values[p.key] ?? p.default ?? p.min}</span>
                                </div>
                            )}
                            {p.type === 'select' && p.options && (
                                <div className="flex flex-wrap gap-2">
                                    {p.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => onChange(p.key, opt)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${(values[p.key] ?? p.default) === opt
                                                ? 'bg-accent-primary text-white'
                                                : 'bg-bg-primary border border-accent-primary/20 text-txt-secondary'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
