import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PromptInput from '../components/PromptInput'
import ModelSelector from '../components/ModelSelector'
import LoadingSpinner from '../components/LoadingSpinner'
import ImageCard from '../components/ImageCard'
import { useReplicate } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'

const models = [
    { id: 'flux_schnell', name: 'FLUX Schnell', emoji: '⚡' },
    { id: 'flux_dev', name: 'FLUX Dev', emoji: '🎯' },
    { id: 'sdxl', name: 'SDXL', emoji: '🖼️' },
]

const aspects = ['1:1', '16:9', '9:16', '4:3']

const progressMessages = [
    '🎨 Запускаю нейросеть...',
    '⚡ Обрабатываю запрос...',
    '🖌️ Рисую пиксели...',
    '✨ Почти готово...',
    '🔮 Финальные штрихи...',
]

export default function ImageGen() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading, error, result, reset } = useReplicate()
    const [prompt, setPrompt] = useState('')
    const [model, setModel] = useState('flux_schnell')
    const [aspect, setAspect] = useState('1:1')
    const [progressIdx, setProgressIdx] = useState(0)

    const handleGenerate = async () => {
        if (!prompt.trim()) return
        hapticFeedback('heavy')

        // Start progress animation
        const interval = setInterval(() => {
            setProgressIdx(prev => (prev + 1) % progressMessages.length)
        }, 3000)

        await generate({
            type: 'image',
            prompt: prompt.trim(),
            model,
            aspectRatio: aspect,
            numOutputs: 1,
        })

        clearInterval(interval)
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
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🎨 Image Gen</h1>
                    <p className="text-txt-muted text-xs">Генерация изображений AI</p>
                </div>
            </div>

            {/* Model Selector */}
            <div className="mb-4">
                <ModelSelector models={models} selected={model} onChange={setModel} />
            </div>

            {/* Prompt Input */}
            <div className="mb-4">
                <PromptInput
                    value={prompt}
                    onChange={setPrompt}
                    placeholder="a cyberpunk cat riding a neon motorcycle through rain..."
                />
            </div>

            {/* Aspect Ratio */}
            <div className="mb-6">
                <p className="text-txt-secondary text-xs font-medium mb-2">Соотношение сторон</p>
                <div className="flex gap-2">
                    {aspects.map(a => (
                        <button
                            key={a}
                            onClick={() => {
                                hapticFeedback('light')
                                setAspect(a)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${aspect === a
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-bg-card border border-accent-primary/20 text-txt-secondary'
                                }`}
                        >
                            {a}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="btn-generate mb-6"
            >
                {loading ? '⏳ Генерация...' : '🚀 Сгенерировать'}
            </button>

            {/* Loading State */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <LoadingSpinner
                        progress={progressMessages[progressIdx]}
                        subtitle="Обычно занимает 5-30 секунд"
                    />
                </motion.div>
            )}

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-card p-4 border-accent-error/30 mb-4"
                >
                    <p className="text-accent-error text-sm">❌ {error}</p>
                    <button
                        onClick={reset}
                        className="text-accent-primary text-sm mt-2 underline"
                    >
                        Попробовать снова
                    </button>
                </motion.div>
            )}

            {/* Results */}
            {result && result.output_urls && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                >
                    <p className="text-txt-secondary text-xs">
                        ✅ Готово за {((result.processing_time || 0) / 1000).toFixed(1)} сек
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        {result.output_urls.map((url, i) => (
                            <ImageCard key={i} url={url} prompt={prompt} />
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    )
}
