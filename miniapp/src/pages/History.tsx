import { motion } from 'framer-motion'
import { ArrowLeft, Image, Video, Sparkles, Wand2, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
    image: { icon: Image, color: 'text-purple-400', label: 'Изображение' },
    video: { icon: Video, color: 'text-orange-400', label: 'Видео' },
    upscale: { icon: Sparkles, color: 'text-cyan-400', label: 'Улучшение' },
    removebg: { icon: Wand2, color: 'text-green-400', label: 'Фон удалён' },
    chat: { icon: MessageCircle, color: 'text-blue-400', label: 'Чат' },
}

export default function History() {
    const navigate = useNavigate()
    const { history, loading } = useHistory()

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
                    <h1 className="font-heading text-xl font-bold text-txt-primary">🕐 History</h1>
                    <p className="text-txt-muted text-xs">Ваши генерации</p>
                </div>
            </div>

            {loading && (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-txt-muted text-sm">Загрузка...</p>
                </div>
            )}

            {!loading && history.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-txt-muted text-4xl mb-3">📭</p>
                    <p className="text-txt-secondary text-sm">Пока нет генераций</p>
                    <button
                        onClick={() => navigate('/image')}
                        className="mt-4 px-6 py-2 bg-accent-primary/20 text-accent-primary rounded-xl text-sm font-medium"
                    >
                        Создать первую
                    </button>
                </div>
            )}

            {!loading && history.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                >
                    {history.map((item, i) => {
                        const config = typeConfig[item.type] || typeConfig.image
                        const Icon = config.icon
                        const statusIcon = item.status === 'done' ? '✅' : item.status === 'failed' ? '❌' : '⏳'
                        const date = new Date(item.created_at).toLocaleString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                        })

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => {
                                    if (item.output_urls && item.output_urls[0]) {
                                        window.open(item.output_urls[0], '_blank')
                                    }
                                }}
                                className="glass-card p-3 flex gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                            >
                                {/* Thumbnail */}
                                {item.output_urls && item.output_urls[0] && item.type !== 'chat' ? (
                                    <img
                                        src={item.output_urls[0]}
                                        alt=""
                                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className={`w-14 h-14 rounded-xl bg-bg-secondary flex items-center justify-center flex-shrink-0 ${config.color}`}>
                                        <Icon size={24} />
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs">{statusIcon}</span>
                                        <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                                    </div>
                                    <p className="text-txt-primary text-sm truncate mt-0.5">
                                        {item.prompt || item.type}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-txt-muted text-[10px]">{date}</span>
                                        {item.processing_time && (
                                            <span className="text-txt-muted text-[10px]">
                                                ⏱ {(item.processing_time / 1000).toFixed(1)}s
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            )}
        </div>
    )
}
