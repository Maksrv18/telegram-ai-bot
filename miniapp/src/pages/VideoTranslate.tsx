import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import ParamPanel from '../components/ParamPanel'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'
import { downloadImage, sendToTelegramChat } from '../utils/download'

const MODEL_PARAMS = [
    {
        key: 'targetLanguage', label: 'Язык перевода', type: 'select' as const,
        options: ['Russian', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic', 'Portuguese'],
        default: 'Russian'
    },
    { key: 'speakerGender', label: 'Пол спикера', type: 'select' as const, options: ['male', 'female'], default: 'male' },
]

export default function VideoTranslate() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [videoUrl, setVideoUrl] = useState('')
    const [params, setParams] = useState<Record<string, any>>({ targetLanguage: 'Russian', speakerGender: 'male' })

    const setParam = (key: string, val: any) => setParams(p => ({ ...p, [key]: val }))

    const handleTranslate = async () => {
        if (!videoUrl.trim()) return
        hapticFeedback('heavy')
        try {
            await generate({ type: 'videotranslate', videoUrl: videoUrl.trim(), ...params })
        } finally {
            hapticFeedback('medium')
        }
    }

    // Auto-send to chat when result comes in
    const sentRef = useRef(false)

    useEffect(() => {
        if (result?.output_urls?.[0] && !sentRef.current) {
            sentRef.current = true
            sendToTelegramChat('video', { url: result.output_urls[0] })
        }
        if (!result) sentRef.current = false
    }, [result])

    const outputUrl = result?.output_urls?.[0]

    return (
        <div className="min-h-screen pb-24 px-4 pt-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🌐 Video Translate</h1>
                    <p className="text-txt-muted text-xs">heygen/video-translate</p>
                </div>
            </div>

            <div className="glass-card p-3 mb-4 border-amber-500/30">
                <p className="text-amber-400 text-xs">⏱ Перевод видео занимает несколько минут</p>
            </div>

            <div className="mb-4">
                <label className="text-txt-secondary text-xs font-medium block mb-2">Ссылка на видео (URL)</label>
                <input
                    type="url"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full bg-bg-card border border-accent-primary/20 rounded-2xl px-4 py-3 text-txt-primary text-sm outline-none focus:border-accent-primary/50 transition-colors"
                />
            </div>

            <ParamPanel params={MODEL_PARAMS} values={params} onChange={setParam} />

            <button onClick={handleTranslate} disabled={loading || !videoUrl.trim()} className="btn-generate mb-6">
                {loading ? '⏳ Переводю...' : '🌐 Перевести видео'}
            </button>

            {loading && <LoadingSpinner progress="🌐 Перевожу видео..." subtitle="heygen/video-translate" />}

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
                        <button onClick={() => downloadImage(outputUrl, `translated-${Date.now()}.mp4`)} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm">
                            <Download size={16} /> Скачать
                        </button>
                        <button onClick={() => sendToTelegramChat('video', { url: outputUrl })} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-accent-primary text-white text-sm">
                            <Send size={16} /> В чат
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
