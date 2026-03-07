import crypto from "crypto";

export function validateTelegramWebAppData(initData: string): boolean {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get("hash");
        if (!hash) return false;

        params.delete("hash");

        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");

        const secretKey = crypto
            .createHmac("sha256", "WebAppData")
            .update(process.env.TELEGRAM_BOT_TOKEN!)
            .digest();

        const expectedHash = crypto
            .createHmac("sha256", secretKey)
            .update(dataCheckString)
            .digest("hex");

        return hash === expectedHash;
    } catch {
        return false;
    }
}

export function parseTelegramUser(
    initData: string
): { id: number; first_name: string; username?: string } | null {
    try {
        const params = new URLSearchParams(initData);
        const userStr = params.get("user");
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}
