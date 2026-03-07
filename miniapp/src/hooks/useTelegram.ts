import { useEffect, useCallback } from 'react'

declare global {
    interface Window {
        Telegram: {
            WebApp: any
        }
    }
}

export const useTelegram = () => {
    const tg = window.Telegram?.WebApp

    useEffect(() => {
        if (tg) {
            tg.ready()
            tg.expand()
            tg.setHeaderColor('#0A0A0F')
            tg.setBackgroundColor('#0A0A0F')
        }
    }, [])

    const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
        try {
            tg?.HapticFeedback?.impactOccurred(type)
        } catch { }
    }, [tg])

    const showAlert = useCallback((message: string) => {
        if (tg) {
            tg.showAlert(message)
        } else {
            alert(message)
        }
    }, [tg])

    return {
        tg,
        user: tg?.initDataUnsafe?.user,
        initData: tg?.initData || '',
        isExpanded: tg?.isExpanded,
        colorScheme: tg?.colorScheme || 'dark',
        hapticFeedback,
        showAlert,
        close: () => tg?.close(),
    }
}
