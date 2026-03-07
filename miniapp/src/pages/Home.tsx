import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Image, Sparkles, Wand2, Video, MessageCircle } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'

const features = [
    {
        path: '/image',
        icon: Image,
        title: 'Image Gen',
        subtitle: 'FLUX & SDXL',
        color: 'from-purple-500 to-blue-500',
        glow: 'rgba(108, 99, 255, 0.3)',
    },
    {
        path: '/enhance',
        icon: Sparkles,
        title: 'Enhance',
        subtitle: 'Upscale 4x',
        color: 'from-cyan-400 to-blue-500',
        glow: 'rgba(0, 217, 255, 0.3)',
    },
    {
        path: '/removebg',
        icon: Wand2,
        title: 'Remove BG',
        subtitle: 'AI Background',
        color: 'from-green-400 to-emerald-500',
        glow: 'rgba(0, 255, 159, 0.3)',
    },
    {
        path: '/video',
        icon: Video,
        title: 'Video Gen',
        subtitle: 'Text to Video',
        color: 'from-orange-400 to-red-500',
        glow: 'rgba(255, 184, 0, 0.3)',
    },
]

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
}

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
}

export default function Home() {
    const navigate = useNavigate()
    const { user, hapticFeedback } = useTelegram()

    return (
        <div className="min-h-screen pb-20 px-4 pt-8 relative z-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                    ✨ AI Studio
                </h1>
                <p className="text-txt-secondary text-sm mt-1">
                    {user ? `Привет, ${user.first_name}!` : 'Powered by Replicate'}
                </p>
            </motion.div>

            {/* Feature Grid */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3 mb-6"
            >
                {features.map((feature) => (
                    <motion.button
                        key={feature.path}
                        variants={item}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            hapticFeedback('medium')
                            navigate(feature.path)
                        }}
                        className="glass-card p-5 flex flex-col items-center gap-3 text-center"
                        style={{ boxShadow: `0 0 0 0 ${feature.glow}` }}
                    >
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                            <feature.icon size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-txt-primary font-semibold text-sm">{feature.title}</p>
                            <p className="text-txt-muted text-xs mt-0.5">{feature.subtitle}</p>
                        </div>
                    </motion.button>
                ))}
            </motion.div>

            {/* AI Chat Card */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    hapticFeedback('medium')
                    navigate('/image')
                }}
                className="glass-card w-full p-4 flex items-center gap-4"
            >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={20} className="text-white" />
                </div>
                <div className="text-left">
                    <p className="text-txt-primary font-semibold text-sm">💬 AI Chat</p>
                    <p className="text-txt-muted text-xs">Llama 3.1 — спроси что угодно</p>
                </div>
            </motion.button>
        </div>
    )
}
