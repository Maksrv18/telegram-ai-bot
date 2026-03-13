import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { Bot, Context, session } from "grammy";
import { handleStart } from "./commands/start";
import { handleGenerate } from "./commands/generate";
import { handleEnhance, processEnhance } from "./commands/enhance";
import { handleRemoveBg, processRemoveBg } from "./commands/removebg";
import { handleVideo } from "./commands/video";
import { authMiddleware } from "./middlewares/auth";
import { rateLimitMiddleware } from "./middlewares/rateLimit";
import { loggerMiddleware } from "./middlewares/logger";
import { replicateService } from "../server/services/replicateService";
import * as storage from "./utils/storage";

interface SessionData {
    state: "idle" | "waiting_prompt" | "waiting_photo" | "processing";
    pendingAction: string | null;
    lastPhotoFileId: string | null;
}

type BotContext = Context & { session: SessionData };

export function createBot(): Bot<BotContext> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN is required in .env");
    }

    const bot = new Bot<BotContext>(token);

    // Session
    bot.use(
        session({
            initial: (): SessionData => ({
                state: "idle",
                pendingAction: null,
                lastPhotoFileId: null,
            }),
        })
    );

    // Middlewares
    bot.use(loggerMiddleware);
    bot.use(authMiddleware);
    bot.use(rateLimitMiddleware);

    // Commands
    bot.command("start", handleStart);
    bot.command("image", handleGenerate);
    bot.command("enhance", handleEnhance);
    bot.command("removebg", handleRemoveBg);
    bot.command("video", handleVideo);

    // --- Payment Handlers ---
    bot.on("pre_checkout_query", async (ctx) => {
        // Approve all checkouts from our bot
        await ctx.answerPreCheckoutQuery(true);
    });

    bot.on("message:successful_payment", async (ctx) => {
        const payment = ctx.message.successful_payment;
        if (!payment) return;

        const telegramId = ctx.from.id;
        const amount = payment.total_amount; // 1 Star
        const chargeId = payment.telegram_payment_charge_id;

        // Ensure user exists
        storage.getOrCreateUser(telegramId, ctx.from.username, ctx.from.first_name);

        // Record payment. If it's a duplicate webhook, recordPayment will return false
        const recorded = storage.recordPayment(telegramId, chargeId, amount);

        if (recorded) {
            storage.addStars(telegramId, amount);
            await ctx.reply(`✅ Оплата успешно прошла! На ваш баланс зачислена 1 ⭐️.`);
        }
    });

    bot.command("chat", async (ctx) => {
        const text = ctx.message?.text || "";
        const question = text.replace(/^\/chat\s*/i, "").trim();

        if (!question) {
            await ctx.reply(
                "💬 *AI Chat*\n\nОтправь вопрос после команды:\n`/chat Что такое нейросеть?`",
                { parse_mode: "Markdown" }
            );
            return;
        }

        const progressMsg = await ctx.reply("💬 Думаю...");

        try {
            if (ctx.from) storage.incrementRequestCount(ctx.from.id);
            const response = await replicateService.chat(question);

            try {
                await ctx.api.deleteMessage(ctx.chat!.id, progressMsg.message_id);
            } catch { }

            await ctx.reply(`💬 ${response}`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
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
    });

    bot.command("history", async (ctx) => {
        if (!ctx.from) return;

        const history = storage.getUserHistory(ctx.from.id, 10);
        if (history.length === 0) {
            await ctx.reply("📭 У вас пока нет генераций.");
            return;
        }

        const typeEmoji: Record<string, string> = {
            image: "🎨",
            video: "🎬",
            upscale: "✨",
            removebg: "🪄",
            chat: "💬",
        };

        let message = "📊 *Последние генерации:*\n\n";
        history.forEach((gen, i) => {
            const emoji = typeEmoji[gen.type] || "📎";
            const status = gen.status === "done" ? "✅" : gen.status === "failed" ? "❌" : "⏳";
            const time = new Date(gen.created_at).toLocaleString("ru-RU");
            const prompt = gen.prompt
                ? gen.prompt.substring(0, 40) + (gen.prompt.length > 40 ? "..." : "")
                : gen.type;
            message += `${i + 1}. ${emoji} ${status} ${prompt}\n   ${time}\n\n`;
        });

        await ctx.reply(message, { parse_mode: "Markdown" });
    });

    bot.command("help", async (ctx) => {
        await ctx.reply(
            "📖 *Команды бота:*\n\n" +
            "🎨 `/image <промт>` — Генерация изображения\n" +
            "✨ `/enhance` — Улучшить фото \\(отправьте фото\\)\n" +
            "🪄 `/removebg` — Убрать фон \\(отправьте фото\\)\n" +
            "🎬 `/video <описание>` — Генерация видео\n" +
            "💬 `/chat <вопрос>` — Спросить AI\n" +
            "📊 `/history` — История генераций\n\n" +
            "Или просто отправьте фото для выбора действия\\!",
            { parse_mode: "MarkdownV2" }
        );
    });

    // Handle data from Mini App
    bot.on("message:web_app_data", async (ctx) => {
        try {
            const data = JSON.parse(ctx.message.web_app_data.data);
            const { type, url, prompt, text } = data;

            if (type === 'image' && url) {
                await ctx.replyWithPhoto(url, { caption: prompt || "🎨 Сгенерировано в AI Studio" });
            } else if (type === 'video' && url) {
                await ctx.replyWithVideo(url, { caption: prompt || "🎬 Сгенерировано в AI Studio" });
            } else if (type === 'audio' && url) {
                await ctx.replyWithAudio(url, { caption: prompt || "🎙️ Сгенерировано в AI Studio" });
            } else if (type === 'text' && text) {
                await ctx.reply(text);
            }
        } catch (err) {
            console.error("WebAppData error:", err);
            await ctx.reply("❌ Ошибка при получении данных из приложения.");
        }
    });

    // Photo handler
    bot.on("message:photo", async (ctx) => {
        const photo = ctx.message.photo;
        const fileId = photo[photo.length - 1].file_id;

        // Save to session
        ctx.session.lastPhotoFileId = fileId;
        ctx.session.state = "waiting_photo";

        await ctx.reply("Что сделать с фото?", {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "✨ Улучшить качество (4x)",
                            callback_data: "action_upscale",
                        },
                    ],
                    [{ text: "🪄 Убрать фон", callback_data: "action_removebg" }],
                ],
            },
        });
    });

    // Callback queries
    bot.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data;
        await ctx.answerCallbackQuery();

        // Photo action handlers
        if (data === "action_upscale" || data === "action_removebg") {
            const fileId = ctx.session.lastPhotoFileId;
            if (!fileId) {
                await ctx.reply("❌ Фото не найдено. Отправьте фото ещё раз.");
                return;
            }

            const file = await ctx.api.getFile(fileId);
            const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

            if (data === "action_upscale") {
                await processEnhance(ctx, photoUrl);
            } else {
                await processRemoveBg(ctx, photoUrl);
            }

            ctx.session.state = "idle";
            ctx.session.lastPhotoFileId = null;
            return;
        }

        // Menu handlers
        if (data === "menu_generate") {
            await ctx.reply(
                "🎨 Отправьте промт:\n`/image ваше описание`",
                { parse_mode: "Markdown" }
            );
        } else if (data === "menu_enhance") {
            await handleEnhance(ctx);
        } else if (data === "menu_removebg") {
            await handleRemoveBg(ctx);
        } else if (data === "menu_video") {
            await ctx.reply(
                "🎬 Отправьте описание:\n`/video ваше описание`",
                { parse_mode: "Markdown" }
            );
        }
    });

    // Error handling
    bot.catch((err) => {
        console.error("Bot error:", err);
    });

    return bot;
}

export function startBot(bot: Bot<BotContext>): void {
    // Set commands menu
    bot.api.setMyCommands([
        { command: "start", description: "🚀 Начать" },
        { command: "image", description: "🎨 Генерация изображения" },
        { command: "enhance", description: "✨ Улучшить фото" },
        { command: "removebg", description: "🪄 Убрать фон" },
        { command: "video", description: "🎬 Генерация видео" },
        { command: "chat", description: "💬 Спросить AI" },
        { command: "history", description: "📊 История" },
        { command: "help", description: "📖 Помощь" },
    ]);

    // Start long polling
    bot.start({
        onStart: () => {
            console.log("🤖 Bot is running!");
        },
    });
}

// Allow running bot standalone
if (require.main === module) {
    const bot = createBot();
    startBot(bot);
}
