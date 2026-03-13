import { useState, useCallback } from 'react'
import axios from 'axios'
import { useTelegram } from './useTelegram'

const api = axios.create({ baseURL: '/api' })

export interface GenerateOptions {
    type: 'image' | 'video' | 'tts' | 'removebg' | 'videotranslate' | 'chat' | 'gemini_chat' | 'upscale'
    prompt?: string
    model?: string
    imageUrl?: string
    videoUrl?: string
    aspectRatio?: string
    numOutputs?: number
    targetLanguage?: string
    // Extra model params
    negativePrompt?: string
    guidanceScale?: number
    duration?: number
    voice?: string
    speed?: number
    speakerGender?: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    options?: Record<string, any>
}

export interface GenerationResult {
    id: number
    user_id: number
    type: string
    model: string
    prompt: string | null
    output_urls: string[] | null
    status: string
    error_message: string | null
    processing_time: number | null
    created_at: string
}

export function useReplicate() {
    const { initData } = useTelegram()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<GenerationResult | null>(null)

    const generate = useCallback(async (options: GenerateOptions): Promise<GenerationResult | null> => {
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const headers: Record<string, string> = {}
            if (initData) headers['x-telegram-init-data'] = initData

            let responseData;

            try {
                const res = await api.post('/generate', options, { headers })
                responseData = res.data;
            } catch (err: any) {
                if (err.response?.status === 402 && err.response?.data?.requirePayment) {
                    // Try to generate invoice and pay
                    try {
                        const invoiceRes = await api.post('/invoice', {}, { headers });
                        const link = invoiceRes.data.invoiceLink;

                        const tg = window.Telegram?.WebApp;
                        if (tg?.openInvoice) {
                            const paymentStatus = await new Promise((resolve) => {
                                tg.openInvoice(link, (status: string) => resolve(status));
                            });

                            if (paymentStatus === 'paid') {
                                // Wait a tiny bit for webhook to process the balance
                                await new Promise(r => setTimeout(r, 1500));
                                // Retry generate
                                const retryRes = await api.post('/generate', options, { headers })
                                responseData = retryRes.data;
                            } else {
                                throw new Error('Оплата отменена');
                            }
                        } else {
                            throw new Error('Telegram WebApp API недоступен');
                        }
                    } catch (paymentErr: any) {
                        throw new Error(paymentErr.message || 'Ошибка оплаты');
                    }
                } else {
                    throw err; // Re-throw any non-402 errors
                }
            }

            const generationId = responseData.generationId

            let gen: GenerationResult | null = null
            let attempts = 0
            const maxAttempts = 150 // 5 minutes

            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000))
                const { data: status } = await api.get(`/generation/${generationId}`, { headers })

                if (status.status === 'done') { gen = status; break }
                else if (status.status === 'failed') throw new Error(status.error_message || 'Generation failed')
                attempts++
            }

            if (!gen) throw new Error('Generation timed out')

            setResult(gen)
            setLoading(false)
            return gen
        } catch (err: any) {
            const message = err.response?.data?.error || err instanceof Error ? err.message : 'Unknown error'
            setError(message)
            setLoading(false)
            return null
        }
    }, [initData])

    const reset = useCallback(() => { setLoading(false); setError(null); setResult(null) }, [])

    return { generate, loading, error, result, reset }
}

export function useModels() {
    const [models, setModels] = useState<any>(null)
    const fetchModels = useCallback(async () => {
        try {
            const { data } = await api.get('/models')
            setModels(data)
        } catch { console.error('Failed to fetch models') }
    }, [])
    return { models, fetchModels }
}
