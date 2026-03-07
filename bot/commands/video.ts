import { Context } from "grammy";
import { replicateService } from "../../server/services/replicateService";
import * as storage from "../utils/storage";

export async function handleVideo(ctx: Context): Promise<void> {
    const text = ctx.message?.text || "";
    const prompt = text.replace(/^\/video\s*/i, "").trim();

    if (!prompt) {
        await ctx.reply(
            "🎬 *Генерация видео*\n\n" +
            "Отправь описание после команды:\n" +
            "`/video кот играет на пианино`\n\n" +
            "⏱ Генерация видео занимает 1-3 минуты",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const userId = ctx.from?.id;
    if (!userId) return;

    const genId = storage.createGeneration({
        userId,
        type: "video",
        model: "video_01",
        prompt,
    });

    const progressMsg = await ctx.reply(
        "🎬 Генерирую видео... Это может занять 1-3 минуты ⏳"
    );

    try {
        storage.incrementRequestCount(userId);
        const startTime = Date.now();
        const videoUrl = await replicateService.generateVideo(prompt);
        const processingTime = Date.now() - startTime;

        storage.updateGenerationStatus(
            genId,
            "done",
            [videoUrl],
            undefined,
            processingTime
        );

        try {
            await ctx.api.deleteMessage(ctx.chat!.id, progressMsg.message_id);
        } catch { }

        await ctx.replyWithVideo(videoUrl, {
            caption: `🎬 *${prompt}*\n⏱ ${(processingTime / 1000).toFixed(1)} сек | Minimax Video`,
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        storage.updateGenerationStatus(genId, "failed", undefined, errorMsg);
        try {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                progressMsg.message_id,
                `❌ Ошибка генерации видео: ${errorMsg}`
            );
        } catch {
            await ctx.reply(`❌ Ошибка генерации видео: ${errorMsg}`);
        }
    }
}
