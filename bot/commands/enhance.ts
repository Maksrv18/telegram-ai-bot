import { Context } from "grammy";
import { replicateService } from "../../server/services/replicateService";
import * as storage from "../utils/storage";

export async function handleEnhance(ctx: Context): Promise<void> {
    await ctx.reply(
        "✨ *Улучшение изображений*\n\n" +
        "Отправьте мне фотографию, и я улучшу её качество в 4x с помощью Real\\-ESRGAN\\.\n\n" +
        "Просто отправьте фото в чат\\!",
        { parse_mode: "MarkdownV2" }
    );
}

export async function processEnhance(
    ctx: Context,
    photoUrl: string
): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const genId = storage.createGeneration({
        userId,
        type: "upscale",
        model: "real_esrgan",
        inputUrl: photoUrl,
    });

    const progressMsg = await ctx.reply("✨ Улучшаю изображение (4x)...");

    try {
        storage.incrementRequestCount(userId);
        const startTime = Date.now();
        const result = await replicateService.upscaleImage(photoUrl, 4);
        const processingTime = Date.now() - startTime;

        storage.updateGenerationStatus(
            genId,
            "done",
            [result],
            undefined,
            processingTime
        );

        try {
            await ctx.api.deleteMessage(ctx.chat!.id, progressMsg.message_id);
        } catch { }

        await ctx.replyWithPhoto(result, {
            caption: `✨ *Улучшено в 4x*\n⏱ ${(processingTime / 1000).toFixed(1)} сек | Real-ESRGAN`,
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        storage.updateGenerationStatus(genId, "failed", undefined, errorMsg);
        try {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                progressMsg.message_id,
                `❌ Ошибка улучшения: ${errorMsg}`
            );
        } catch {
            await ctx.reply(`❌ Ошибка улучшения: ${errorMsg}`);
        }
    }
}
