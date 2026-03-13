import { Download, Send } from 'lucide-react'
import { downloadImage, sendToTelegramChat } from '../utils/download'

interface ImageCardProps {
    url: string
    prompt?: string
    onSendToChat?: () => void
}

export default function ImageCard({ url, prompt }: ImageCardProps) {
    const handleDownload = async () => {
        await downloadImage(url, `ai-image-${Date.now()}.png`)
    }

    const handleSendToChat = () => {
        sendToTelegramChat('image', { url, prompt })
    }

    return (
        <div className="glass-card overflow-hidden group">
            <div className="relative">
                <img
                    src={url}
                    alt={prompt || 'Generated image'}
                    className="w-full object-cover"
                    loading="lazy"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                    <button
                        onClick={handleSendToChat}
                        title="Отправить в чат"
                        className="w-9 h-9 flex items-center justify-center bg-accent-primary/90 backdrop-blur-md text-white rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                        <Send size={15} />
                    </button>
                    <button
                        onClick={handleDownload}
                        title="Скачать"
                        className="w-9 h-9 flex items-center justify-center bg-black/60 backdrop-blur-md text-white rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                        <Download size={15} />
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
