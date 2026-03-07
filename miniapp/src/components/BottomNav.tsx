import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Image, Wand2, Video, Clock } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'

const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/image', icon: Image, label: 'Image' },
    { path: '/removebg', icon: Wand2, label: 'BG' },
    { path: '/video', icon: Video, label: 'Video' },
    { path: '/history', icon: Clock, label: 'History' },
]

export default function BottomNav() {
    const location = useLocation()
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/80 backdrop-blur-xl border-t border-accent-primary/10">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                {tabs.map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path
                    return (
                        <button
                            key={path}
                            onClick={() => {
                                hapticFeedback('light')
                                navigate(path)
                            }}
                            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${active
                                    ? 'text-accent-primary scale-105'
                                    : 'text-txt-muted hover:text-txt-secondary'
                                }`}
                        >
                            <Icon
                                size={22}
                                strokeWidth={active ? 2.5 : 1.8}
                                className={active ? 'drop-shadow-[0_0_8px_rgba(108,99,255,0.6)]' : ''}
                            />
                            <span className="text-[10px] font-medium">{label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
