import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { downloadImage } from '../utils/download'
import LoadingSpinner from '../components/LoadingSpinner'
import ImageCard from '../components/ImageCard'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'

export default function RemoveBg() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [preview, setPreview] = useState<string | null>(null)

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        hapticFeedback('medium')

        const reader = new FileReader()
        reader.onload = (ev) => {
            setPreview(ev.target?.result as string)
        }
        reader.readAsDataURL(file)
    }, [hapticFeedback])

    const handleRemoveBg = async () => {
        if (!preview) return
        hapticFeedback('heavy')

        await generate({
            type: 'removebg',
            imageUrl: preview,
        })

        hapticFeedback('medium')
    }

    return (
        <div className="min-h-screen pb-20 px-4 pt-6 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/20 flex items-center justify-center text-txt-secondary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🪄 Remove BG</h1>
                    <p className="text-txt-muted text-xs">Удаление фона с изображений</p>
                </div>
            </div>

            {/* Upload Zone */}
            {!preview && (
                <label className="glass-card flex flex-col items-center justify-center p-12 cursor-pointer border-dashed border-2 border-accent-primary/30 hover:border-accent-primary/60 transition-colors">
                    <Upload size={48} className="text-accent-primary/40 mb-4" />
                    <p className="text-txt-secondary text-sm font-medium">📁 Загрузить фото</p>
                    <p className="text-txt-muted text-xs mt-1">Нажмите для выбора файла</p>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>
            )}

            {/* Preview */}
            {preview && !result && (
                <div className="mb-4">
                    <div className="glass-card overflow-hidden mb-4">
                        <img src={preview} alt="Original" className="w-full rounded-xl" />
                    </div>
                    <button
                        onClick={handleRemoveBg}
                        disabled={loading}
                        className="btn-generate"
                    >
                        {loading ? '⏳ Удаляю фон...' : '🪄 Убрать фон'}
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <LoadingSpinner
                    progress="🪄 Убираю фон..."
                    subtitle="RemBG AI"
                />
            )}

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-4 border-accent-error/30 mb-4"
                >
                    <p className="text-accent-error text-sm">❌ {error}</p>
                    <button onClick={reset} className="text-accent-primary text-sm mt-2 underline">
                        Попробовать снова
                    </button>
                </motion.div>
            )}

            {/* Result */}
            {result && result.output_urls && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <p className="text-txt-secondary text-xs">
                        ✅ Фон удалён за {((result.processing_time || 0) / 1000).toFixed(1)} сек
                    </p>

                    {/* Checkerboard background to show transparency */}
                    <div className="glass-card overflow-hidden">
                        <div
                            className="relative"
                            style={{
                                backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                            }}
                        >
                            <img src={result.output_urls[0]} alt="Without background" className="w-full" />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full mt-4">
                        <button
                            onClick={() => {
                                setPreview(null)
                                reset()
                            }}
                            className="flex-1 py-3 rounded-xl bg-bg-card border border-accent-primary/20 text-txt-secondary text-sm font-medium hover:border-accent-primary/40 transition-colors"
                        >
                            🔄 Новое
                        </button>
                        <button
                            onClick={() => downloadImage(result.output_urls?.[0] || '', `nobg-${Date.now()}.png`)}
                            className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
                        >
                            <Download size={16} /> Скачать
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
