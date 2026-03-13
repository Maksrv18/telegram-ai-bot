import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { downloadImage } from '../utils/download'
import LoadingSpinner from '../components/LoadingSpinner'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'

export default function Enhance() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [preview, setPreview] = useState<string | null>(null)
    const [sliderPos, setSliderPos] = useState(50)

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

    const handleEnhance = async () => {
        if (!preview) return
        hapticFeedback('heavy')

        await generate({
            type: 'upscale',
            imageUrl: preview,
        })

        hapticFeedback('medium')
    }

    const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
        setSliderPos(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
    }

    return (
        <div className="min-h-screen pb-20 px-4 pt-6 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">✨ Enhance</h1>
                    <p className="text-txt-muted text-xs">Улучшение качества в 4x</p>
                </div>
            </div>

            {/* Upload Zone */}
            {!preview && (
                <label className="glass-card flex flex-col items-center justify-center p-12 cursor-pointer border-dashed border-2 border-accent-primary/30 hover:border-accent-primary/60 transition-colors">
                    <Upload size={48} className="text-accent-primary/40 mb-4" />
                    <p className="text-txt-secondary text-sm font-medium">📁 Перетащи фото сюда</p>
                    <p className="text-txt-muted text-xs mt-1">или нажми для выбора</p>
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
                        onClick={handleEnhance}
                        disabled={loading}
                        className="btn-generate"
                    >
                        {loading ? '⏳ Улучшаю...' : '✨ Улучшить в 4x'}
                    </button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <LoadingSpinner
                    progress="✨ Улучшаю изображение..."
                    subtitle="Real-ESRGAN 4x"
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

            {/* Before/After Slider */}
            {result && result.output_urls && preview && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <p className="text-txt-secondary text-xs mb-2">
                        ✅ Готово за {((result.processing_time || 0) / 1000).toFixed(1)} сек
                    </p>
                    <div
                        className="relative overflow-hidden rounded-2xl select-none cursor-ew-resize"
                        onMouseMove={handleSliderMove}
                        onTouchMove={handleSliderMove}
                    >
                        {/* After image (bottom) */}
                        <img src={result.output_urls[0]} className="w-full" alt="Enhanced" />

                        {/* Before image (clipped) */}
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${sliderPos}%` }}
                        >
                            <img
                                src={preview}
                                className="absolute inset-0 w-full h-full object-cover"
                                alt="Original"
                            />
                        </div>

                        {/* Divider */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                            style={{ left: `${sliderPos}%` }}
                        >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <span className="text-gray-800 text-xs font-bold">↔</span>
                            </div>
                        </div>

                        {/* Labels */}
                        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">До</div>
                        <div className="absolute top-3 right-3 bg-accent-primary/80 text-white text-xs px-2 py-1 rounded-lg">После</div>
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
                            onClick={() => downloadImage(result.output_urls?.[0] || '', `enhanced-${Date.now()}.png`)}
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
