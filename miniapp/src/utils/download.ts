export const downloadImage = async (url: string, filename: string = 'image.png') => {
    try {
        // Try fetching as a blob to force download instead of opening a new tab
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        console.error('Failed to download image as blob, falling back to window.open', e);
        // Fallback for CORS issues
        window.open(url, '_blank');
    }
};
