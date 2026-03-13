import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Copy, Check, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ParamPanel from '../components/ParamPanel'
import { useReplicate, GenerationResult } from '../hooks/useReplicate'
import { useTelegram } from '../hooks/useTelegram'
import { copyText, sendToTelegramChat } from '../utils/download'

const MODEL_PARAMS = [
    { key: 'systemPrompt', label: 'Системный промпт', type: 'textarea' as const, placeholder: 'You are a helpful assistant...' },
    { key: 'temperature', label: 'Температура (0 = точно, 1 = креативно)', type: 'slider' as const, min: 0, max: 1, step: 0.1, default: 0.7 },
    { key: 'maxTokens', label: 'Макс. токенов', type: 'slider' as const, min: 100, max: 2000, default: 800 },
]

interface Message {
    role: 'user' | 'ai'
    text: string
    id: number
}

export default function AiChat() {
    const navigate = useNavigate()
    const { hapticFeedback } = useTelegram()
    const { generate, loading } = useReplicate()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [params, setParams] = useState<Record<string, any>>({ temperature: 0.7, maxTokens: 800 })
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const idRef = useRef(0)

    const setParam = (key: string, val: any) => setParams(p => ({ ...p, [key]: val }))

    const handleSend = async () => {
        if (!input.trim() || loading) return
        hapticFeedback('medium')

        const userMsg: Message = { role: 'user', text: input.trim(), id: ++idRef.current }
        setMessages(prev => [...prev, userMsg])
        const prompt = input.trim()
        setInput('')

        const result = await generate({ type: 'gemini_chat', prompt, ...params })
        hapticFeedback('light')

        if (result?.output_urls?.[0]) {
            const aiMsg: Message = { role: 'ai', text: result.output_urls[0], id: ++idRef.current }
            setMessages(prev => [...prev, aiMsg])
        }
    }

    const handleCopy = async (text: string, id: number) => {
        hapticFeedback('light')
        await copyText(text)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleSendToChat = (text: string) => {
        hapticFeedback('medium')
        sendToTelegramChat('text', { text })
    }

    return (
        <div className="min-h-screen flex flex-col pb-24 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-6 pb-4">
                <button onClick={() => navigate('/')} className="w-10 h-10 rounded-xl bg-bg-card border border-accent-primary/20 flex items-center justify-center text-txt-secondary">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="font-heading text-xl font-bold text-txt-primary">💬 AI Chat</h1>
                    <p className="text-txt-muted text-xs">google/gemini-3-flash</p>
                </div>
            </div>

            {/* Params */}
            <div className="px-4 mb-2">
                <ParamPanel params={MODEL_PARAMS} values={params} onChange={setParam} />
            </div>

            {/* Messages */}
            <div className="flex-1 px-4 space-y-3 overflow-y-auto">
                {messages.length === 0 && (
                    <div className="text-center py-12">
                        <MessageCircle size={48} className="text-accent-primary/30 mx-auto mb-4" />
                        <p className="text-txt-muted text-sm">Задайте любой вопрос</p>
                    </div>
                )}
                <AnimatePresence>
                    {messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] relative ${msg.role === 'user'
                                ? 'bg-accent-primary text-white rounded-2xl rounded-tr-sm px-4 py-3'
                                : 'glass-card px-4 py-3 rounded-2xl rounded-tl-sm'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                {msg.role === 'ai' && (
                                    <div className="flex gap-2 mt-2 pt-2 border-t border-accent-primary/10">
                                        <button onClick={() => handleCopy(msg.text, msg.id)} className="flex items-center gap-1 text-txt-muted text-xs hover:text-accent-primary transition-colors">
                                            {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                            {copiedId === msg.id ? 'Скопировано' : 'Копировать'}
                                        </button>
                                        <button onClick={() => handleSendToChat(msg.text)} className="flex items-center gap-1 text-txt-muted text-xs hover:text-accent-primary transition-colors">
                                            <Send size={12} />В чат
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {loading && (
                    <div className="flex justify-start">
                        <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
                            <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                    <motion.div key={i} className="w-1.5 h-1.5 bg-accent-primary rounded-full"
                                        animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="px-4 pt-3">
                <div className="flex gap-2 items-end">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                        placeholder="Написать сообщение..."
                        rows={1}
                        className="flex-1 bg-bg-card border border-accent-primary/20 rounded-2xl px-4 py-3 text-txt-primary text-sm resize-none outline-none focus:border-accent-primary/50 transition-colors max-h-32"
                        style={{ minHeight: '48px' }}
                    />
                    <button onClick={handleSend} disabled={loading || !input.trim()} className="w-12 h-12 rounded-2xl bg-accent-primary flex items-center justify-center text-white disabled:opacity-50 flex-shrink-0 shadow-lg active:scale-95 transition-transform">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
