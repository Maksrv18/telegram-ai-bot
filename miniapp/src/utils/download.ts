export const downloadImage = async (url: string, filename: string = 'file') => {
    try {
        const downloadUrl = `/api/download?url=${encodeURIComponent(url)}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch {
        // Fallback: open in new tab
        window.open(url, '_blank');
    }
};

export const copyText = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

export const sendToTelegramChat = (type: 'image' | 'video' | 'audio' | 'text', data: { url?: string; text?: string; prompt?: string }) => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.sendData) {
        // fallback: open url
        if (data.url) window.open(data.url, '_blank');
        return;
    }
    tg.sendData(JSON.stringify({ type, ...data }));
};
