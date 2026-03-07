import { Download, Share2 } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'
import { downloadImage } from '../utils/download'

interface ImageCardProps {
    url: string
    prompt?: string
    onDownload?: () => void
}

export default function ImageCard({ url, prompt, onDownload }: ImageCardProps) {
    const { hapticFeedback } = useTelegram()

    const handleDownload = async () => {
        hapticFeedback('medium')
        if (onDownload) {
            onDownload()
        } else {
            await downloadImage(url, `ai-generated-${Date.now()}.png`);
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
                {/* Permanent action buttons below image */}
                <div className="absolute top-2 right-2 flex gap-2">
                    <button
                        onClick={handleShare}
                        className="w-8 h-8 flex items-center justify-center bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors shadow-lg"
                    >
                        <Share2 size={14} />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="w-8 h-8 flex items-center justify-center bg-accent-primary/80 backdrop-blur-md text-white rounded-full hover:bg-accent-primary transition-colors shadow-lg"
                    >
                        <Download size={14} />
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
