import { Context } from "grammy";
import { replicateService } from "../../server/services/replicateService";
import * as storage from "../utils/storage";

export async function handleEnhance(ctx: Context): Promise<void> {
    await ctx.reply(
        "🪄 *Удаление фона*\n\n" +
        "Отправьте мне фотографию, и я вырежу фон с помощью ИИ\\.\n\n" +
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
        type: "removebg",
        model: "bria_removebg",
        inputUrl: photoUrl,
    });

    const progressMsg = await ctx.reply("🪄 Удаляю фон...");

    try {
        storage.incrementRequestCount(userId);
        const startTime = Date.now();
        const result = await replicateService.removeBg(photoUrl);
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
            caption: `🪄 *Фон удалён*\n⏱ ${(processingTime / 1000).toFixed(1)} сек | bria/remove-background`,
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        storage.updateGenerationStatus(genId, "failed", undefined, errorMsg);
        try {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                progressMsg.message_id,
                `❌ Ошибка: ${errorMsg}`
            );
        } catch {
            await ctx.reply(`❌ Ошибка: ${errorMsg}`);
        }
    }
}
