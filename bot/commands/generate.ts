import { Context } from "grammy";
import { replicateService } from "../../server/services/replicateService";
import * as storage from "../utils/storage";

const progressMessages = [
    "🎨 Запускаю нейросеть...",
    "⚡ Обрабатываю запрос...",
    "🖌️ Рисую пиксели...",
    "✨ Почти готово...",
    "🔮 Финальные штрихи...",
];

export async function handleGenerate(ctx: Context): Promise<void> {
    const text = ctx.message?.text || "";
    const prompt = text.replace(/^\/generate\s*/i, "").trim();

    if (!prompt) {
        await ctx.reply(
            "🎨 *Генерация изображений*\n\n" +
            "Отправь промт после команды:\n" +
            "`/generate красивый закат над горами`\n\n" +
            "Поддерживаемые модели: FLUX Schnell ⚡",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const userId = ctx.from?.id;
    if (!userId) return;

    // Create generation record
    const genId = storage.createGeneration({
        userId,
        type: "image",
        model: "flux_schnell",
        prompt,
    });

    // Send progress message
    const progressMsg = await ctx.reply("🎨 Запускаю нейросеть...");

    // Start progress updates
    let progressIndex = 0;
    const progressInterval = setInterval(async () => {
        progressIndex = (progressIndex + 1) % progressMessages.length;
        try {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                progressMsg.message_id,
                progressMessages[progressIndex]
            );
        } catch {
            // Ignore edit errors
        }
    }, 3000);

    try {
        storage.incrementRequestCount(userId);

        const startTime = Date.now();
        const images = await replicateService.generateImage(prompt, {
            model: "flux_schnell",
            numOutputs: 1,
            aspectRatio: "1:1",
        });

        clearInterval(progressInterval);
        const processingTime = Date.now() - startTime;

        storage.updateGenerationStatus(
            genId,
            "done",
            images,
            undefined,
            processingTime
        );

        // Delete progress message
        try {
            await ctx.api.deleteMessage(ctx.chat!.id, progressMsg.message_id);
        } catch {
            // Ignore
        }

        // Send result
        for (const imageUrl of images) {
            await ctx.replyWithPhoto(imageUrl, {
                caption: `🎨 *${prompt}*\n⏱ ${(processingTime / 1000).toFixed(1)} сек | FLUX Schnell ⚡`,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 Ещё раз", callback_data: `regen:${genId}` },
                            { text: "✨ Улучшить", callback_data: `upscale:${genId}` },
                        ],
                    ],
                },
            });
        }
    } catch (err) {
        clearInterval(progressInterval);
        const errorMsg = err instanceof Error ? err.message : String(err);
        storage.updateGenerationStatus(genId, "failed", undefined, errorMsg);

        try {
            await ctx.api.editMessageText(
                ctx.chat!.id,
                progressMsg.message_id,
                `❌ Ошибка генерации: ${errorMsg}`
            );
        } catch {
            await ctx.reply(`❌ Ошибка генерации: ${errorMsg}`);
        }
    }
}
