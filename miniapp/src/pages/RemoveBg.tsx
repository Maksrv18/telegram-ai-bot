import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Download, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'
import { downloadImage, sendToTelegramChat } from '../utils/download'

export default function RemoveBg() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [preview, setPreview] = useState<string | null>(null)

    const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        hapticFeedback('medium')
        const reader = new FileReader()
        reader.onload = ev => setPreview(ev.target?.result as string)
        reader.readAsDataURL(file)
    }, [hapticFeedback])

    const handleRemoveBg = async () => {
        if (!preview) return
        hapticFeedback('heavy')
        await generate({ type: 'removebg', imageUrl: preview })
        hapticFeedback('medium')
    }

    const outputUrl = result?.output_urls?.[0]

    return (
        <div className="min-h-screen pb-24 px-4 pt-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/20 flex items-center justify-center text-txt-secondary">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🪄 Remove Background</h1>
                    <p className="text-txt-muted text-xs">bria/remove-background</p>
                </div>
            </div>

            {!preview && (
                <label className="glass-card flex flex-col items-center justify-center p-12 cursor-pointer border-dashed border-2 border-accent-primary/30 hover:border-accent-primary/60 transition-colors">
                    <Upload size={48} className="text-accent-primary/40 mb-4" />
                    <p className="text-txt-secondary text-sm font-medium">📁 Выбрать фото</p>
                    <p className="text-txt-muted text-xs mt-1">Нажмите для загрузки</p>
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
            )}

            {preview && !result && (
                <div className="mb-4">
                    <div className="glass-card overflow-hidden mb-4">
                        <img src={preview} alt="Original" className="w-full rounded-xl" />
                    </div>
                    <button onClick={handleRemoveBg} disabled={loading} className="btn-generate">
                        {loading ? '⏳ Удаляю фон...' : '🪄 Убрать фон'}
                    </button>
                </div>
            )}

            {loading && <LoadingSpinner progress="🪄 Обрабатываю изображение..." subtitle="bria/remove-background" />}

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
                        <div
                            className="relative"
                            style={{
                                backgroundImage: 'linear-gradient(45deg,#222 25%,transparent 25%),linear-gradient(-45deg,#222 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#222 75%),linear-gradient(-45deg,transparent 75%,#222 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0,0 10px,10px -10px,-10px 0px',
                            }}
                        >
                            <img src={outputUrl} alt="No background" className="w-full" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setPreview(null); reset() }} className="flex-1 py-3 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm">
                            🔄 Новое
                        </button>
                        <button onClick={() => downloadImage(outputUrl, `nobg-${Date.now()}.png`)} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm">
                            <Download size={16} /> Скачать
                        </button>
                        <button onClick={() => sendToTelegramChat('image', { url: outputUrl })} className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-accent-primary text-white text-sm">
                            <Send size={16} /> В чат
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
