import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import { useTelegram } from './useTelegram'

interface HistoryItem {
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

export function useHistory() {
    const { initData } = useTelegram()
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(false)

    const fetchHistory = useCallback(async () => {
        setLoading(true)
        try {
            const headers: Record<string, string> = {}
            if (initData) {
                headers['x-telegram-init-data'] = initData
            }
            const { data } = await axios.get('/api/history', { headers })
            setHistory(data)
        } catch {
            console.error('Failed to fetch history')
        }
        setLoading(false)
    }, [initData])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    return { history, loading, refresh: fetchHistory }
}
