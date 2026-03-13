import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Image, Video, Clock, LayoutGrid } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'

const tabs = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/image', icon: Image, label: 'Картинка' },
    { path: '/video', icon: Video, label: 'Видео' },
    { path: '/chat', icon: LayoutGrid, label: 'Чат' },
    { path: '/history', icon: Clock, label: 'История' },
]

export default function BottomNav() {
    const location = useLocation()
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/90 backdrop-blur-xl border-t border-accent-primary/10"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
                {tabs.map(({ path, icon: Icon, label }) => {
                    const active = location.pathname === path
                    return (
                        <button
                            key={path}
                            onClick={() => { hapticFeedback('light'); navigate(path) }}
                            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${active ? 'text-accent-primary' : 'text-txt-muted'}`}
                        >
                            <Icon
                                size={22}
                                strokeWidth={active ? 2.5 : 1.8}
                                className={active ? 'drop-shadow-[0_0_8px_rgba(108,99,255,0.7)]' : ''}
                            />
                            <span className="text-[9px] font-medium leading-tight">{label}</span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}
