import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PromptInput from '../components/PromptInput'
import LoadingSpinner from '../components/LoadingSpinner'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'

export default function VideoGen() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [prompt, setPrompt] = useState('')

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        hapticFeedback('heavy')

        await generate({
            type: 'video',
            prompt: prompt.trim(),
        })

        hapticFeedback('medium')
    }

    return (
        <div className="min-h-screen pb-20 px-4 pt-6 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/20 flex items-center justify-center text-txt-secondary hover:text-txt-primary transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🎬 Video Gen</h1>
                    <p className="text-txt-muted text-xs">Генерация видео из текста</p>
                </div>
            </div>

            {/* Warning */}
            <div className="glass-card p-3 mb-4 border-accent-warning/30">
                <p className="text-accent-warning text-xs">⏱ Генерация видео занимает 1-3 минуты</p>
            </div>

            {/* Prompt Input */}
            <div className="mb-6">
                <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    placeholder="Кот играет на пианино в джаз-клубе..."
                />
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="btn-generate mb-6"
            >
                {loading ? '⏳ Генерация видео...' : '🎬 Создать видео'}
            </button>

            {/* Loading */}
            {loading && (
                <LoadingSpinner
                    progress="🎬 Создаю видео..."
                    subtitle="Обычно занимает 1-3 минуты"
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
                    className="glass-card overflow-hidden"
                >
                    <video
                        src={result.output_urls[0]}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full rounded-xl"
                    />
                    <div className="p-3">
                        <p className="text-txt-secondary text-xs">
                            ✅ Готово за {((result.processing_time || 0) / 1000).toFixed(1)} сек
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
