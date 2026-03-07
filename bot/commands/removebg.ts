import { Context } from "grammy";
import { replicateService } from "../../server/services/replicateService";
import * as storage from "../utils/storage";

export async function handleRemoveBg(ctx: Context): Promise<void> {
    await ctx.reply(
        "🪄 *Удаление фона*\n\n" +
        "Отправьте мне фотографию, и я уберу с неё фон\\.\n\n" +
        "Просто отправьте фото в чат\\!",
        { parse_mode: "MarkdownV2" }
    );
}

export async function processRemoveBg(
    ctx: Context,
    photoUrl: string
): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId) return;

    const genId = storage.createGeneration({
        userId,
        type: "removebg",
        model: "rembg",
        inputUrl: photoUrl,
    });

    const progressMsg = await ctx.reply("🪄 Убираю фон...");

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
            caption: `🪄 *Фон удалён*\n⏱ ${(processingTime / 1000).toFixed(1)} сек | RemBG`,
            parse_mode: "Markdown",
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        storage.updateGenerationStatus(genId, "failed", undefined, errorMsg);
        try {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                progressMsg.message_id,
                `❌ Ошибка удаления фона: ${errorMsg}`
            );
        } catch {
            await ctx.reply(`❌ Ошибка удаления фона: ${errorMsg}`);
        }
    }
}
