import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PromptInput from '../components/PromptInput'
import LoadingSpinner from '../components/LoadingSpinner'
import ImageCard from '../components/ImageCard'
import ParamPanel from '../components/ParamPanel'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'
import { downloadImage, sendToTelegramChat } from '../utils/download'
const MODEL_PARAMS = [
    { key: 'aspectRatio', label: 'Соотношение сторон', type: 'select' as const, options: ['1:1', '16:9', '9:16', '4:3', '3:4'], default: '1:1' },
    { key: 'negativePrompt', label: 'Исключить (Negative Prompt)', type: 'textarea' as const, placeholder: 'плохое качество, деформированные руки...' },
    { key: 'guidanceScale', label: 'Guidance Scale', type: 'slider' as const, min: 1, max: 20, default: 7, step: 0.5 },
]

const progress = ['🎨 Запускаю нейросеть...', '⚡ Обрабатываю запрос...', '🖌️ Рисую пиксели...', '✨ Финальные штрихи...']

export default function ImageGen() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [prompt, setPrompt] = useState('')
    const [params, setParams] = useState<Record<string, any>>({ aspectRatio: '1:1', guidanceScale: 7 })
    const [progressIdx, setProgressIdx] = useState(0)

    const setParam = (key: string, val: any) => setParams(p => ({ ...p, [key]: val }))

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        hapticFeedback('heavy')
        const interval = setInterval(() => setProgressIdx(i => (i + 1) % progress.length), 3000)

        try {
            await generate({ type: 'image', prompt: prompt.trim(), ...params })
        } finally {
            clearInterval(interval)
            hapticFeedback('medium')
        }
    }

    // Auto-send to chat when result comes in
    const sentRef = useRef(false)

    useEffect(() => {
        if (result?.output_urls?.[0] && !sentRef.current) {
            sentRef.current = true
            sendToTelegramChat('image', { url: result.output_urls[0], prompt })
        }
        if (!result) sentRef.current = false
    }, [result, prompt])

    return (
        <div className="min-h-screen pb-24 px-4 pt-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🎨 Image Generation</h1>
                    <p className="text-txt-muted text-xs">google/nano-banana-pro</p>
                </div>
            </div>

            <div className="mb-4">
                <PromptInput value={prompt} onChange={setPrompt} placeholder="Киберпанк кот на неоновой улице под дождём..." />
            </div>

            <ParamPanel params={MODEL_PARAMS} values={params} onChange={setParam} />

            <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="btn-generate mb-6">
                {loading ? '⏳ Генерация...' : '🚀 Сгенерировать'}
            </button>

            {loading && <LoadingSpinner progress={progress[progressIdx]} subtitle="Обычно 5–30 секунд" />}

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 border-red-500/30 mb-4">
                    <p className="text-red-400 text-sm">❌ {error}</p>
                    <button onClick={reset} className="text-accent-primary text-sm mt-2 underline">Попробовать снова</button>
                </motion.div>
            )}

            {result?.output_urls && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-txt-secondary text-xs">✅ Готово за {((result.processing_time || 0) / 1000).toFixed(1)} сек</p>
                    {result.output_urls.map((url, i) => (
                        <ImageCard key={i} url={url} prompt={prompt} />
                    ))}
                </motion.div>
            )}
        </div>
    )
}
