import { Router, Request, Response } from "express";
import { InputMediaPhoto } from "grammy/types";

export let botInstance: any = null;

export function setBotInstance(bot: any): void {
    botInstance = bot;
}

const router = Router();

// Telegram webhook — receives updates from Telegram
router.post("/", async (req: Request, res: Response) => {
    if (!botInstance) {
        res.status(500).json({ error: "Bot not initialized" });
        return;
    }

    try {
        // Handle web_app_data from Mini App (sendData)
        const update = req.body;
        if (update?.message?.web_app_data?.data) {
            await handleMiniAppData(update.message.chat.id, update.message.web_app_data.data);
            res.sendStatus(200);
            return;
        }

        await botInstance.handleUpdate(update);
        res.sendStatus(200);
    } catch (err) {
        console.error("Webhook error:", err);
        res.sendStatus(500);
    }
});

// Send AI result to Telegram chat
async function handleMiniAppData(chatId: number, rawData: string) {
    if (!botInstance) return;

    try {
        const data = JSON.parse(rawData);
        const { type, url, text, prompt } = data;

        if (type === "image" && url) {
            await botInstance.api.sendPhoto(chatId, url, {
                caption: prompt ? `🎨 ${prompt}` : "🖼 AI Generated Image",
            });
        } else if (type === "video" && url) {
            await botInstance.api.sendVideo(chatId, url, {
                caption: prompt ? `🎬 ${prompt}` : "🎬 AI Generated Video",
            });
        } else if (type === "audio" && url) {
            await botInstance.api.sendAudio(chatId, url, {
                caption: prompt ? `🎙 ${prompt}` : "🎙 AI Generated Audio",
            });
        } else if (type === "text" && text) {
            await botInstance.api.sendMessage(chatId, `💬 **AI ответ:**\n\n${text}`, {
                parse_mode: "Markdown",
            });
        }
    } catch (err) {
        console.error("MiniApp data handler error:", err, rawData);
        try {
            await botInstance.api.sendMessage(chatId, "❌ Не удалось отправить результат. Попробуйте снова.");
        } catch { }
    }
}

export default router;
