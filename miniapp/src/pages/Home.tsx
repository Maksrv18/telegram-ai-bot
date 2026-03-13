import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Image, Wand2, Video, Mic, Globe, MessageCircle } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'

const tools = [
    { path: '/image', icon: Image, title: 'Image Gen', subtitle: 'nano-banana-pro', color: 'from-violet-500 to-indigo-500', glow: 'rgba(108,99,255,0.35)' },
    { path: '/removebg', icon: Wand2, title: 'Remove BG', subtitle: 'bria/remove-background', color: 'from-emerald-400 to-teal-500', glow: 'rgba(52,211,153,0.35)' },
    { path: '/video', icon: Video, title: 'Video Gen', subtitle: 'veo-3.1-fast', color: 'from-orange-400 to-rose-500', glow: 'rgba(251,146,60,0.35)' },
    { path: '/tts', icon: Mic, title: 'Text to Speech', subtitle: 'qwen3-tts', color: 'from-cyan-400 to-blue-500', glow: 'rgba(34,211,238,0.35)' },
    { path: '/videotranslate', icon: Globe, title: 'Video Translate', subtitle: 'heygen', color: 'from-pink-400 to-fuchsia-500', glow: 'rgba(244,114,182,0.35)' },
    { path: '/chat', icon: MessageCircle, title: 'AI Chat', subtitle: 'gemini-3-flash', color: 'from-amber-400 to-yellow-500', glow: 'rgba(251,191,36,0.35)' },
]

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Home() {
    const navigate = useNavigate()
    const { user, hapticFeedback } = useTelegram()

    return (
        <div className="min-h-screen pb-24 px-4 pt-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                    ✨ AI Studio
                </h1>
                <p className="text-txt-secondary text-sm mt-1">
                    {user ? `Привет, ${user.first_name}! 👋` : 'Выбери инструмент'}
                </p>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-3"
            >
                {tools.map((t) => {
                    const Icon = t.icon
                    return (
                        <motion.button
                            key={t.path}
                            variants={item}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { hapticFeedback('medium'); navigate(t.path) }}
                            className="glass-card p-5 flex flex-col items-center gap-3 text-center active:opacity-80 transition-opacity"
                        >
                            <div className={`w-13 h-13 w-14 h-14 rounded-2xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-lg`}>
                                <Icon size={26} className="text-white" />
                            </div>
                            <div>
                                <p className="text-txt-primary font-semibold text-sm">{t.title}</p>
                                <p className="text-txt-muted text-[10px] mt-0.5">{t.subtitle}</p>
                            </div>
                        </motion.button>
                    )
                })}
            </motion.div>
        </div>
    )
}
