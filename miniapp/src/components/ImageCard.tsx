import { Download, Share2 } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'

interface ImageCardProps {
    url: string
    prompt?: string
    onDownload?: () => void
}

export default function ImageCard({ url, prompt, onDownload }: ImageCardProps) {
    const { hapticFeedback } = useTelegram()

    const handleDownload = () => {
        hapticFeedback('medium')
        if (onDownload) {
            onDownload()
        } else {
            window.open(url, '_blank')
        }
    }

    const handleShare = async () => {
        hapticFeedback('medium')
        try {
            if (navigator.share) {
                await navigator.share({ url, title: prompt || 'AI Generated Image' })
            } else {
                await navigator.clipboard.writeText(url)
            }
        } catch { }
    }

    return (
        <div className="glass-card overflow-hidden group">
            <div className="relative">
                <img
                    src={url}
                    alt={prompt || 'Generated image'}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                        <Download size={16} />
                        Скачать
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
                    >
                        <Share2 size={16} />
                        Поделиться
                    </button>
                </div>
            </div>
            {prompt && (
                <div className="p-3">
                    <p className="text-txt-secondary text-xs truncate">{prompt}</p>
                </div>
            )}
        </div>
    )
}
