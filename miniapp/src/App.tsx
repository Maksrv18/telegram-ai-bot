import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import ImageGen from './pages/ImageGen'
import VideoGen from './pages/VideoGen'
import RemoveBg from './pages/RemoveBg'
import TextToSpeech from './pages/TextToSpeech'
import VideoTranslate from './pages/VideoTranslate'
import AiChat from './pages/AiChat'
import History from './pages/History'

export default function App() {
    return (
        <BrowserRouter basename="/miniapp">
            <div className="min-h-screen bg-bg-primary text-txt-primary font-body relative">
                {/* Animated background orbs */}
                <div className="bg-orbs">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>

                {/* Main content */}
                <main className="relative z-10">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/image" element={<ImageGen />} />
                        <Route path="/video" element={<VideoGen />} />
                        <Route path="/removebg" element={<RemoveBg />} />
                        <Route path="/tts" element={<TextToSpeech />} />
                        <Route path="/videotranslate" element={<VideoTranslate />} />
                        <Route path="/chat" element={<AiChat />} />
                        <Route path="/history" element={<History />} />
                    </Routes>
                </main>

                {/* Bottom Navigation */}
                <BottomNav />

                {/* Toast notifications */}
                <Toaster
                    position="top-center"
                    toastOptions={{
                        style: {
                            background: '#12121A',
                            color: '#F0F0FF',
                            border: '1px solid rgba(108, 99, 255, 0.3)',
                            borderRadius: '12px',
                        },
                    }}
                />
            </div>
        </BrowserRouter>
    )
}
