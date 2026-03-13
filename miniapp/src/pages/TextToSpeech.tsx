import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Send, Play, Square } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import ParamPanel from '../components/ParamPanel'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'
import { downloadImage, sendToTelegramChat } from '../utils/download'

const MODEL_PARAMS = [
    { key: 'voice', label: 'Голос', type: 'select' as const, options: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'], default: 'nova' },
    { key: 'speed', label: 'Скорость речи', type: 'slider' as const, min: 0.5, max: 2.0, step: 0.1, default: 1.0 },
]

export default function TextToSpeech() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [text, setText] = useState('')
    const [params, setParams] = useState<Record<string, any>>({ voice: 'nova', speed: 1.0 })
    const [playing, setPlaying] = useState(false)
    const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null)

    const setParam = (key: string, val: any) => setParams(p => ({ ...p, [key]: val }))

    const handleGenerate = async () => {
        if (!text.trim()) return
        hapticFeedback('heavy')
        await generate({ type: 'tts', prompt: text.trim(), ...params })
        hapticFeedback('medium')
    }

    const togglePlay = (url: string) => {
        if (playing && audioEl) {
            audioEl.pause()
            setPlaying(false)
            return
        }
        const audio = new Audio(url)
        audio.onended = () => setPlaying(false)
        audio.play()
        setAudioEl(audio)
        setPlaying(true)
    }

    const outputUrl = result?.output_urls?.[0]

    return (
        <div className="min-h-screen pb-24 px-4 pt-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/20 flex items-center justify-center text-txt-secondary">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🎙️ Text to Speech</h1>
                    <p className="text-txt-muted text-xs">qwen/qwen3-tts</p>
                </div>
            </div>

            <div className="mb-4">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Введите текст для озвучки..."
                    rows={5}
                    className="w-full bg-bg-card border border-accent-primary/20 rounded-2xl px-4 py-3 text-txt-primary text-sm resize-none outline-none focus:border-accent-primary/50 transition-colors"
                />
                <p className="text-txt-muted text-xs mt-1 text-right">{text.length} символов</p>
            </div>

            <ParamPanel params={MODEL_PARAMS} values={params} onChange={setParam} />

            <button onClick={handleGenerate} disabled={loading || !text.trim()} className="btn-generate mb-6">
                {loading ? '⏳ Озвучиваю...' : '🎙️ Озвучить'}
            </button>

            {loading && <LoadingSpinner progress="🎙️ Генерирую голос..." subtitle="qwen/qwen3-tts" />}

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 border-red-500/30 mb-4">
                    <p className="text-red-400 text-sm">❌ {error}</p>
                    <button onClick={reset} className="text-accent-primary text-sm mt-2 underline">Попробовать снова</button>
                </motion.div>
            )}

            {outputUrl && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-txt-secondary text-xs">✅ Готово за {((result!.processing_time || 0) / 1000).toFixed(1)} сек</p>
                    <div className="glass-card p-4 flex items-center gap-4">
                        <button
                            onClick={() => togglePlay(outputUrl)}
                            className="w-12 h-12 rounded-full bg-accent-primary flex items-center justify-center text-white flex-shrink-0 shadow-lg"
                        >
                            {playing ? <Square size={20} /> : <Play size={20} />}
                        </button>
                        <div className="flex-1">
                            <p className="text-txt-primary text-sm font-medium">AI Voice</p>
                            <p className="text-txt-muted text-xs">{params.voice} · {params.speed}x скорость</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={reset} className="flex-1 py-3 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm">🔄 Новый</button>
                        <button onClick={() => downloadImage(outputUrl, `tts-${Date.now()}.mp3`)} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm">
                            <Download size={16} /> Скачать
                        </button>
                        <button onClick={() => sendToTelegramChat('audio', { url: outputUrl, prompt: text })} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-accent-primary text-white text-sm">
                            <Send size={16} /> В чат
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
