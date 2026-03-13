import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PromptInput from '../components/PromptInput'
import LoadingSpinner from '../components/LoadingSpinner'
import ParamPanel from '../components/ParamPanel'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'
import { downloadImage, sendToTelegramChat } from '../utils/download'

const MODEL_PARAMS = [
    { key: 'duration', label: 'Длительность (сек)', type: 'slider' as const, min: 2, max: 10, default: 5 },
    { key: 'aspectRatio', label: 'Соотношение сторон', type: 'select' as const, options: ['16:9', '9:16', '1:1'], default: '16:9' },
]

export default function VideoGen() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [prompt, setPrompt] = useState('')
    const [params, setParams] = useState<Record<string, any>>({ duration: 5, aspectRatio: '16:9' })

    const setParam = (key: string, val: any) => setParams(p => ({ ...p, [key]: val }))

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        hapticFeedback('heavy')
        try {
            await generate({ type: 'video', prompt: prompt.trim(), ...params })
        } finally {
            hapticFeedback('medium')
        }
    }

    // Auto-send to chat when result comes in
    const sentRef = useRef(false)

    useEffect(() => {
        if (result?.output_urls?.[0] && !sentRef.current) {
            sentRef.current = true
            sendToTelegramChat('video', { url: result.output_urls[0], prompt })
        }
        if (!result) sentRef.current = false
    }, [result, prompt])

    const outputUrl = result?.output_urls?.[0]

    return (
        <div className="min-h-screen pb-24 px-4 pt-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/20 flex items-center justify-center text-txt-secondary">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🎬 Video Generation</h1>
                    <p className="text-txt-muted text-xs">google/veo-3.1-fast</p>
                </div>
            </div>

            <div className="glass-card p-3 mb-4 border-amber-500/30">
                <p className="text-amber-400 text-xs">⏱ Генерация видео занимает 1–3 минуты</p>
            </div>

            <div className="mb-4">
                <PromptInput value={prompt} onChange={setPrompt} placeholder="Кот играет джаз в баре при свечах..." />
            </div>

            <ParamPanel params={MODEL_PARAMS} values={params} onChange={setParam} />

            <button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="btn-generate mb-6">
                {loading ? '⏳ Генерация видео...' : '🎬 Создать видео'}
            </button>

            {loading && <LoadingSpinner progress="🎬 Генерирую видео..." subtitle="Обычно 1–3 минуты" />}

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 border-red-500/30 mb-4">
                    <p className="text-red-400 text-sm">❌ {error}</p>
                    <button onClick={reset} className="text-accent-primary text-sm mt-2 underline">Попробовать снова</button>
                </motion.div>
            )}

            {outputUrl && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-txt-secondary text-xs">✅ Готово за {((result!.processing_time || 0) / 1000).toFixed(1)} сек</p>
                    <div className="glass-card overflow-hidden">
                        <video src={outputUrl} controls autoPlay loop playsInline className="w-full rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={reset} className="flex-1 py-3 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm">🔄 Новое</button>
                        <button onClick={() => downloadImage(outputUrl, `video-${Date.now()}.mp4`)} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm">
                            <Download size={16} /> Скачать
                        </button>
                        <button onClick={() => sendToTelegramChat('video', { url: outputUrl, prompt })} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-accent-primary text-white text-sm">
                            <Send size={16} /> В чат
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
